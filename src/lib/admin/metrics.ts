import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bucketStarts, type Period } from "./period";

/* ══════════════════════════════════════════════════════════════════════════
   MESURES — what the house can honestly know
   ──────────────────────────────────────────────────────────────────────────
   Every number on the instrument is a query against the shop's own tables.
   Nothing is estimated, smoothed or invented: when a measurement is not
   instrumented (visits, carts, checkout starts) the screen says so and the
   missing backend capability is named — see MEASUREMENT_GAPS.

   Definitions, written once for the whole house:
     · Chiffre d'affaires (brut)  Σ total of orders that were not cancelled
     · Encaissé                   Σ total of orders whose payment settled
     · CA net                     gross − refunded totals
     · Panier moyen               gross ÷ orders
     · Unités                     Σ order_items.quantity on non-cancelled orders
   ══════════════════════════════════════════════════════════════════════════ */

async function rows<T>(query: SQL): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] }).rows ?? []) as T[];
}

const num = (v: unknown) => Number(v ?? 0);

export type Delta = { current: number; previous: number; year: number | null; pct: number | null; dir: "up" | "down" | "flat" };

/** Postgres timestamps reach us as strings through the embedded driver: coerce. */
const ts = (v: unknown): Date => (v instanceof Date ? v : new Date(String(v)));
const tsOrNull = (v: unknown): Date | null => (v == null ? null : v instanceof Date ? v : new Date(String(v)));

export function delta(current: number, previous: number, year?: number | null): Delta {
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : null;
  const dir: Delta["dir"] = current === previous ? "flat" : current > previous ? "up" : "down";
  return { current, previous, year: year ?? null, pct, dir };
}

/* ── Pulse ───────────────────────────────────────────────────────────────── */

export type PulseNumbers = {
  gross: number;
  net: number;
  collected: number;
  refunded: number;
  discounted: number;
  orders: number;
  units: number;
  buyers: number;
  newCustomers: number;
  returningBuyers: number;
  cancelled: number;
  returned: number;
  pending: number;
  shipping: number;
  knownBuyers: number;
};

async function pulseWindow(from: Date, to: Date): Promise<PulseNumbers> {
  const [totals] = await rows<Record<string, unknown>>(sql`
    SELECT
      COALESCE(SUM(total_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS gross,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'paid'), 0) AS collected,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'refunded'), 0) AS refunded,
      COALESCE(SUM(discount_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS discounted,
      COALESCE(SUM(shipping_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS shipping,
      COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS orders,
      COUNT(*) FILTER (WHERE status <> 'cancelled' AND user_id IS NOT NULL)::int AS known_buyers,
      COUNT(DISTINCT user_id) FILTER (WHERE status <> 'cancelled' AND user_id IS NOT NULL)::int AS buyers,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
      COUNT(*) FILTER (WHERE status = 'returned')::int AS returned,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
    FROM orders WHERE created_at BETWEEN ${from} AND ${to}`);
  const [units] = await rows<Record<string, unknown>>(sql`
    SELECT COALESCE(SUM(oi.quantity), 0)::int AS units
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at BETWEEN ${from} AND ${to} AND o.status <> 'cancelled'`);
  const [fresh] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS n FROM users WHERE role = 'customer' AND created_at BETWEEN ${from} AND ${to}`);
  const [repeat] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS n FROM (
      SELECT o.user_id FROM orders o
      WHERE o.created_at BETWEEN ${from} AND ${to} AND o.user_id IS NOT NULL AND o.status <> 'cancelled'
      GROUP BY o.user_id
      HAVING EXISTS (SELECT 1 FROM orders p WHERE p.user_id = o.user_id AND p.created_at < ${from} AND p.status <> 'cancelled')
    ) t`);
  const gross = num(totals?.gross);
  const refunded = num(totals?.refunded);
  return {
    gross,
    net: gross - refunded,
    collected: num(totals?.collected),
    refunded,
    discounted: num(totals?.discounted),
    shipping: num(totals?.shipping),
    orders: num(totals?.orders),
    units: num(units?.units),
    buyers: num(totals?.buyers),
    knownBuyers: num(totals?.known_buyers),
    newCustomers: num(fresh?.n),
    returningBuyers: num(repeat?.n),
    cancelled: num(totals?.cancelled),
    returned: num(totals?.returned),
    pending: num(totals?.pending),
  };
}

export type Pulse = {
  period: Period;
  current: PulseNumbers;
  previous: PulseNumbers;
  year: PulseNumbers;
  rates: {
    confirmation: Delta;
    cancellation: Delta;
    return: Delta;
    refund: Delta;
    repeat: Delta;
    aov: Delta;
    unitsPerOrder: Delta;
    revenuePerDay: Delta;
    settledShare: Delta;
  };
};

export async function businessPulse(p: Period, prev: Period, lastYear: Period): Promise<Pulse> {
  const [current, previous, year] = await Promise.all([
    pulseWindow(p.from, p.to),
    pulseWindow(prev.from, prev.to),
    pulseWindow(lastYear.from, lastYear.to),
  ]);
  const ratio = (x: PulseNumbers, f: (v: PulseNumbers) => number) => f(x);
  const aov = (x: PulseNumbers) => (x.orders ? x.gross / x.orders : 0);
  return {
    period: p,
    current,
    previous,
    year,
    rates: {
      confirmation: delta(ratio(current, (x) => (x.orders + x.cancelled ? (x.orders / (x.orders + x.cancelled)) * 100 : 0)), ratio(previous, (x) => (x.orders + x.cancelled ? (x.orders / (x.orders + x.cancelled)) * 100 : 0)), ratio(year, (x) => (x.orders + x.cancelled ? (x.orders / (x.orders + x.cancelled)) * 100 : 0))),
      cancellation: delta(ratio(current, (x) => (x.orders + x.cancelled ? (x.cancelled / (x.orders + x.cancelled)) * 100 : 0)), ratio(previous, (x) => (x.orders + x.cancelled ? (x.cancelled / (x.orders + x.cancelled)) * 100 : 0)), null),
      return: delta(ratio(current, (x) => (x.orders ? (x.returned / x.orders) * 100 : 0)), ratio(previous, (x) => (x.orders ? (x.returned / x.orders) * 100 : 0)), null),
      refund: delta(current.refunded, previous.refunded, year.refunded),
      repeat: delta(current.returningBuyers, previous.returningBuyers, year.returningBuyers),
      aov: delta(aov(current), aov(previous), aov(year)),
      unitsPerOrder: delta(ratio(current, (x) => (x.orders ? x.units / x.orders : 0)), ratio(previous, (x) => (x.orders ? x.units / x.orders : 0)), null),
      revenuePerDay: delta(current.gross / Math.max(1, p.days), previous.gross / Math.max(1, prev.days), null),
      settledShare: delta(ratio(current, (x) => (x.gross ? (x.collected / x.gross) * 100 : 0)), ratio(previous, (x) => (x.gross ? (x.collected / x.gross) * 100 : 0)), null),
    },
  };
}

/* ── Series ──────────────────────────────────────────────────────────────── */

export type MetricKey = "revenue" | "orders" | "aov" | "units" | "customers" | "refunds";
export const METRICS: { key: MetricKey; label: string; unit: "millimes" | "count" | "decimal"; hint: string }[] = [
  { key: "revenue", label: "Chiffre d'affaires", unit: "millimes", hint: "Commandes non annulées, remises et livraison comprises" },
  { key: "orders", label: "Commandes", unit: "count", hint: "Commandes passées sur la période" },
  { key: "aov", label: "Panier moyen", unit: "millimes", hint: "Chiffre d'affaires ÷ commandes" },
  { key: "units", label: "Unités vendues", unit: "count", hint: "Somme des quantités des lignes de commande" },
  { key: "customers", label: "Cliente atteintes", unit: "count", hint: "Comptes distincts ayant commandé" },
  { key: "refunds", label: "Remboursements", unit: "millimes", hint: "Commandes dont le règlement est remboursé" },
];

export type Point = { at: string; label: string; value: number };

