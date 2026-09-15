import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import type { Period, Granularity } from "./period";
import { bucketStarts, bucketLabel, formatIso } from "./period";

/* ══════════════════════════════════════════════════════════════════════════
   INSTRUMENTATION
   ──────────────────────────────────────────────────────────────────────────
   Every figure in this file is read from the ledger. Where the ledger cannot
   answer — visits, product views, abandoned carts — the instrument says so
   (see MEASUREMENT_GAPS in ./metrics) instead of drawing a plausible number.
   ══════════════════════════════════════════════════════════════════════════ */

export type Row = Record<string, unknown>;

export async function rows<T = Row>(query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  const list = Array.isArray(result) ? result : ((result as unknown as { rows?: unknown[] }).rows ?? []);
  return list as T[];
}

export function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export const dtFmt = (millimes: number, digits = 3) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(millimes / 1000);

/* ── Time series for every measure, in two queries ───────────────────────── */

export type Point = { at: string; label: string; value: number };
export type SeriesKey = "revenue" | "orders" | "units" | "aov" | "customers" | "refunds" | "discounts";
export type SeriesBundle = Record<SeriesKey, Point[]>;

type Bucket = { revenue: number; orders: number; refunds: number; discounts: number; buyers: number; units: number };

export async function seriesBundle(p: Period): Promise<SeriesBundle> {
  const grain: Granularity = p.granularity;
  const orderRows = await rows<{ at: Date; revenue: number; orders: number; refunds: number; discounts: number; buyers: number }>(sql`
    SELECT date_trunc(${grain}, created_at) AS at,
      COALESCE(SUM(total_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS revenue,
      COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS orders,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'refunded'), 0) AS refunds,
      COALESCE(SUM(discount_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS discounts,
      COUNT(DISTINCT user_id) FILTER (WHERE status <> 'cancelled' AND user_id IS NOT NULL)::int AS buyers
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to} GROUP BY 1`);
  const unitRows = await rows<{ at: Date; units: number }>(sql`
    SELECT date_trunc(${grain}, o.created_at) AS at, COALESCE(SUM(oi.quantity), 0)::int AS units
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at BETWEEN ${p.from} AND ${p.to} AND o.status <> 'cancelled' GROUP BY 1`);

  const key = (d: Date) => new Date(d).toISOString();
  const map = new Map<string, Bucket>();
  for (const r of orderRows) map.set(key(r.at), { revenue: num(r.revenue), orders: num(r.orders), refunds: num(r.refunds), discounts: num(r.discounts), buyers: num(r.buyers), units: 0 });
  for (const r of unitRows) {
    const b = map.get(key(r.at)) ?? { revenue: 0, orders: 0, refunds: 0, discounts: 0, buyers: 0, units: 0 };
    b.units = num(r.units);
    map.set(key(r.at), b);
  }

  const empty: Bucket = { revenue: 0, orders: 0, refunds: 0, discounts: 0, buyers: 0, units: 0 };
  const out: SeriesBundle = { revenue: [], orders: [], units: [], aov: [], customers: [], refunds: [], discounts: [] };
  for (const start of bucketStarts(p)) {
    const b = map.get(key(start)) ?? empty;
    const label = bucketLabel(start, grain);
    const push = (k: SeriesKey, value: number) => out[k].push({ at: start.toISOString(), label, value });
    push("revenue", b.revenue);
    push("orders", b.orders);
    push("units", b.units);
    push("aov", b.orders ? Math.round(b.revenue / b.orders) : 0);
    push("customers", b.buyers);
    push("refunds", b.refunds);
    push("discounts", b.discounts);
  }
  return out;
}

/* ── Orders by weekday and hour — when the house actually sells ──────────── */