export async function series(p: Period, metric: MetricKey): Promise<Point[]> {
  const grain = p.granularity === "hour" ? "hour" : p.granularity === "week" ? "week" : p.granularity === "month" ? "month" : "day";
  const orderRows = await rows<{ at: Date; revenue: number; orders: number; refunds: number; buyers: number }>(sql`
    SELECT date_trunc(${grain}, created_at) AS at,
      COALESCE(SUM(total_millimes) FILTER (WHERE status <> 'cancelled'), 0) AS revenue,
      COUNT(*) FILTER (WHERE status <> 'cancelled')::int AS orders,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'refunded'), 0) AS refunds,
      COUNT(DISTINCT user_id) FILTER (WHERE status <> 'cancelled' AND user_id IS NOT NULL)::int AS buyers
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to}
    GROUP BY 1 ORDER BY 1`);
  const unitRows = await rows<{ at: Date; units: number }>(sql`
    SELECT date_trunc(${grain}, o.created_at) AS at, COALESCE(SUM(oi.quantity), 0)::int AS units
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at BETWEEN ${p.from} AND ${p.to} AND o.status <> 'cancelled'
    GROUP BY 1 ORDER BY 1`);

  const bucket = new Map<string, { revenue: number; orders: number; refunds: number; buyers: number; units: number }>();
  const key = (d: Date) => new Date(d).toISOString();
  for (const r of orderRows) bucket.set(key(r.at), { revenue: num(r.revenue), orders: num(r.orders), refunds: num(r.refunds), buyers: num(r.buyers), units: 0 });
  for (const r of unitRows) {
    const k = key(r.at);
    const b = bucket.get(k) ?? { revenue: 0, orders: 0, refunds: 0, buyers: 0, units: 0 };
    b.units = num(r.units);
    bucket.set(k, b);
  }
  return bucketStarts(p).map((start) => {
    const b = bucket.get(key(start)) ?? { revenue: 0, orders: 0, refunds: 0, buyers: 0, units: 0 };
    const value =
      metric === "revenue" ? b.revenue :
      metric === "orders" ? b.orders :
      metric === "units" ? b.units :
      metric === "customers" ? b.buyers :
      metric === "refunds" ? b.refunds :
      b.orders ? b.revenue / b.orders : 0;
    return { at: start.toISOString(), label: "", value };
  });
}

/** Comparison series: the previous window, bucket-aligned to the current one. */
export async function seriesComparison(p: Period, prev: Period, metric: MetricKey): Promise<number[]> {
  const s = await series(prev, metric);
  return s.map((x) => x.value);
}

/* ── Revenue explorer — hierarchy ────────────────────────────────────────── */

export type BreakdownLevel = "universe" | "category" | "brand" | "product" | "orders";
export type BreakdownRow = {
  id: number | null;
  label: string;
  sub: string | null;
  href: string;
  revenue: number;
  units: number;
  orders: number;
  image?: string | null;
};

export async function revenueBreakdown(
  p: Period,
  level: BreakdownLevel,
  parent?: { level: BreakdownLevel; id: number },
): Promise<BreakdownRow[]> {
  const filter = parent
    ? parent.level === "universe" ? sql`AND p.universe_id = ${parent.id}`
    : parent.level === "category" ? sql`AND p.category_id = ${parent.id}`
    : parent.level === "brand" ? sql`AND p.brand_id = ${parent.id}`
    : sql`AND p.id = ${parent.id}`
    : sql``;
  const join = level === "universe" ? sql`JOIN categories g ON g.id = p.universe_id`
    : level === "category" ? sql`JOIN categories g ON g.id = p.category_id`
    : level === "brand" ? sql`JOIN brands g ON g.id = p.brand_id`
    : sql`JOIN products g ON g.id = p.id`;
  const result = await rows<Record<string, unknown>>(sql`
    SELECT g.id AS id, g.name AS label,
      ${level === "universe" ? sql`g.image` : sql`NULL`} AS image,
      COALESCE(SUM(oi.line_total_millimes), 0) AS revenue,
      COALESCE(SUM(oi.quantity), 0)::int AS units,
      COUNT(DISTINCT o.id)::int AS orders,
      COUNT(DISTINCT o.user_id)::int AS buyers
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    ${join}
    WHERE o.created_at BETWEEN ${p.from} AND ${p.to} AND o.status <> 'cancelled' ${filter}
    GROUP BY 1, 2 ${level === "universe" ? sql`, g.image` : sql``}
    ORDER BY revenue DESC`);
  return result.map((r) => ({
    id: num(r.id),
    label: String(r.label),
    sub: `${num(r.buyers)} cliente${num(r.buyers) > 1 ? "s" : ""}`,
    href: "",
    revenue: num(r.revenue),
    units: num(r.units),
    orders: num(r.orders),
    image: (r.image as string | null) ?? null,
  }));
}

/** Orders behind one product — the last level of the drill-down. */
export async function ordersForProduct(p: Period, productId: number) {
  return rows<{ id: number; number: string; at: Date; total: number; quantity: number; status: string }>(sql`
    SELECT o.id, o.number, o.created_at AS at, o.total_millimes AS total, oi.quantity, o.status
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = ${productId} AND o.created_at BETWEEN ${p.from} AND ${p.to} AND o.status <> 'cancelled'
    ORDER BY o.created_at DESC LIMIT 60`);
}

/* ── Pipeline & payments ─────────────────────────────────────────────────── */

export type PipelineStage = { status: string; label: string; count: number; value: number; avgAgeHours: number | null; oldest: Date | null };

export async function pipeline(p: Period): Promise<PipelineStage[]> {
  const r = await rows<{ status: string; n: number; value: number; avg_age: number | null; oldest: Date | null }>(sql`
    SELECT status, COUNT(*)::int AS n, COALESCE(SUM(total_millimes), 0) AS value,
      AVG(EXTRACT(EPOCH FROM (now() - created_at)) / 3600) FILTER (WHERE status IN ('pending','confirmed','preparing','shipped')) AS avg_age,
      MIN(created_at) AS oldest
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to}
    GROUP BY status`);
  const labels: Record<string, string> = {
    pending: "En attente de règlement", confirmed: "Confirmées", preparing: "En préparation",
    shipped: "Expédiées", delivered: "Livrées", cancelled: "Annulées", returned: "Retournées",
  };
  const order = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"];
  return order
    .map((status) => {
      const row = r.find((x) => x.status === status);
      return { status, label: labels[status] ?? status, count: num(row?.n), value: num(row?.value), avgAgeHours: row?.avg_age == null ? null : num(row.avg_age), oldest: row?.oldest == null ? null : ts(row.oldest) };
    })
    .filter((x) => x.count > 0 || ["pending", "confirmed", "preparing", "shipped"].includes(x.status));
}

export async function paymentMix(p: Period) {
  const r = await rows<{ method: string; status: string; n: number; value: number }>(sql`
    SELECT payment_method AS method, payment_status AS status, COUNT(*)::int AS n, COALESCE(SUM(total_millimes),0) AS value
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to} AND status <> 'cancelled'
    GROUP BY 1, 2`);
  const methods = ["cod", "bank_transfer", "card", "gift_card"];
  return methods
    .map((method) => {
      const mine = r.filter((x) => x.method === method);
      const n = mine.reduce((a, x) => a + num(x.n), 0);
      const value = mine.reduce((a, x) => a + num(x.value), 0);
      const settled = mine.filter((x) => x.status === "paid").reduce((a, x) => a + num(x.value), 0);
      return { method, count: n, value, settled, rate: value ? (settled / value) * 100 : 0 };
    })
    .filter((x) => x.count > 0);
}

export async function shippingMix(p: Period) {
  const r = await rows<{ method: string; n: number; value: number; n_fee: number }>(sql`
    SELECT shipping_method AS method, COUNT(*)::int AS n, COALESCE(SUM(shipping_millimes),0) AS value,
      COUNT(*) FILTER (WHERE shipping_millimes = 0)::int AS n_fee
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to} AND status <> 'cancelled' GROUP BY 1`);
  return r.map((x) => ({ method: x.method, count: num(x.n), value: num(x.value), free: num(x.n_fee) }));
}

/** Unsettled money: orders the house has delivered value on but not been paid for. */
export async function outstanding(p: Period) {
  const [row] = await rows<{ n: number; value: number; failed: number }>(sql`
    SELECT COUNT(*) FILTER (WHERE payment_status = 'pending')::int AS n,
           COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'pending'), 0) AS value,
           COUNT(*) FILTER (WHERE payment_status = 'failed')::int AS failed
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to} AND status NOT IN ('cancelled','returned')`);
  const aged = await rows<{ bucket: string; n: number; value: number }>(sql`
    SELECT CASE
        WHEN now() - created_at < interval '2 days' THEN '0-2 j'
        WHEN now() - created_at < interval '7 days' THEN '2-7 j'
        WHEN now() - created_at < interval '30 days' THEN '7-30 j'
        ELSE '+30 j' END AS bucket,
      COUNT(*)::int AS n, COALESCE(SUM(total_millimes),0) AS value
    FROM orders
    WHERE payment_status = 'pending' AND status NOT IN ('cancelled','returned')
    GROUP BY 1`);
  return { count: num(row?.n), value: num(row?.value), failed: num(row?.failed), aged: aged.map((a) => ({ bucket: a.bucket, count: num(a.n), value: num(a.value) })) };
}