export async function tradingRhythm(days = 56) {
  const from = new Date(Date.now() - days * 86_400_000);
  const r = await rows<{ dow: number; hour: number; n: number; value: number }>(sql`
    SELECT EXTRACT(DOW FROM created_at)::int AS dow, EXTRACT(HOUR FROM created_at)::int AS hour,
      COUNT(*)::int AS n, COALESCE(SUM(total_millimes), 0) AS value
    FROM orders WHERE created_at >= ${from} AND status <> 'cancelled'
    GROUP BY 1, 2`);
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const row of r) {
    const d = num(row.dow);
    const h = num(row.hour);
    if (d >= 0 && d < 7 && h >= 0 && h < 24) matrix[d][h] += num(row.n);
  }
  const byHour = Array.from({ length: 24 }, (_, h) => matrix.reduce((a, row) => a + row[h], 0));
  const peakHour = byHour.indexOf(Math.max(...byHour));
  const byDay = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const peakDay = byDay.indexOf(Math.max(...byDay));
  return {
    matrix,
    rowLabels: DAYS.map((d) => d.slice(0, 3)),
    days: DAYS,
    colLabels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}`),
    byHour,
    byDay,
    peakDay,
    peakHour,
    windowDays: days,
    sample: r.reduce((a, x) => a + num(x.n), 0),
  };
}

/* ── The day's timeline, from every ledger that carries a timestamp ─────── */

export type TimelineKind = "order" | "payment" | "fulfilment" | "stock" | "customer" | "review" | "support" | "return" | "email" | "search" | "admin" | "loyalty" | "wishlist";

export type TimelineEvent = {
  key: string;
  at: Date;
  kind: TimelineKind;
  title: string;
  detail: string | null;
  href: string | null;
  value: number | null;
  tone: "neutral" | "good" | "warn" | "bad";
  actor: string | null;
};

export const TIMELINE_KINDS: { key: TimelineKind; label: string; hint: string }[] = [
  { key: "order", label: "Commandes", hint: "Commandes passées" },
  { key: "payment", label: "Paiements", hint: "Règlements et statuts de paiement" },
  { key: "fulfilment", label: "Expédition", hint: "Avancement des commandes" },
  { key: "stock", label: "Stock", hint: "Entrées, sorties, ajustements" },
  { key: "customer", label: "Clientes", hint: "Nouveaux comptes" },
  { key: "wishlist", label: "Listes d'envie", hint: "Ajouts à la liste d'envie" },
  { key: "review", label: "Avis", hint: "Avis déposés" },
  { key: "support", label: "Support", hint: "Demandes et réponses" },
  { key: "return", label: "Retours", hint: "Demandes de retour" },
  { key: "email", label: "E-mails", hint: "Lettres envoyées ou en échec" },
  { key: "loyalty", label: "Fidélité", hint: "Points gagnés et dépensés" },
  { key: "search", label: "Recherches", hint: "Ce que les clientes ont cherché" },
  { key: "admin", label: "Administration", hint: "Actions de l'équipe" },
];

export async function timeline(options: { from: Date; to: Date; kinds?: TimelineKind[]; limit?: number; offset?: number }): Promise<TimelineEvent[]> {
  const { from, to, kinds, limit = 120, offset = 0 } = options;
  const allow = kinds?.length ? sql`AND kind IN (${sql.join(kinds.map((k) => sql`${k}`), sql`, `)})` : sql``;
  const r = await rows<Row>(sql`
    WITH feed AS (
      SELECT 'order' AS kind, o.id AS ref, o.created_at AS at,
        'Commande ' || o.number AS title,
        COALESCE(o.shipping_address->>'fullName', o.email) AS detail,
        '/admin/commandes/' || o.id AS href, o.total_millimes AS value,
        CASE WHEN o.status = 'cancelled' THEN 'bad' ELSE 'neutral' END AS tone,
        NULL::text AS actor
      FROM orders o WHERE o.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'payment', o.id, o.updated_at,
        'Paiement ' || o.number || ' — ' || o.payment_status,
        o.payment_method::text || ' · ' || o.status::text, '/admin/commandes/' || o.id, o.total_millimes,
        CASE WHEN o.payment_status = 'failed' THEN 'bad' WHEN o.payment_status = 'paid' THEN 'good' ELSE 'warn' END, NULL
      FROM orders o WHERE o.updated_at BETWEEN ${from} AND ${to} AND o.updated_at <> o.created_at
      UNION ALL
      SELECT 'fulfilment', o.id, e.created_at,
        'Commande ' || o.number || ' · ' || e.status::text,
        COALESCE(e.message, 'Mise à jour de statut'), '/admin/commandes/' || o.id, NULL,
        CASE WHEN e.status::text IN ('cancelled','returned') THEN 'bad' WHEN e.status::text = 'delivered' THEN 'good' ELSE 'neutral' END,
        NULLIF(u.first_name || ' ' || u.last_name, ' ')
      FROM order_events e JOIN orders o ON o.id = e.order_id
      LEFT JOIN users u ON u.id = e.actor_id
      WHERE e.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'stock', m.product_id, m.created_at,
        (CASE WHEN m.quantity >= 0 THEN 'Entrée de stock — ' ELSE 'Sortie de stock — ' END) || p.name,
        COALESCE(m.reason, m.type::text) || ' · stock ' || m.stock_after, '/admin/produits/' || p.id, m.quantity,
        CASE WHEN m.quantity >= 0 THEN 'good' ELSE 'neutral' END, NULL
      FROM inventory_movements m JOIN products p ON p.id = m.product_id
      WHERE m.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'customer', u.id, u.created_at, 'Compte créé — ' || u.first_name || ' ' || u.last_name, u.email, '/admin/clients/' || u.id, NULL, 'good', NULL
      FROM users u WHERE u.created_at BETWEEN ${from} AND ${to} AND u.role = 'customer'
      UNION ALL
      SELECT 'wishlist', w.product_id, w.created_at, 'Ajout à la liste d''envie — ' || p.name,
        COALESCE(u.first_name || ' ' || u.last_name, 'visiteuse'), '/admin/produits/' || p.id, p.price_millimes, 'neutral', NULL
      FROM wishlist_items w JOIN products p ON p.id = w.product_id LEFT JOIN users u ON u.id = w.user_id
      WHERE w.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'review', r.id, r.created_at, 'Avis ' || r.rating || '/5 — ' || COALESCE(r.title, 'sans titre'),
        r.author_name, '/admin/avis', r.rating, CASE WHEN r.status = 'pending' THEN 'warn' ELSE 'neutral' END, NULL
      FROM reviews r WHERE r.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'support', t.id, t.created_at, 'Message — ' || t.subject, t.name || ' · ' || t.type::text, '/admin/support', NULL,
        CASE WHEN t.priority = 'urgent' THEN 'bad' ELSE 'warn' END, NULL
      FROM support_tickets t WHERE t.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'support', m.ticket_id, m.created_at, 'Réponse support', NULLIF(m.author_name, '') || ' · ' || CASE WHEN m.is_bot THEN 'assistée' ELSE 'équipe' END, '/admin/support', NULL, 'neutral', NULL
      FROM ticket_messages m WHERE m.created_at BETWEEN ${from} AND ${to} AND m.is_bot = false
      UNION ALL
      SELECT 'return', r.id, r.created_at, 'Retour ' || r.number || ' — ' || r.reason, r.status::text, '/admin/support', NULL,
        CASE WHEN r.status = 'pending' THEN 'warn' ELSE 'neutral' END, NULL
      FROM return_requests r WHERE r.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'email', m.id, COALESCE(m.sent_at, m.send_at), 'Lettre ' || m.kind || ' → ' || m.to, m.subject, '/admin/emails', NULL,
        CASE WHEN m.status = 'failed' THEN 'bad' WHEN m.status = 'pending' THEN 'warn' ELSE 'good' END, NULL
      FROM email_outbox m WHERE COALESCE(m.sent_at, m.send_at) BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'loyalty', l.user_id, l.created_at,
        CASE WHEN l.points >= 0 THEN 'Points gagnés' ELSE 'Points dépensés' END || ' — ' || l.reason,
        COALESCE(u.first_name || ' ' || u.last_name, 'cliente'), '/admin/clients/' || l.user_id, l.points, 'neutral', NULL
      FROM loyalty_transactions l LEFT JOIN users u ON u.id = l.user_id
      WHERE l.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'search', s.id, s.created_at, 'Recherche « ' || s.query || ' »', s.results_count || ' résultat(s)', '/admin/analytique/recherche', s.results_count,
        CASE WHEN s.results_count = 0 THEN 'warn' ELSE 'neutral' END, NULL
      FROM search_events s WHERE s.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'admin', a.id, a.created_at, a.action || ' · ' || a.entity, COALESCE(NULLIF(u.first_name || ' ' || u.last_name, ''), 'système') || COALESCE(' · ' || a.entity_id, ''),
        '/admin/journal', NULL, 'neutral', NULLIF(u.first_name || ' ' || u.last_name, '')
      FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id WHERE a.created_at BETWEEN ${from} AND ${to}
    )
    SELECT * FROM feed WHERE 1 = 1 ${allow} ORDER BY at DESC LIMIT ${limit} OFFSET ${offset}`);

  return r.map((x) => ({
    key: `${String(x.kind)}-${String(x.ref)}-${new Date(x.at as string).getTime()}`,
    at: new Date(x.at as string),
    kind: x.kind as TimelineKind,
    title: String(x.title),
    detail: (x.detail as string | null) ?? null,
    href: (x.href as string | null) ?? null,
    value: x.value == null ? null : num(x.value),
    tone: (x.tone as TimelineEvent["tone"]) ?? "neutral",
    actor: (x.actor as string | null) ?? null,
  }));
}

/** Counts per nature for the day, so the filter chips can carry numbers. */
export async function timelineCounts(from: Date, to: Date): Promise<Record<string, number>> {
  const r = await rows<{ kind: string; n: number }>(sql`
    WITH feed AS (
      SELECT 'order' AS kind, created_at FROM orders WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'payment', updated_at FROM orders WHERE updated_at BETWEEN ${from} AND ${to} AND updated_at <> created_at
      UNION ALL SELECT 'fulfilment', created_at FROM order_events WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'stock', created_at FROM inventory_movements WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'customer', created_at FROM users WHERE created_at BETWEEN ${from} AND ${to} AND role = 'customer'
      UNION ALL SELECT 'wishlist', created_at FROM wishlist_items WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'review', created_at FROM reviews WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'support', created_at FROM support_tickets WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'return', created_at FROM return_requests WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'email', COALESCE(sent_at, send_at) FROM email_outbox WHERE COALESCE(sent_at, send_at) BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'loyalty', created_at FROM loyalty_transactions WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'search', created_at FROM search_events WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'admin', created_at FROM audit_logs WHERE created_at BETWEEN ${from} AND ${to}
    ) SELECT kind, COUNT(*)::int AS n FROM feed GROUP BY 1 ORDER BY 2 DESC`);
  const out: Record<string, number> = {};
  for (const row of r) out[row.kind] = num(row.n);
  return out;
}

/** Real events per hour across every ledger — the live view's own axis. */
export async function hourlyCounts(from: Date, to: Date): Promise<{ at: Date; n: number }[]> {
  const r = await rows<{ at: Date; n: number }>(sql`
    WITH feed AS (
      SELECT created_at FROM orders WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM order_events WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM inventory_movements WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM users WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM wishlist_items WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM reviews WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM support_tickets WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM return_requests WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT COALESCE(sent_at, send_at) FROM email_outbox WHERE COALESCE(sent_at, send_at) BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM loyalty_transactions WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM search_events WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT created_at FROM audit_logs WHERE created_at BETWEEN ${from} AND ${to}
    )
    SELECT date_trunc('hour', created_at) AS at, COUNT(*)::int AS n
    FROM feed WHERE created_at IS NOT NULL GROUP BY 1 ORDER BY 1`);
  return r.map((x) => ({ at: new Date(x.at as unknown as string), n: num(x.n) }));
}

/* ── Cohorts: do the clientes come back? ─────────────────────────────────── */

export type Cohort = { month: string; size: number; periods: (number | null)[]; retained: number };

export async function cohortRetention(months = 6): Promise<Cohort[]> {
  const r = await rows<{ cohort: Date; month: Date; n: number }>(sql`
    WITH firsts AS (
      SELECT user_id, date_trunc('month', MIN(created_at)) AS cohort
      FROM orders WHERE user_id IS NOT NULL AND status <> 'cancelled'
      GROUP BY user_id
    )
    SELECT f.cohort, date_trunc('month', o.created_at) AS month, COUNT(DISTINCT o.user_id)::int AS n
    FROM firsts f JOIN orders o ON o.user_id = f.user_id
    WHERE o.status <> 'cancelled'
    GROUP BY 1, 2 ORDER BY 1, 2`);
  const cohorts = new Map<number, { size: number; cells: Map<number, number> }>();
  for (const row of r) {
    const c = new Date(row.cohort as unknown as string);
    const key = c.getFullYear() * 12 + c.getMonth();
    const entry = cohorts.get(key) ?? { size: 0, cells: new Map<number, number>() };
    const m = new Date(row.month as unknown as string);
    const offset = m.getFullYear() * 12 + m.getMonth() - key;
    entry.cells.set(offset, num(row.n));
    if (offset === 0) entry.size = num(row.n);
    cohorts.set(key, entry);
  }
  const keys = [...cohorts.keys()].sort((a, b) => a - b).slice(-months);
  return keys.map((key) => {
    const entry = cohorts.get(key)!;
    const periods = Array.from({ length: months }, (_, i) => {
      const n = entry.cells.get(i);
      if (n == null || entry.size === 0) return i === 0 ? 100 : null;
      return Math.round((n / entry.size) * 100);
    });
    return {
      month: new Date(Math.floor(key / 12), key % 12, 1).toLocaleDateString("fr-TN", { month: "short", year: "2-digit" }),
      size: entry.size,
      periods,
      retained: entry.cells.get(months - 1) ?? entry.cells.get(months - 2) ?? 0,
    };
  });
}

/* ── Product signals: what the catalogue earns and what it fails to earn ── */

export type ProductSignal = {
  id: number;
  name: string;
  sku: string;
  image: string | null;
  status: string;
  price: number;
  stock: number;
  threshold: number;
  rating: number;
  ratings: number;
  media: number;
  wishes: number;
  orders: number;
  units: number;
  revenue: number;
  lastSale: Date | null;
  wishesNeverBought: number;
};

export async function productSignals(limit = 400): Promise<ProductSignal[]> {
  const r = await rows<Row>(sql`
    SELECT p.id, p.name, p.sku, p.image, p.status, p.price_millimes AS price, p.stock,
      p.low_stock_threshold AS threshold, p.rating_avg AS rating, p.rating_count AS ratings,
      (1 + COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(p.images) = 'array' THEN p.images ELSE '[]'::jsonb END), 0))::int AS media,
      (SELECT COUNT(*)::int FROM wishlist_items w WHERE w.product_id = p.id) AS wishes,
      (SELECT COUNT(*)::int FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS orders,
      (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS units,
      (SELECT COALESCE(SUM(oi.line_total_millimes), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS revenue,
      (SELECT MAX(o.created_at) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS last_sale,
      (SELECT COUNT(*)::int FROM wishlist_items w WHERE w.product_id = p.id
         AND NOT EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
                         WHERE oi.product_id = p.id AND o.user_id = w.user_id AND o.status <> 'cancelled')) AS never_bought
    FROM products p WHERE p.status <> 'archived' LIMIT ${limit}`);
  return r.map((x) => ({
    id: num(x.id),
    name: String(x.name),
    sku: String(x.sku),
    image: (x.image as string | null) ?? null,
    status: String(x.status),
    price: num(x.price),
    stock: num(x.stock),
    threshold: num(x.threshold),
    rating: num(x.rating) / 100,
    ratings: num(x.ratings),
    media: num(x.media),
    wishes: num(x.wishes),
    orders: num(x.orders),
    units: num(x.units),
    revenue: num(x.revenue),
    lastSale: x.last_sale ? new Date(x.last_sale as string) : null,
    wishesNeverBought: num(x.never_bought),
  }));
}

/* ── Fulfilment: how long each stage really takes ────────────────────────── */

export type StageDelay = { from: string; to: string; label: string; hours: number | null; sample: number };

export async function fulfilmentDelays(p: Period): Promise<{ stages: StageDelay[]; delivered: number; medianHours: number | null }> {
  const r = await rows<{ order_id: number; status: string; at: Date }>(sql`
    SELECT order_id, status::text AS status, MIN(created_at) AS at
    FROM order_events
    WHERE created_at BETWEEN ${p.from} AND ${p.to}
    GROUP BY 1, 2`);
  const byOrder = new Map<number, Map<string, number>>();
  for (const row of r) {
    const m = byOrder.get(num(row.order_id)) ?? new Map<string, number>();
    m.set(String(row.status), new Date(row.at as unknown as string).getTime());
    byOrder.set(num(row.order_id), m);
  }
  const steps: [string, string, string][] = [
    ["pending", "confirmed", "Validation du paiement"],
    ["confirmed", "preparing", "Entrée en préparation"],
    ["preparing", "shipped", "Préparation → expédition"],
    ["shipped", "delivered", "Livraison"],
  ];
  const stages: StageDelay[] = steps.map(([a, b, label]) => {
    const gaps: number[] = [];
    for (const m of byOrder.values()) {
      const t1 = m.get(a);
      const t2 = m.get(b);
      if (t1 != null && t2 != null && t2 >= t1) gaps.push((t2 - t1) / 3_600_000);
    }
    gaps.sort((x, y) => x - y);
    return { from: a, to: b, label, hours: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null, sample: gaps.length };
  });
  const delivered = [...byOrder.values()].filter((m) => m.has("delivered")).length;
  const total = [...byOrder.values()]
    .filter((m) => m.has("pending") && m.has("delivered"))
    .map((m) => (m.get("delivered")! - m.get("pending")!) / 3_600_000)
    .sort((a, b) => a - b);
  return { stages, delivered, medianHours: total.length ? total[Math.floor(total.length / 2)] : null };
}

/* ── Mail: what left the house, what failed, what waits ─────────────────── */

export type EmailOps = {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  byKind: { kind: string; sent: number; pending: number; failed: number; sample: Date | null }[];
  failures: { id: number; to: string; kind: string; error: string | null; at: Date | null; attempts: number }[];
  oldestPending: Date | null;
};

export async function emailOps(p: Period, limit = 40): Promise<EmailOps> {
  const [totals] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      MIN(send_at) FILTER (WHERE status = 'pending') AS oldest_pending
    FROM email_outbox WHERE created_at BETWEEN ${p.from} AND ${p.to}`);
  const byKind = await rows<Record<string, unknown>>(sql`
    SELECT kind, COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      MAX(COALESCE(sent_at, send_at)) AS sample
    FROM email_outbox WHERE created_at BETWEEN ${p.from} AND ${p.to} GROUP BY 1 ORDER BY 2 DESC, 1`);
  const failures = await rows<Record<string, unknown>>(sql`
    SELECT id, "to", kind, error, created_at AS at, attempts FROM email_outbox
    WHERE status = 'failed' AND created_at BETWEEN ${p.from} AND ${p.to}
    ORDER BY created_at DESC LIMIT ${limit}`);
  return {
    total: num(totals?.total),
    sent: num(totals?.sent),
    pending: num(totals?.pending),
    failed: num(totals?.failed),
    byKind: byKind.map((x) => ({ kind: String(x.kind), sent: num(x.sent), pending: num(x.pending), failed: num(x.failed), sample: x.sample ? new Date(x.sample as string) : null })),
    failures: failures.map((x) => ({
      id: num(x.id), to: String(x.to), kind: String(x.kind), error: (x.error as string | null) ?? null,
      at: x.at ? new Date(x.at as string) : null, attempts: num(x.attempts),
    })),
    oldestPending: totals?.oldest_pending ? new Date(totals.oldest_pending as string) : null,
  };
}

/* ── Promotions: what the codes actually cost and return ────────────────── */

export type PromoPulse = {
  code: string;
  label: string;
  type: string;
  value: number;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  redeemed: number;
  discountGiven: number;
  revenue: number;
  customers: number;
  basket: number;
};

export async function promoPulse(p: Period): Promise<PromoPulse[]> {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT pr.code, pr.label, pr.type, pr.value, pr.is_active, pr.usage_count, pr.usage_limit, pr.starts_at, pr.ends_at,
      COALESCE(o.n, 0)::int AS redeemed, COALESCE(o.discount, 0) AS discount_given,
      COALESCE(o.revenue, 0) AS revenue, COALESCE(o.customers, 0)::int AS customers, COALESCE(o.basket, 0) AS basket
    FROM promotions pr
    LEFT JOIN (
      SELECT promo_code, COUNT(*) AS n, SUM(discount_millimes) AS discount, SUM(total_millimes) AS revenue,
        COUNT(DISTINCT user_id) AS customers, AVG(total_millimes) AS basket
      FROM orders WHERE status <> 'cancelled' AND created_at BETWEEN ${p.from} AND ${p.to} AND promo_code IS NOT NULL
      GROUP BY promo_code
    ) o ON o.promo_code = pr.code
    ORDER BY COALESCE(o.discount, 0) DESC, pr.code`);
  return r.map((x) => ({
    code: String(x.code), label: String(x.label ?? x.code), type: String(x.type), value: num(x.value),
    isActive: Boolean(x.is_active),
    usageCount: num(x.usage_count), usageLimit: x.usage_limit == null ? null : num(x.usage_limit),
    startsAt: x.starts_at ? new Date(x.starts_at as string) : null,
    endsAt: x.ends_at ? new Date(x.ends_at as string) : null,
    redeemed: num(x.redeemed), discountGiven: num(x.discount_given), revenue: num(x.revenue),
    customers: num(x.customers), basket: num(x.basket),
  }));
}

/* ── Search: demand the catalogue may be missing ─────────────────────────── */

export type SearchPulse = {
  totals: { searches: number; zero: number; oos: number; unique: number };
  trending: { query: string; now: number; before: number; zero: number; landing: string | null }[];
  zeroQueries: { query: string; n: number; last: Date; landing: string | null }[];
  oosQueries: { query: string; n: number }[];
  recent: { query: string; at: Date; results: number; oos: number }[];
};

export async function searchPulse(days = 30): Promise<SearchPulse> {
  const from = new Date(Date.now() - days * 86_400_000);
  const half = new Date(Date.now() - (days / 2) * 86_400_000);
  const [totals] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS searches, COUNT(*) FILTER (WHERE results_count = 0)::int AS zero,
      COUNT(*) FILTER (WHERE out_of_stock)::int AS oos, COUNT(DISTINCT query)::int AS unique_q
    FROM search_events WHERE created_at >= ${from}`);
  const trending = await rows<Record<string, unknown>>(sql`
    SELECT query,
      COUNT(*) FILTER (WHERE created_at >= ${half})::int AS now,
      COUNT(*) FILTER (WHERE created_at < ${half})::int AS before,
      COUNT(*) FILTER (WHERE results_count = 0)::int AS zero,
      (SELECT href FROM query_landings ql WHERE LOWER(ql.query) = LOWER(s.query) LIMIT 1) AS landing
    FROM search_events s WHERE created_at >= ${from}
    GROUP BY query ORDER BY 2 DESC, 3 DESC LIMIT 24`);
  const zeroQueries = await rows<Record<string, unknown>>(sql`
    SELECT query, COUNT(*)::int AS n, MAX(created_at) AS last,
      (SELECT href FROM query_landings ql WHERE LOWER(ql.query) = LOWER(s.query) LIMIT 1) AS landing
    FROM search_events s WHERE created_at >= ${from} AND results_count = 0
    GROUP BY query ORDER BY 2 DESC LIMIT 20`);
  const oosQueries = await rows<Record<string, unknown>>(sql`
    SELECT query, COUNT(*)::int AS n FROM search_events
    WHERE created_at >= ${from} AND out_of_stock = true GROUP BY query ORDER BY 2 DESC LIMIT 12`);
  const recent = await rows<Record<string, unknown>>(sql`
    SELECT query, created_at AS at, results_count AS results, out_of_stock AS oos
    FROM search_events WHERE created_at >= ${from} ORDER BY created_at DESC LIMIT 40`);
  return {
    totals: { searches: num(totals?.searches), zero: num(totals?.zero), oos: num(totals?.oos), unique: num(totals?.unique_q) },
    trending: trending.map((x) => ({ query: String(x.query), now: num(x.now), before: num(x.before), zero: num(x.zero), landing: (x.landing as string | null) ?? null })),
    zeroQueries: zeroQueries.map((x) => ({ query: String(x.query), n: num(x.n), last: new Date(x.last as string), landing: (x.landing as string | null) ?? null })),
    oosQueries: oosQueries.map((x) => ({ query: String(x.query), n: num(x.n) })),
    recent: recent.map((x) => ({ query: String(x.query), at: new Date(x.at as string), results: num(x.results), oos: num(x.oos) })),
  };
}

/* ── Automation health ──────────────────────────────────────────────────── */

export type AutomationHealth = {
  id: number;
  name: string;
  trigger: string;
  isActive: boolean;
  runCount: number;
  lastRunAt: Date | null;
  lastMode: string | null;
  lastMatched: number | null;
  lastAffected: number | null;
  failures: number;
};

export async function automationHealth(): Promise<AutomationHealth[]> {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT a.id, a.name, a.trigger, a.is_active, a.run_count, a.last_run_at,
      r.mode AS last_mode, r.matched AS last_matched, r.affected AS last_affected,
      (SELECT COUNT(*)::int FROM automation_runs x WHERE x.automation_id = a.id AND x.status = 'failed') AS failures
    FROM automations a
    LEFT JOIN LATERAL (
      SELECT mode, matched, affected FROM automation_runs ar WHERE ar.automation_id = a.id ORDER BY created_at DESC LIMIT 1
    ) r ON true
    ORDER BY a.is_active DESC, a.name`);
  return r.map((x) => ({
    id: num(x.id), name: String(x.name), trigger: String(x.trigger), isActive: Boolean(x.is_active),
    runCount: num(x.run_count), lastRunAt: x.last_run_at ? new Date(x.last_run_at as string) : null,
    lastMode: (x.last_mode as string | null) ?? null,
    lastMatched: x.last_matched == null ? null : num(x.last_matched),
    lastAffected: x.last_affected == null ? null : num(x.last_affected),
    failures: num(x.failures),
  }));
}

/* ── Content: what the shopper actually reads ───────────────────────────── */

export async function contentPulse() {
  const [articles] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_published)::int AS published,
      COUNT(*) FILTER (WHERE NOT is_published)::int AS drafts,
      COUNT(*) FILTER (WHERE image IS NULL)::int AS no_image,
      MAX(published_at) AS latest FROM articles`);
  const byTag = await rows<Record<string, unknown>>(sql`
    SELECT COALESCE(tag, 'sans rubrique') AS tag, COUNT(*)::int AS n FROM articles GROUP BY 1 ORDER BY 2 DESC`);
  const landings = await rows<Record<string, unknown>>(sql`
    SELECT ql.query, ql.label, ql.href, ql.kind, ql.created_at AS at,
      (SELECT COUNT(*)::int FROM search_events s WHERE LOWER(s.query) = LOWER(ql.query) AND s.created_at > now() - interval '30 days') AS interest
    FROM query_landings ql ORDER BY interest DESC, ql.query`);
  return {
    totals: { total: num(articles?.total), published: num(articles?.published), drafts: num(articles?.drafts), noImage: num(articles?.no_image), latest: articles?.latest ? new Date(articles.latest as string) : null },
    byTag: byTag.map((x) => ({ tag: String(x.tag), n: num(x.n) })),
    landings: landings.map((x) => ({ query: String(x.query), label: String(x.label), href: String(x.href), kind: String(x.kind), at: new Date(x.at as string), interest: num(x.interest) })),
  };
}