/* ── Promotions ──────────────────────────────────────────────────────────── */

export async function promotionPerformance(p: Period) {
  const r = await rows<{ code: string; n: number; gross: number; discount: number; buyers: number; last: Date | null }>(sql`
    SELECT promo_code AS code, COUNT(*)::int AS n, COALESCE(SUM(total_millimes),0) AS gross,
      COALESCE(SUM(discount_millimes),0) AS discount, COUNT(DISTINCT user_id)::int AS buyers, MAX(created_at) AS last
    FROM orders WHERE promo_code IS NOT NULL AND created_at BETWEEN ${p.from} AND ${p.to} AND status <> 'cancelled'
    GROUP BY 1 ORDER BY gross DESC`);
  return r.map((x) => ({ code: x.code, orders: num(x.n), gross: num(x.gross), discount: num(x.discount), buyers: num(x.buyers), last: x.last }));
}

export async function promotionsOverview(now = new Date()) {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT id, code, label, type, value, min_subtotal_millimes AS min_subtotal, max_discount_millimes AS max_discount,
      usage_limit AS usage_limit, usage_count AS usage_count, per_user_limit, starts_at, ends_at, is_active,
      CASE
        WHEN is_active = false THEN 'inactive'
        WHEN starts_at IS NOT NULL AND starts_at > now() THEN 'scheduled'
        WHEN ends_at IS NOT NULL AND ends_at < now() THEN 'expired'
        ELSE 'live' END AS state
    FROM promotions ORDER BY is_active DESC, ends_at NULLS LAST`);
  void now;
  return r.map((x) => ({
    id: num(x.id), code: String(x.code), label: String(x.label), type: String(x.type), value: num(x.value),
    minSubtotal: num(x.min_subtotal), maxDiscount: x.max_discount == null ? null : num(x.max_discount),
    usageLimit: x.usage_limit == null ? null : num(x.usage_limit), usageCount: num(x.usage_count),
    perUserLimit: num(x.per_user_limit), startsAt: tsOrNull(x.starts_at), endsAt: tsOrNull(x.ends_at),
    isActive: Boolean(x.is_active), state: String(x.state),
  }));
}

/* ── Products, inventory, velocity ───────────────────────────────────────── */

export type ProductRow = {
  id: number; name: string; slug: string; sku: string; price: number; compareAt: number | null;
  stock: number; threshold: number; status: string; brand: string | null; brandId: number | null;
  category: string | null; universe: string | null; categoryId: number | null; universeId: number | null;
  image: string | null; images: string[];
  ratingAvg: number; ratingCount: number; salesCount: number; launchedAt: Date | null;
  createdAt: Date; updatedAt: Date;
  isFeatured: boolean; isNew: boolean; isCounterPick: boolean;
  description: string | null; shortDescription: string | null; volume: string | null;
  unitsSold: number; revenue: number; wishes: number; reviewsPending: number; lastSale: Date | null;
};

export async function productRows(options: { ids?: number[]; limit?: number } = {}): Promise<ProductRow[]> {
  const filter = options.ids?.length ? sql`WHERE p.id IN (${sql.join(options.ids.map((i) => sql`${i}`), sql`, `)})` : sql``;
  const r = await rows<Record<string, unknown>>(sql`
    SELECT p.*, b.name AS brand_name, c.name AS category_name, u.name AS universe_name,
      COALESCE(s.units, 0) AS units_sold, COALESCE(s.revenue, 0) AS revenue, COALESCE(w.n, 0) AS wishes,
      COALESCE(pr.n, 0) AS reviews_pending, s.last_sale
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN categories u ON u.id = p.universe_id
    LEFT JOIN (SELECT oi.product_id, SUM(oi.quantity)::int AS units, SUM(oi.line_total_millimes) AS revenue, MAX(o.created_at) AS last_sale
               FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled' GROUP BY 1) s ON s.product_id = p.id
    LEFT JOIN (SELECT product_id, COUNT(*)::int AS n FROM wishlist_items GROUP BY 1) w ON w.product_id = p.id
    LEFT JOIN (SELECT product_id, COUNT(*)::int AS n FROM reviews WHERE status = 'pending' GROUP BY 1) pr ON pr.product_id = p.id
    ${filter}
    ORDER BY p.name ${options.limit ? sql`LIMIT ${options.limit}` : sql``}`);
  return r.map((x) => ({
    id: num(x.id), name: String(x.name), slug: String(x.slug), sku: String(x.sku), price: num(x.price_millimes),
    compareAt: x.compare_at_millimes == null ? null : num(x.compare_at_millimes),
    stock: num(x.stock), threshold: num(x.low_stock_threshold), status: String(x.status),
    brand: (x.brand_name as string | null) ?? null, brandId: x.brand_id == null ? null : num(x.brand_id),
    category: (x.category_name as string | null) ?? null, categoryId: x.category_id == null ? null : num(x.category_id),
    universe: (x.universe_name as string | null) ?? null, universeId: x.universe_id == null ? null : num(x.universe_id),
    image: (x.image as string | null) ?? null, images: (x.images as string[] | null) ?? [],
    ratingAvg: num(x.rating_avg), ratingCount: num(x.rating_count), salesCount: num(x.sales_count),
    launchedAt: tsOrNull(x.launched_at), createdAt: ts(x.created_at), updatedAt: ts(x.updated_at),
    isFeatured: Boolean(x.is_featured), isNew: Boolean(x.is_new), isCounterPick: Boolean(x.is_counter_pick),
    description: (x.description as string | null) ?? null, shortDescription: (x.short_description as string | null) ?? null,
    volume: (x.volume as string | null) ?? null,
    unitsSold: num(x.units_sold), revenue: num(x.revenue), wishes: num(x.wishes), reviewsPending: num(x.reviews_pending),
    lastSale: x.last_sale ? new Date(x.last_sale as string) : null,
  }));
}

/* ── Product health & quality audit ──────────────────────────────────────── */

export type HealthCheck = { key: string; label: string; ok: boolean; weight: number; detail: string; fix?: string };
export type Health = { score: number; checks: HealthCheck[]; grade: "excellent" | "good" | "fragile" | "incomplete" };

export function productHealth(p: ProductRow): Health {
  const longDesc = (p.description ?? "").trim().length;
  const seoOk = p.shortDescription ? p.shortDescription.length >= 60 && p.shortDescription.length <= 300 : false;
  const checks: HealthCheck[] = [
    { key: "image", label: "Visuel principal", ok: !!p.image, weight: 16, detail: p.image ? "présent" : "aucun visuel", fix: "Ajouter une image depuis la médiathèque" },
    { key: "gallery", label: "Galerie", ok: (p.images?.length ?? 0) >= 2, weight: 8, detail: `${p.images?.length ?? 0} image(s)` , fix: "Composer au moins deux vues" },
    { key: "short", label: "Accroche", ok: !!p.shortDescription, weight: 10, detail: p.shortDescription ? `${p.shortDescription.length} caractères` : "vide", fix: "Écrire une accroche de 60 à 300 caractères" },
    { key: "description", label: "Description", ok: longDesc >= 240, weight: 14, detail: `${longDesc} caractères`, fix: "Décrire le soin en 240 caractères minimum" },
    { key: "sku", label: "Référence (SKU)", ok: !!p.sku, weight: 8, detail: p.sku || "manquant" },
    { key: "brand", label: "Laboratoire", ok: !!p.brandId, weight: 8, detail: p.brand ?? "non rattaché" },
    { key: "category", label: "Rayon", ok: !!p.categoryId && !!p.universeId, weight: 10, detail: p.category ? `${p.universe} › ${p.category}` : "non classé" },
    { key: "price", label: "Prix de vente", ok: p.price > 0, weight: 10, detail: `${(p.price / 1000).toFixed(3)} DT` },
    { key: "seo", label: "SEO / partage", ok: seoOk, weight: 6, detail: seoOk ? "accroche exploitable" : "accroche trop courte ou trop longue", fix: "Ajuster l'accroche pour les moteurs" },
    { key: "visibility", label: "Visibilité", ok: p.status === "active", weight: 6, detail: p.status === "active" ? "en ligne" : `statut ${p.status}`, fix: "Publier la fiche" },
    { key: "stock", label: "Disponibilité", ok: p.stock > 0, weight: 4, detail: p.stock > 0 ? `${p.stock} unités` : "épuisé", fix: "Réapprovisionner" },
  ];
  const total = checks.reduce((a, c) => a + c.weight, 0);
  const won = checks.filter((c) => c.ok).reduce((a, c) => a + c.weight, 0);
  const score = Math.round((won / total) * 100);
  return { score, checks, grade: score >= 92 ? "excellent" : score >= 78 ? "good" : score >= 55 ? "fragile" : "incomplete" };
}

export type QualityIssue = {
  kind: string;
  severity: "critical" | "high" | "normal";
  label: string;
  detail: string;
  productId: number | null;
  productName: string | null;
  href: string;
};

/** Expectations read on every product, and the catalogue-wide checks beside them. */
const CHECKS_PER_PRODUCT = 11;
const CATALOGUE_CHECKS = 4;

/** The scanner: one pass over the catalogue, every defect the data actually holds. */
export async function qualityAudit(): Promise<{ issues: QualityIssue[]; scanned: number; score: number; checks: number; byKind: { kind: string; label: string; n: number; severity: string }[] }> {
  const list = await productRows();
  const issues: QualityIssue[] = [];
  const push = (i: QualityIssue) => issues.push(i);
  for (const p of list) {
    const href = `/admin/produits/${p.id}`;
    if (!p.image) push({ kind: "media", severity: "critical", label: "Sans visuel", detail: `${p.name} n'a aucune image : la fiche ne peut pas être montrée.`, productId: p.id, productName: p.name, href });
    else if ((p.images?.length ?? 0) < 2) push({ kind: "gallery", severity: "normal", label: "Galerie trop pauvre", detail: `${p.name} — une seule image.`, productId: p.id, productName: p.name, href });
    if (!(p.description ?? "").trim()) push({ kind: "description", severity: "high", label: "Description manquante", detail: `${p.name} n'a pas de description longue.`, productId: p.id, productName: p.name, href });
    else if ((p.description ?? "").length < 240) push({ kind: "description", severity: "normal", label: "Description courte", detail: `${p.name} — ${(p.description ?? "").length} caractères.`, productId: p.id, productName: p.name, href });
    if (!p.shortDescription?.trim()) push({ kind: "seo", severity: "normal", label: "Accroche absente", detail: `${p.name} n'a pas d'accroche de partage.`, productId: p.id, productName: p.name, href });
    if (!p.brandId) push({ kind: "brand", severity: "high", label: "Laboratoire non rattaché", detail: `${p.name} n'est lié à aucune marque.`, productId: p.id, productName: p.name, href });
    if (!p.categoryId) push({ kind: "category", severity: "critical", label: "Non classé", detail: `${p.name} n'apparaît dans aucun rayon.`, productId: p.id, productName: p.name, href });
    if (!/^.{2,}$/.test(p.sku)) push({ kind: "sku", severity: "critical", label: "SKU invalide", detail: `${p.name} — référence « ${p.sku} ».`, productId: p.id, productName: p.name, href });
    if (p.price <= 0) push({ kind: "price", severity: "critical", label: "Prix invalide", detail: `${p.name} est vendu à ${(p.price / 1000).toFixed(3)} DT.`, productId: p.id, productName: p.name, href });
    if (p.compareAt != null && p.compareAt <= p.price) push({ kind: "price", severity: "high", label: "Prix barré incohérent", detail: `${p.name} — prix barré inférieur ou égal au prix.`, productId: p.id, productName: p.name, href });
    if (p.status === "active" && p.stock === 0) push({ kind: "stock", severity: "critical", label: "En ligne mais épuisé", detail: `${p.name} reste publié sans stock.`, productId: p.id, productName: p.name, href });
    if (p.status === "draft" && p.stock > 0) push({ kind: "visibility", severity: "normal", label: "Brouillon avec stock", detail: `${p.name} — ${p.stock} unités en réserve, fiche non publiée.`, productId: p.id, productName: p.name, href });
    if (p.launchedAt && (p.description ?? "").length < 120) push({ kind: "content", severity: "normal", label: "Nouveauté peu documentée", detail: `${p.name} est marqué nouveau sans contenu.`, productId: p.id, productName: p.name, href });
  }
  // Duplicates are judged on the reference, the slug and the name — the three
  // keys the shop itself trusts when it builds URLs and stock lines.
  const bySku = new Map<string, ProductRow[]>();
  const bySlug = new Map<string, ProductRow[]>();
  for (const p of list) {
    bySku.set(p.sku, [...(bySku.get(p.sku) ?? []), p]);
    bySlug.set(p.slug, [...(bySlug.get(p.slug) ?? []), p]);
  }
  for (const [, group] of bySku) if (group.length > 1) push({ kind: "duplicate", severity: "critical", label: "SKU en doublon", detail: `${group.map((g) => g.name).join(", ")} partagent la référence ${group[0].sku}.`, productId: group[0].id, productName: group[0].name, href: `/admin/produits/${group[0].id}` });
  for (const [, group] of bySlug) if (group.length > 1) push({ kind: "duplicate", severity: "critical", label: "URL en doublon", detail: `${group.map((g) => g.name).join(", ")} partagent l'URL /produit/${group[0].slug}.`, productId: group[0].id, productName: group[0].name, href: `/admin/produits/${group[0].id}` });
  // Broken references: an order line whose product no longer exists, a review
  // whose product is gone, a wish on a deleted reference.
  const broken = await rows<{ n: number; kind: string }>(sql`
    SELECT 'order_items' AS kind, COUNT(*)::int AS n FROM order_items oi WHERE oi.product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = oi.product_id)
    UNION ALL SELECT 'reviews', COUNT(*)::int FROM reviews r WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = r.product_id)
    UNION ALL SELECT 'wishlist', COUNT(*)::int FROM wishlist_items w WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = w.product_id)
    UNION ALL SELECT 'movements', COUNT(*)::int FROM inventory_movements m WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = m.product_id)`);
  for (const b of broken) if (num(b.n) > 0) push({ kind: "reference", severity: "critical", label: "Référence orpheline", detail: `${num(b.n)} ligne(s) « ${b.kind} » pointent vers un produit supprimé.`, productId: null, productName: null, href: "/admin/qualite" });

  // The score is a passed/failed ratio, not a weighted mystery: every product
  // is read against the same set of expectations, plus a few catalogue-wide
  // checks, and the grade is simply the share that holds.
  const productIssues = issues.filter((i) => i.productId != null).length;
  const globalIssues = issues.length - productIssues;
  const checks = list.length * CHECKS_PER_PRODUCT + CATALOGUE_CHECKS;
  const score = Math.max(0, Math.round((1 - (productIssues + globalIssues) / Math.max(1, checks)) * 100));
  const kinds = [...new Set(issues.map((i) => i.kind))].map((kind) => ({
    kind,
    label: issues.find((i) => i.kind === kind)!.label,
    n: issues.filter((i) => i.kind === kind).length,
    severity: issues.find((i) => i.kind === kind)!.severity,
  })).sort((a, b) => b.n - a.n);
  return { issues, scanned: list.length, score, checks, byKind: kinds };
}