/* ── Store audit history: the diagnostic's own trail ────────────────────── */

export async function diagnosticTrail(limit = 12) {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT id, action, details, created_at AS at, actor_id FROM audit_logs
    WHERE action LIKE 'diagnostic%' ORDER BY created_at DESC LIMIT ${limit}`);
  return r.map((x) => ({
    id: num(x.id),
    action: String(x.action),
    details: (x.details ?? {}) as Record<string, unknown>,
    at: new Date(x.at as string),
    actorId: x.actor_id == null ? null : num(x.actor_id),
  }));
}

/* ── A day, in full, for drill-down from the canvas ─────────────────────── */

export async function dayBook(day: Date) {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const to = new Date(from.getTime() + 86_400_000);
  const [orders] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS n, COALESCE(SUM(total_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS revenue,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
      COUNT(DISTINCT user_id)::int AS buyers
    FROM orders WHERE created_at BETWEEN ${from} AND ${to}`);
  const hours = await rows<{ hour: number; n: number; value: number }>(sql`
    SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS n, COALESCE(SUM(total_millimes), 0) AS value
    FROM orders WHERE created_at BETWEEN ${from} AND ${to} AND status <> 'cancelled' GROUP BY 1 ORDER BY 1`);
  return {
    day: formatIso(from),
    orders: num(orders?.n),
    revenue: num(orders?.revenue),
    cancelled: num(orders?.cancelled),
    buyers: num(orders?.buyers),
    hours: hours.map((h) => ({ hour: num(h.hour), orders: num(h.n), value: num(h.value) })),
  };
}