/* ── Inventory ───────────────────────────────────────────────────────────── */

export type InventoryOverview = {
  units: number; retailValue: number; references: number;
  outOfStock: number; low: number; healthy: number; overstock: number; dead: number;
  byUniverse: { id: number | null; label: string; units: number; value: number; oos: number }[];
  lowList: { id: number; name: string; stock: number; threshold: number; image: string | null; velocity: number }[];
  outList: { id: number; name: string; image: string | null; wishes: number; waiting: number }[];
};

export async function inventoryOverview(): Promise<InventoryOverview> {
  const list = await productRows();
  const velocity = await salesVelocity(30);
  const vMap = new Map(velocity.map((v) => [v.productId, v]));
  const [totals] = await rows<Record<string, unknown>>(sql`
    SELECT COALESCE(SUM(stock), 0)::int AS units, COUNT(*)::int AS refs,
      COALESCE(SUM(stock * price_millimes), 0) AS value FROM products WHERE status <> 'archived'`);
  const byUniverse = await rows<Record<string, unknown>>(sql`
    SELECT u.id, COALESCE(u.name, 'Sans univers') AS label, COALESCE(SUM(p.stock),0)::int AS units,
      COALESCE(SUM(p.stock * p.price_millimes),0) AS value,
      COUNT(*) FILTER (WHERE p.stock <= 0)::int AS oos
    FROM products p LEFT JOIN categories u ON u.id = p.universe_id
    WHERE p.status <> 'archived' GROUP BY 1, 2 ORDER BY units DESC`);
  const ninety = Date.now() - 90 * 86_400_000;
  const dead = list.filter((p) => p.stock > 0 && (!p.lastSale || p.lastSale.getTime() < ninety)).length;
  return {
    units: num(totals?.units), retailValue: num(totals?.value), references: num(totals?.refs),
    outOfStock: list.filter((p) => p.stock === 0).length,
    low: list.filter((p) => p.stock > 0 && p.stock <= p.threshold).length,
    healthy: list.filter((p) => p.stock > p.threshold && p.stock <= p.threshold * 6).length,
    overstock: list.filter((p) => p.stock > p.threshold * 6).length,
    dead,
    byUniverse: byUniverse.map((u) => ({ id: u.id == null ? null : num(u.id), label: String(u.label), units: num(u.units), value: num(u.value), oos: num(u.oos) })),
    lowList: list.filter((p) => p.stock > 0 && p.stock <= p.threshold)
      .sort((a, b) => a.stock - b.stock)
      .map((p) => ({ id: p.id, name: p.name, stock: p.stock, threshold: p.threshold, image: p.image, velocity: vMap.get(p.id)?.perDay ?? 0 })),
    outList: list.filter((p) => p.stock === 0)
      .sort((a, b) => b.wishes - a.wishes)
      .map((p) => ({ id: p.id, name: p.name, image: p.image, wishes: p.wishes, waiting: 0 })),
  };
}