/* ── Stock: the honest buckets, with the money they immobilise ──────────── */

export async function stockBook() {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT p.id, p.name, p.image, p.sku, p.stock, p.low_stock_threshold AS threshold, p.price_millimes AS price,
      COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id AND o.status <> 'cancelled' AND o.created_at > now() - interval '90 days'), 0)::int AS sold90,
      (SELECT MAX(o.created_at) FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS last_sale
    FROM products p WHERE p.status <> 'archived' ORDER BY p.stock DESC`);
  const items = r.map((x) => ({
    id: num(x.id), name: String(x.name), image: (x.image as string | null) ?? null, sku: String(x.sku),
    stock: num(x.stock), threshold: num(x.threshold), price: num(x.price), sold90: num(x.sold90),
    lastSale: x.last_sale ? new Date(x.last_sale as string) : null,
  }));
  const bucket = (i: (typeof items)[number]) =>
    i.stock === 0 ? "rupture" : i.stock <= i.threshold ? "tension" : i.sold90 === 0 ? "dormant" : i.stock > i.threshold * 6 ? "surstock" : "sain";
  return items.map((i) => ({ ...i, bucket: bucket(i) as "rupture" | "tension" | "dormant" | "surstock" | "sain", perDay: i.sold90 / 90, coverDays: i.sold90 > 0 ? i.stock / (i.sold90 / 90) : null }));
}


/* ── The order book: what the operations desk reads and acts on ─────────── */

export type OrderListRow = {
  id: number;
  number: string;
  at: Date;
  updatedAt: Date;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingMethod: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  items: number;
  units: number;
  ageHours: number;
  tracking: string | null;
  promoCode: string | null;
  storeId: number | null;
  userId: number | null;
};

export type OrderFilters = {
  statuses?: string[];
  payments?: string[];
  methods?: string[];
  from?: Date;
  to?: Date;
  q?: string;
  storeId?: number;
  onlyLate?: boolean;
  sort?: "recent" | "oldest" | "value" | "age";
  limit?: number;
};

export async function ordersList(filters: OrderFilters = {}): Promise<OrderListRow[]> {
  const clauses: SQL[] = [sql`1 = 1`];
  if (filters.statuses?.length) clauses.push(sql`o.status IN (${sql.join(filters.statuses.map((s) => sql`${s}`), sql`, `)})`);
  if (filters.payments?.length) clauses.push(sql`o.payment_status IN (${sql.join(filters.payments.map((s) => sql`${s}`), sql`, `)})`);
  if (filters.methods?.length) clauses.push(sql`o.shipping_method IN (${sql.join(filters.methods.map((s) => sql`${s}`), sql`, `)})`);
  if (filters.from) clauses.push(sql`o.created_at >= ${filters.from}`);
  if (filters.to) clauses.push(sql`o.created_at <= ${filters.to}`);
  if (filters.storeId) clauses.push(sql`o.store_id = ${filters.storeId}`);
  if (filters.onlyLate) clauses.push(sql`o.status IN ('pending','confirmed','preparing') AND o.created_at < now() - interval '3 days'`);
  if (filters.q) {
    const like = `%${filters.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    clauses.push(sql`(o.number ILIKE ${like} OR o.email ILIKE ${like} OR o.phone ILIKE ${like} OR o.shipping_address->>'fullName' ILIKE ${like} OR o.tracking_code ILIKE ${like})`);
  }
  const order = filters.sort === "oldest" ? sql`o.created_at ASC`
    : filters.sort === "value" ? sql`o.total_millimes DESC`
    : filters.sort === "age" ? sql`o.created_at ASC`
    : sql`o.created_at DESC`;

  const r = await rows<Row>(sql`
    SELECT o.id, o.number, o.created_at AS at, o.updated_at AS updated_at,
      COALESCE(o.shipping_address->>'fullName', o.email) AS name, o.email, o.phone,
      o.shipping_address->>'city' AS city, o.status, o.payment_status, o.payment_method, o.shipping_method,
      o.total_millimes AS total, o.subtotal_millimes AS subtotal, o.discount_millimes AS discount,
      o.shipping_millimes AS shipping, o.tracking_code, o.promo_code, o.store_id, o.user_id,
      (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS items,
      (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS units
    FROM orders o WHERE ${sql.join(clauses, sql` AND `)} ORDER BY ${order} LIMIT ${filters.limit ?? 500}`);
  const now = Date.now();
  return r.map((x) => ({
    id: num(x.id), number: String(x.number), at: new Date(x.at as unknown as string), updatedAt: new Date(x.updated_at as unknown as string),
    name: String(x.name ?? "—"), email: String(x.email), phone: String(x.phone ?? ""),
    city: (x.city as string | null) ?? null, status: String(x.status), paymentStatus: String(x.payment_status),
    paymentMethod: String(x.payment_method), shippingMethod: String(x.shipping_method),
    total: num(x.total), subtotal: num(x.subtotal), discount: num(x.discount), shipping: num(x.shipping),
    items: num(x.items), units: num(x.units), tracking: (x.tracking_code as string | null) ?? null,
    promoCode: (x.promo_code as string | null) ?? null,
    storeId: x.store_id == null ? null : num(x.store_id), userId: x.user_id == null ? null : num(x.user_id),
    ageHours: (now - new Date(x.at as unknown as string).getTime()) / 3_600_000,
  }));
}

/** Counts per status for the desk's filter chips, over the whole book. */
export async function orderStatusCounts(): Promise<Record<string, number>> {
  const r = await rows<{ status: string; n: number }>(sql`SELECT status::text AS status, COUNT(*)::int AS n FROM orders GROUP BY 1`);
  const out: Record<string, number> = {};
  for (const row of r) out[row.status] = num(row.n);
  return out;
}

/** Who is on the desk today, and what they touched — from the audit ledger. */
export async function deskActivity(from: Date, to: Date) {
  const r = await rows<Row>(sql`
    SELECT COALESCE(u.first_name || ' ' || u.last_name, 'système') AS actor, a.action, COUNT(*)::int AS n, MAX(a.created_at) AS last
    FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    WHERE a.created_at BETWEEN ${from} AND ${to}
    GROUP BY 1, 2 ORDER BY n DESC LIMIT 40`);
  return r.map((x) => ({ actor: String(x.actor), action: String(x.action), n: num(x.n), last: new Date(x.last as unknown as string) }));
}