export type Velocity = { productId: number; units: number; perDay: number; revenue: number };

export async function salesVelocity(days: number): Promise<Velocity[]> {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT oi.product_id, SUM(oi.quantity)::int AS units, COALESCE(SUM(oi.line_total_millimes),0) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status <> 'cancelled' AND o.created_at > now() - (${days}::text || ' days')::interval
    GROUP BY 1`);
  return r.map((x) => ({ productId: num(x.product_id), units: num(x.units), revenue: num(x.revenue), perDay: num(x.units) / days }));
}

export type Forecast = {
  productId: number; name: string; sku: string; stock: number; threshold: number; image: string | null;
  perDay: number; daysLeft: number | null; eta: Date | null; risk: "deficit" | "tension" | "ok" | "dormant"; confidence: "forte" | "faible" | "aucune";
};

/**
 * Forecasting is only honest with enough sales history: a reference needs at
 * least 5 units sold over the window before a depletion date is stated, and
 * the confidence is published next to the figure.
 */
export async function inventoryForecast(windowDays = 30): Promise<Forecast[]> {
  const list = await productRows();
  const velocity = await salesVelocity(windowDays);
  const vMap = new Map(velocity.map((v) => [v.productId, v]));
  const soldUnits = velocity.reduce((a, v) => a + v.units, 0);
  const anyHistory = soldUnits >= 20;
  return list.map((p) => {
    const v = vMap.get(p.id);
    const perDay = v ? v.perDay : 0;
    const confidence: Forecast["confidence"] = !anyHistory || !v ? "aucune" : v.units >= 12 ? "forte" : v.units >= 5 ? "faible" : "aucune";
    const daysLeft = perDay > 0 ? p.stock / perDay : null;
    const risk: Forecast["risk"] = confidence === "aucune" ? (p.stock === 0 ? "deficit" : "dormant") : p.stock === 0 ? "deficit" : daysLeft != null && daysLeft <= 10 ? "tension" : "ok";
    return {
      productId: p.id, name: p.name, sku: p.sku, stock: p.stock, threshold: p.threshold, image: p.image,
      perDay: Math.round(perDay * 100) / 100,
      daysLeft: daysLeft == null ? null : Math.round(daysLeft * 10) / 10,
      eta: daysLeft == null ? null : new Date(Date.now() + daysLeft * 86_400_000),
      risk, confidence,
    };
  });
}

export type Movement = {
  id: number; productId: number; product: string; sku: string; type: string; quantity: number; stockAfter: number;
  reason: string | null; orderId: number | null; userId: number | null; actor: string | null; createdAt: Date;
};

export async function movements(options: { productId?: number; limit?: number; type?: string } = {}) {
  const clauses: SQL[] = [];
  if (options.productId) clauses.push(sql`m.product_id = ${options.productId}`);
  if (options.type) clauses.push(sql`m.type = ${options.type}::movement_type`);
  const where = clauses.length ? sql`WHERE ${sql.join(clauses, sql` AND `)}` : sql``;
  const r = await rows<Record<string, unknown>>(sql`
    SELECT m.id, m.product_id, p.name AS product, p.sku, m.type, m.quantity, m.stock_after, m.reason, m.order_id, m.user_id,
      u.first_name || ' ' || u.last_name AS actor, m.created_at
    FROM inventory_movements m
    JOIN products p ON p.id = m.product_id
    LEFT JOIN users u ON u.id = m.user_id
    ${where}
    ORDER BY m.created_at DESC LIMIT ${options.limit ?? 120}`);
  return r.map((x) => ({
    id: num(x.id), productId: num(x.product_id), product: String(x.product), sku: String(x.sku), type: String(x.type),
    quantity: num(x.quantity), stockAfter: num(x.stock_after), reason: (x.reason as string | null) ?? null,
    orderId: x.order_id == null ? null : num(x.order_id), userId: x.user_id == null ? null : num(x.user_id),
    actor: (x.actor as string | null) ?? null, createdAt: ts(x.created_at),
  }));
}

/* ── Customers ───────────────────────────────────────────────────────────── */

export type CustomerMetric = {
  id: number; firstName: string; lastName: string; email: string; phone: string | null; role: string;
  locale: string; createdAt: Date; loyaltyPoints: number; notes: string | null; birthDate: Date | null; emailOptIn: boolean;
  orders: number; spent: number; aov: number; lastOrder: Date | null; firstOrder: Date | null;
  recencyDays: number | null; frequency: number; monetary: number; wishes: number; reviews: number; tickets: number; returns: number;
  segment: RfmSegment; r: number; f: number; m: number;
};

export type RfmSegment = "champion" | "loyal" | "nouveau" | "à risque" | "perdu" | "prospect";

export function rfmSegment(r: number, f: number, m: number, hasOrders: boolean): RfmSegment {
  if (!hasOrders) return "prospect";
  if (r >= 4 && f >= 4) return "champion";
  if (r >= 3 && f >= 3 && m >= 3) return "loyal";
  if (r >= 4 && f <= 2) return "nouveau";
  if (r <= 2 && f >= 3) return "à risque";
  if (r <= 1) return "perdu";
  return "loyal";
}

const score5 = (v: number, breaks: number[]) => { let s = 1; for (const b of breaks) if (v >= b) s++; return Math.min(5, s); };

export async function customerMetrics(): Promise<CustomerMetric[]> {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.locale, u.created_at, u.loyalty_points, u.notes,
      u.birth_date, u.email_opt_in,
      COALESCE(o.n, 0)::int AS orders, COALESCE(o.spent, 0) AS spent, o.last_order, o.first_order,
      COALESCE(w.n, 0)::int AS wishes, COALESCE(rv.n, 0)::int AS reviews,
      COALESCE(t.n, 0)::int AS tickets, COALESCE(rt.n, 0)::int AS returns
    FROM users u
    LEFT JOIN (SELECT user_id, COUNT(*)::int AS n, SUM(total_millimes) AS spent, MAX(created_at) AS last_order, MIN(created_at) AS first_order
               FROM orders WHERE status <> 'cancelled' AND user_id IS NOT NULL GROUP BY 1) o ON o.user_id = u.id
    LEFT JOIN (SELECT user_id, COUNT(*)::int AS n FROM wishlist_items GROUP BY 1) w ON w.user_id = u.id
    LEFT JOIN (SELECT user_id, COUNT(*)::int AS n FROM reviews WHERE user_id IS NOT NULL GROUP BY 1) rv ON rv.user_id = u.id
    LEFT JOIN (SELECT user_id, COUNT(*)::int AS n FROM support_tickets WHERE user_id IS NOT NULL GROUP BY 1) t ON t.user_id = u.id
    LEFT JOIN (SELECT user_id, COUNT(*)::int AS n FROM return_requests WHERE user_id IS NOT NULL GROUP BY 1) rt ON rt.user_id = u.id
    ORDER BY spent DESC NULLS LAST`);
  const now = Date.now();
  const orderCounts = r.map((x) => num(x.orders));
  const spendValues = r.map((x) => num(x.spent));
  const freqBreaks = [2, 4, 7, 12];
  const moneyBreaks = [300_000, 800_000, 1_500_000, 3_000_000];
  const totalCustomers = orderCounts.length;
  const orderPercentile = (n: number) => orderCounts.filter((v) => v <= n).length / Math.max(1, totalCustomers);
  void spendValues;
  return r.map((x) => {
    const orders = num(x.orders);
    const spent = num(x.spent);
    const lastOrder = tsOrNull(x.last_order);
    const recencyDays = lastOrder ? Math.floor((now - new Date(lastOrder).getTime()) / 86_400_000) : null;
    const rScore = recencyDays == null ? 1 : recencyDays <= 14 ? 5 : recencyDays <= 30 ? 4 : recencyDays <= 60 ? 3 : recencyDays <= 120 ? 2 : 1;
    const fScore = score5(orders, freqBreaks);
    const mScore = score5(spent, moneyBreaks);
    void orderPercentile;
    return {
      id: num(x.id), firstName: String(x.first_name), lastName: String(x.last_name), email: String(x.email),
      phone: (x.phone as string | null) ?? null, role: String(x.role), locale: String(x.locale),
      createdAt: ts(x.created_at), loyaltyPoints: num(x.loyalty_points), notes: (x.notes as string | null) ?? null,
      birthDate: tsOrNull(x.birth_date), emailOptIn: Boolean(x.email_opt_in),
      orders, spent, aov: orders ? spent / orders : 0, lastOrder, firstOrder: tsOrNull(x.first_order),
      recencyDays, frequency: orders, monetary: spent,
      wishes: num(x.wishes), reviews: num(x.reviews), tickets: num(x.tickets), returns: num(x.returns),
      segment: rfmSegment(rScore, fScore, mScore, orders > 0), r: rScore, f: fScore, m: mScore,
    };
  });
}

export async function rfmSummary() {
  const all = await customerMetrics();
  const segments: { key: RfmSegment; label: string; description: string; action: string }[] = [
    { key: "champion", label: "Champions", description: "Commandent souvent et récemment, panier élevé.", action: "Avant-premières, remerciement personnalisé" },
    { key: "loyal", label: "Fidèles", description: "Réguliers et rentables, sans être au sommet.", action: "Cures complémentaires, abonnement" },
    { key: "nouveau", label: "Nouveaux", description: "Premier achat récent, fréquence encore basse.", action: "Séquence de soin des 21 premiers jours" },
    { key: "à risque", label: "À risque", description: "Fidèles qui ne sont pas revenus depuis 60 jours.", action: "Relance avec conseil réel" },
    { key: "perdu", label: "Perdus", description: "Silencieux depuis plus de 120 jours.", action: "Dernière relance, puis retrait des campagnes" },
    { key: "prospect", label: "Prospects", description: "Compte créé, aucune commande.", action: "Diagnostic beauté, conseil au comptoir" },
  ];
  const totalSpent = all.reduce((a, c) => a + c.spent, 0);
  return segments.map((s) => {
    const mine = all.filter((c) => c.segment === s.key);
    return { ...s, count: mine.length, value: mine.reduce((a, c) => a + c.spent, 0), share: totalSpent ? (mine.reduce((a, c) => a + c.spent, 0) / totalSpent) * 100 : 0, customers: mine };
  });
}

/** Real retention ladder: registered → wishlist → first order → repeat → reviewed. */
export async function customerLadder() {
  const [r] = await rows<Record<string, unknown>>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS registered,
      (SELECT COUNT(DISTINCT user_id)::int FROM wishlist_items) AS wished,
      (SELECT COUNT(DISTINCT user_id)::int FROM orders WHERE status <> 'cancelled' AND user_id IS NOT NULL) AS bought,
      (SELECT COUNT(*)::int FROM (SELECT user_id FROM orders WHERE status <> 'cancelled' AND user_id IS NOT NULL GROUP BY 1 HAVING COUNT(*) >= 2) t) AS repeated,
      (SELECT COUNT(DISTINCT user_id)::int FROM reviews WHERE user_id IS NOT NULL) AS reviewed,
      (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active') AS subscribed,
      (SELECT COUNT(DISTINCT user_id)::int FROM diagnostics) AS diagnosed`);
  const registered = num(r?.registered);
  return [
    { key: "registered", label: "Comptes créés", count: registered, of: registered },
    { key: "diagnosed", label: "Diagnostic beauté fait", count: num(r?.diagnosed), of: registered },
    { key: "wished", label: "Liste d'envie utilisée", count: num(r?.wished), of: registered },
    { key: "bought", label: "Première commande", count: num(r?.bought), of: registered },
    { key: "repeated", label: "Deuxième commande", count: num(r?.repeated), of: registered },
    { key: "subscribed", label: "Abonnement actif", count: num(r?.subscribed), of: registered },
    { key: "reviewed", label: "Avis déposé", count: num(r?.reviewed), of: registered },
  ];
}

/* ── Search, wishlist, recommendations ───────────────────────────────────── */

export async function searchIntelligence(days = 30) {
  const [totals] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE results_count = 0)::int AS zero,
      COUNT(*) FILTER (WHERE out_of_stock)::int AS oos, COUNT(DISTINCT query)::int AS distinct_q,
      COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS identified
    FROM search_events WHERE created_at > now() - (${days}::text || ' days')::interval`);
  const top = await rows<{ query: string; n: number; zero: number; oos: number; prev: number }>(sql`
    SELECT query, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE results_count = 0)::int AS zero, COUNT(*) FILTER (WHERE out_of_stock)::int AS oos,
      COUNT(*) FILTER (WHERE created_at <= now() - (${days}::text || ' days')::interval AND created_at > now() - ((${days} * 2)::text || ' days')::interval)::int AS prev
    FROM search_events WHERE created_at > now() - ((${days} * 2)::text || ' days')::interval
    GROUP BY 1 ORDER BY n DESC LIMIT 40`);
  const zero = await rows<{ query: string; n: number; has_landing: boolean }>(sql`
    SELECT s.query, COUNT(*)::int AS n, EXISTS (SELECT 1 FROM query_landings ql WHERE ql.query = s.query AND ql.kind = 'zero') AS has_landing
    FROM search_events s WHERE s.results_count = 0 AND s.created_at > now() - (${days}::text || ' days')::interval
    GROUP BY 1 ORDER BY n DESC LIMIT 20`);
  const daily = await rows<{ at: Date; n: number; zero: number }>(sql`
    SELECT date_trunc('day', created_at) AS at, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE results_count = 0)::int AS zero
    FROM search_events WHERE created_at > now() - (${days}::text || ' days')::interval GROUP BY 1 ORDER BY 1`);
  return {
    totals: { n: num(totals?.n), zero: num(totals?.zero), oos: num(totals?.oos), distinctQueries: num(totals?.distinct_q), identifiedShoppers: num(totals?.identified) },
    top: top.map((x) => ({ query: x.query, count: num(x.n), zero: num(x.zero), oos: num(x.oos), previous: num(x.prev), trend: num(x.prev) ? ((num(x.n) - num(x.prev)) / num(x.prev)) * 100 : null })),
    zero: zero.map((x) => ({ query: x.query, count: num(x.n), hasLanding: Boolean(x.has_landing) })),
    daily: daily.map((x) => ({ at: ts(x.at), n: num(x.n), zero: num(x.zero) })),
    days,
  };
}

export async function wishlistIntelligence() {
  const top = await rows<Record<string, unknown>>(sql`
    SELECT p.id, p.name, p.image, p.stock, p.price_millimes AS price, COUNT(w.user_id)::int AS wishes,
      COALESCE(s.units, 0)::int AS units, COALESCE(s.revenue, 0) AS revenue, MAX(w.created_at) AS last_wish
    FROM wishlist_items w JOIN products p ON p.id = w.product_id
    LEFT JOIN (SELECT product_id, SUM(quantity)::int AS units, SUM(line_total_millimes) AS revenue FROM order_items GROUP BY 1) s ON s.product_id = p.id
    GROUP BY 1,2,3,4,5, s.units, s.revenue ORDER BY wishes DESC LIMIT 30`);
  const [totals] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS n, COUNT(DISTINCT product_id)::int AS products, COUNT(DISTINCT user_id)::int AS owners FROM wishlist_items`);
  const growth = await rows<{ at: Date; n: number }>(sql`
    SELECT date_trunc('week', created_at) AS at, COUNT(*)::int AS n FROM wishlist_items
    WHERE created_at > now() - interval '120 days' GROUP BY 1 ORDER BY 1`);
  const converted = await rows<Record<string, unknown>>(sql`
    SELECT p.id, p.name, COUNT(DISTINCT w.user_id)::int AS wished,
      COUNT(DISTINCT b.user_id)::int AS bought
    FROM wishlist_items w JOIN products p ON p.id = w.product_id
    LEFT JOIN orders b ON b.user_id = w.user_id AND b.status <> 'cancelled'
      AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = b.id AND oi.product_id = p.id)
    GROUP BY 1, 2 HAVING COUNT(DISTINCT b.user_id) > 0 ORDER BY wished DESC LIMIT 12`);
  return {
    totals: { items: num(totals?.n), products: num(totals?.products), owners: num(totals?.owners) },
    top: top.map((x) => ({
      id: num(x.id), name: String(x.name), image: (x.image as string | null) ?? null, stock: num(x.stock), price: num(x.price),
      wishes: num(x.wishes), units: num(x.units), revenue: num(x.revenue), gap: num(x.wishes) - num(x.units),
      lastWish: tsOrNull(x.last_wish),
    })),
    growth: growth.map((g) => ({ at: ts(g.at), n: num(g.n) })),
    converted: converted.map((c) => ({ id: num(c.id), name: String(c.name), wished: num(c.wished), bought: num(c.bought) })),
  };
}

export async function boughtTogether(limit = 12) {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT a.product_id AS p1, b.product_id AS p2, COUNT(*)::int AS n,
      pa.name AS name1, pb.name AS name2, pa.image AS img1, pb.image AS img2
    FROM order_items a
    JOIN order_items b ON a.order_id = b.order_id AND a.product_id < b.product_id
    JOIN products pa ON pa.id = a.product_id JOIN products pb ON pb.id = b.product_id
    JOIN orders o ON o.id = a.order_id AND o.status <> 'cancelled'
    GROUP BY 1,2,4,5,6,7 HAVING COUNT(*) >= 2 ORDER BY n DESC LIMIT ${limit}`);
  return r.map((x) => ({ a: { id: num(x.p1), name: String(x.name1), image: (x.img1 as string | null) ?? null }, b: { id: num(x.p2), name: String(x.name2), image: (x.img2 as string | null) ?? null }, count: num(x.n) }));
}

/* ── Categories / brands performance ─────────────────────────────────────── */

export async function categoryPerformance(p: Period) {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT c.id, c.name, COALESCE(SUM(oi.line_total_millimes), 0) AS revenue, COALESCE(SUM(oi.quantity),0)::int AS units,
      COUNT(DISTINCT o.id)::int AS orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.created_at BETWEEN ${p.from} AND ${p.to})::int AS orders_now
    FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products pr ON pr.id = oi.product_id
    JOIN categories c ON c.id = pr.universe_id
    WHERE o.status <> 'cancelled' AND o.created_at BETWEEN ${p.from} AND ${p.to}
    GROUP BY 1,2 ORDER BY revenue DESC`);
  return r.map((x) => ({ id: num(x.id), name: String(x.name), revenue: num(x.revenue), units: num(x.units), orders: num(x.orders) }));
}

export async function brandPerformance(p: Period) {
  const r = await rows<Record<string, unknown>>(sql`
    SELECT b.id, b.name, COALESCE(SUM(oi.line_total_millimes),0) AS revenue, COALESCE(SUM(oi.quantity),0)::int AS units,
      COUNT(DISTINCT o.id)::int AS orders, COUNT(DISTINCT pr.id)::int AS references
    FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products pr ON pr.id = oi.product_id
    JOIN brands b ON b.id = pr.brand_id
    WHERE o.status <> 'cancelled' AND o.created_at BETWEEN ${p.from} AND ${p.to}
    GROUP BY 1,2 ORDER BY revenue DESC`);
  return r.map((x) => ({ id: num(x.id), name: String(x.name), revenue: num(x.revenue), units: num(x.units), orders: num(x.orders), references: num(x.references) }));
}

/* ── Cart intelligence ───────────────────────────────────────────────────── */

/**
 * The shop's cart lives in the visitor's browser (localStorage) and is only
 * sent to the server at checkout. There is therefore no server-side cart to
 * count, and this module does not pretend otherwise: it measures what the
 * house *does* know — orders created and never settled — and names the missing
 * capability (a `carts` table written on add-to-cart).
 */
export async function cartIntelligence(p: Period) {
  const [r] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*) FILTER (WHERE payment_status = 'pending')::int AS pending_orders,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'pending'), 0) AS pending_value,
      COUNT(*) FILTER (WHERE payment_status = 'failed')::int AS failed_orders,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'failed'), 0) AS failed_value,
      COUNT(*)::int AS orders
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to} AND status NOT IN ('cancelled')`);
  const abandoned = await rows<{ bucket: string; n: number; value: number }>(sql`
    SELECT CASE WHEN o.payment_status = 'failed' THEN 'Paiement refusé' ELSE 'Jamais réglée' END AS bucket,
      COUNT(*)::int AS n, COALESCE(SUM(o.total_millimes),0) AS value
    FROM orders o WHERE o.created_at BETWEEN ${p.from} AND ${p.to} AND o.status <> 'cancelled' AND o.payment_status IN ('pending','failed')
    GROUP BY 1`);
  return {
    orders: num(r?.orders),
    pendingOrders: num(r?.pending_orders),
    pendingValue: num(r?.pending_value),
    failedOrders: num(r?.failed_orders),
    failedValue: num(r?.failed_value),
    abandoned: abandoned.map((a) => ({ bucket: a.bucket, count: num(a.n), value: num(a.value) })),
    instrumented: false,
  };
}

/* ── Named capability gaps ───────────────────────────────────────────────── */

export type Gap = { key: string; label: string; screen: string; needs: string; impact: string; present: string[] };

export const MEASUREMENT_GAPS: Gap[] = [
  {
    key: "traffic",
    label: "Trafic et visites",
    screen: "Conversion",
    needs: "Un enregistrement de page vue (table `page_views` ou événement `page.view` avec identifiant de session anonyme).",
    impact: "Impossible de calculer un taux de conversion visites → commande, ni l'origine du trafic.",
    present: ["Commandes", "Recherches (1 ligne par recherche)", "Événements : order.placed, wishlist.add, diagnostic.saved, return.create, ticket.created"],
  },
  {
    key: "cart",
    label: "Paniers abandonnés",
    screen: "Paniers",
    needs: "Une table `carts` (ou un événement `cart.add` avec session) : aujourd'hui le panier vit dans le navigateur du client et n'est envoyé qu'à la commande.",
    impact: "Le nombre de paniers ouverts puis abandonnés n'existe pas côté serveur.",
    present: ["Commandes créées non réglées", "Paiements refusés", "Commandes annulées"],
  },
  {
    key: "margin",
    label: "Marge et coût des marchandises",
    screen: "Analytique",
    needs: "Un prix d'achat par référence (`products.cost_millimes`) ou un coût moyen par laboratoire.",
    impact: "Seule la marge nulle est calculable ; aucune marge réelle n'est affichée.",
    present: ["Chiffre d'affaires", "Remises accordées", "Livraison facturée"],
  },
  {
    key: "payments",
    label: "Transactions carte bancaire",
    screen: "Paiements",
    needs: "Le module carte n'est pas implémenté : `payment_methods_enabled` accepte cod, bank_transfer et gift_card.",
    impact: "Aucune trace de transaction bancaire : le taux de succès carte n'existe pas.",
    present: ["Règlements COD, virement et carte cadeau", "Statuts pending / paid / refunded / failed"],
  },
  {
    key: "searchclick",
    label: "Clic après recherche",
    screen: "Recherche",
    needs: "Un identifiant de recherche conservé jusqu'au clic produit (`search_events.id` dans l'URL du résultat).",
    impact: "Le taux de clic et l'abandon de recherche restent indisponibles.",
    present: ["Requête, nombre de résultats, rupture", "Requêtes sans résultat", "Curation des pages d'atterrissage"],
  },
];

/* ── Activity ────────────────────────────────────────────────────────────── */

export type ActivityKind = "order" | "payment" | "stock" | "customer" | "review" | "support" | "return" | "email" | "search" | "admin";
export type ActivityEvent = {
  id: string; at: Date; kind: ActivityKind; title: string; detail: string | null; href: string | null;
  value: number | null; tone: "neutral" | "good" | "warn" | "bad";
};

export async function activityFeed(options: { from?: Date; to?: Date; kinds?: ActivityKind[]; limit?: number; offset?: number } = {}): Promise<ActivityEvent[]> {
  const from = options.from ?? new Date(Date.now() - 30 * 86_400_000);
  const to = options.to ?? new Date();
  const limit = options.limit ?? 80;
  const offset = options.offset ?? 0;
  const kindFilter = options.kinds?.length ? sql`AND kind IN (${sql.join(options.kinds.map((k) => sql`${k}`), sql`, `)})` : sql``;
  const r = await rows<Record<string, unknown>>(sql`
    WITH feed AS (
      SELECT 'order-' || e.id AS id, e.created_at AS at, 'order' AS kind,
        'Commande ' || o.number || ' — ' || COALESCE(e.message, e.status::text) AS title,
        o.shipping_address->>'fullName' AS detail, '/admin/commandes/' || o.id AS href, o.total_millimes AS value,
        CASE WHEN e.status::text IN ('cancelled','returned') THEN 'bad' WHEN e.status::text = 'delivered' THEN 'good' ELSE 'neutral' END AS tone
      FROM order_events e JOIN orders o ON o.id = e.order_id
      WHERE e.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'move-' || m.id, m.created_at, 'stock',
        CASE WHEN m.quantity >= 0 THEN 'Entrée de stock — ' ELSE 'Sortie de stock — ' END || p.name,
        COALESCE(m.reason, m.type::text), '/admin/produits/' || p.id, m.quantity,
        CASE WHEN m.quantity >= 0 THEN 'neutral' ELSE 'warn' END
      FROM inventory_movements m JOIN products p ON p.id = m.product_id
      WHERE m.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'user-' || u.id, u.created_at, 'customer', 'Nouveau compte — ' || u.first_name || ' ' || u.last_name, u.email, '/admin/clients/' || u.id, NULL, 'good'
      FROM users u WHERE u.created_at BETWEEN ${from} AND ${to} AND u.role = 'customer'
      UNION ALL
      SELECT 'review-' || r.id, r.created_at, 'review', 'Avis ' || r.rating || '/5 — ' || r.author_name, r.title, '/admin/avis', r.rating,
        CASE WHEN r.status = 'pending' THEN 'warn' ELSE 'neutral' END
      FROM reviews r JOIN products p ON p.id = r.product_id WHERE r.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'ticket-' || t.id, t.created_at, 'support', 'Message support — ' || t.subject, t.name || ' · ' || t.type::text, '/admin/support', NULL,
        CASE WHEN t.priority = 'urgent' THEN 'bad' WHEN t.status = 'open' THEN 'warn' ELSE 'neutral' END
      FROM support_tickets t WHERE t.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'return-' || rt.id, rt.created_at, 'return', 'Retour ' || rt.number || ' — ' || rt.reason, rt.status::text, '/admin/support', NULL,
        CASE WHEN rt.status = 'pending' THEN 'warn' ELSE 'neutral' END
      FROM return_requests rt WHERE rt.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'mail-' || m.id, COALESCE(m.sent_at, m.send_at), 'email', 'Lettre ' || m.kind, m.to || ' · ' || m.subject, '/admin/emails', NULL,
        CASE WHEN m.status = 'failed' THEN 'bad' WHEN m.status = 'pending' THEN 'warn' ELSE 'neutral' END
      FROM email_outbox m WHERE COALESCE(m.sent_at, m.send_at) BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'search-' || s.id, s.created_at, 'search', 'Recherche « ' || s.query || ' »', s.results_count || ' résultat(s)', '/admin/analytique/recherche', s.results_count,
        CASE WHEN s.results_count = 0 THEN 'warn' ELSE 'neutral' END
      FROM search_events s WHERE s.created_at BETWEEN ${from} AND ${to}
      UNION ALL
      SELECT 'audit-' || a.id, a.created_at, 'admin', a.action || ' · ' || a.entity, COALESCE(u.first_name || ' ' || u.last_name, 'système'), '/admin/audit', NULL, 'neutral'
      FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id WHERE a.created_at BETWEEN ${from} AND ${to}
    )
    SELECT * FROM feed WHERE 1 = 1 ${kindFilter} ORDER BY at DESC LIMIT ${limit} OFFSET ${offset}`);
  return r.map((x) => ({
    id: String(x.id), at: ts(x.at), kind: x.kind as ActivityKind, title: String(x.title),
    detail: (x.detail as string | null) ?? null, href: (x.href as string | null) ?? null,
    value: x.value == null ? null : num(x.value), tone: (x.tone as ActivityEvent["tone"]) ?? "neutral",
  }));
}

export async function activityCounts(from: Date, to: Date) {
  const r = await rows<{ kind: string; n: number }>(sql`
    WITH feed AS (
      SELECT 'order' AS kind, created_at FROM order_events WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'stock', created_at FROM inventory_movements WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'customer', created_at FROM users WHERE created_at BETWEEN ${from} AND ${to} AND role = 'customer'
      UNION ALL SELECT 'review', created_at FROM reviews WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'support', created_at FROM support_tickets WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'return', created_at FROM return_requests WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'email', COALESCE(sent_at, send_at) FROM email_outbox WHERE COALESCE(sent_at, send_at) BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'search', created_at FROM search_events WHERE created_at BETWEEN ${from} AND ${to}
      UNION ALL SELECT 'admin', created_at FROM audit_logs WHERE created_at BETWEEN ${from} AND ${to}
    ) SELECT kind, COUNT(*)::int AS n FROM feed GROUP BY 1 ORDER BY 2 DESC`);
  return r.map((x) => ({ kind: x.kind as ActivityKind, count: num(x.n) }));
}

/* ── System ──────────────────────────────────────────────────────────────── */

export async function systemCounts() {
  const [r] = await rows<Record<string, unknown>>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM order_items) AS items,
      (SELECT COUNT(*)::int FROM reviews) AS reviews,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status IN ('open', 'in_progress')) AS tickets,
      (SELECT COUNT(*)::int FROM inventory_movements) AS movements,
      (SELECT COUNT(*)::int FROM email_outbox) AS emails,
      (SELECT COUNT(*)::int FROM email_outbox WHERE status = 'failed') AS emails_failed,
      (SELECT COUNT(*)::int FROM email_outbox WHERE status = 'pending') AS emails_pending,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open') AS tickets_open,
      (SELECT COUNT(*)::int FROM reviews WHERE status = 'pending') AS reviews_pending,
      (SELECT COUNT(*)::int FROM search_events) AS searches,
      (SELECT COUNT(*)::int FROM analytics_events) AS events,
      (SELECT COUNT(*)::int FROM audit_logs) AS audits,
      (SELECT COUNT(*)::int FROM return_requests) AS returns,
      (SELECT COUNT(*)::int FROM return_requests WHERE status = 'pending') AS returns_pending,
      (SELECT COUNT(*)::int FROM promotions WHERE is_active) AS promos_active,
      (SELECT COUNT(*)::int FROM promotions WHERE is_active AND ends_at IS NOT NULL AND ends_at < now() + interval '14 days' AND ends_at > now()) AS promos_expiring,
      (SELECT COUNT(*)::int FROM restock_alerts WHERE notified_at IS NULL) AS restock_waiting`);
  const out = {} as Record<string, number>;
  for (const [k, v] of Object.entries(r ?? {})) out[k] = num(v);
  return out;
}

/** Database response time — measured, not guessed. */
export async function dbLatency(): Promise<{ ms: number; ok: boolean; error?: string }> {
  const t0 = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { ms: Date.now() - t0, ok: true };
  } catch (e) {
    return { ms: Date.now() - t0, ok: false, error: e instanceof Error ? e.message : "erreur inconnue" };
  }
}
