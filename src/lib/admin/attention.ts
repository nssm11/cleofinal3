import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { boughtTogether, qualityAudit, wishlistIntelligence } from "./metrics";
import type { Period } from "./period";

async function rows<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res = (await db.execute(query)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] }).rows ?? []) as T[];
}
const num = (v: unknown) => Number(v ?? 0);

/* ══════════════════════════════════════════════════════════════════════════
   ATTENTION & OPPORTUNITÉS
   ──────────────────────────────────────────────────────────────────────────
   Two different jobs, deliberately kept apart:

   · ATTENTION — something is wrong *now* and someone owes the house a
     decision. Every item names the object, the delay, the owner and the one
     action that closes it. Counted from the live tables, never from a queue
     that has to be maintained twice.
   · OPPORTUNITÉ — nothing is broken; something is *under-used*. Signals are
     ranked by the money they could honestly represent (wishes that never
     became orders, pairs that sell together, catalogue growth), and each one
     links to the screen where the move is actually made.
   ══════════════════════════════════════════════════════════════════════════ */

export type Severity = "critical" | "high" | "normal";
export type Alert = {
  key: string;
  title: string;
  detail: string;
  count: number;
  severity: Severity;
  href: string;
  action: string;
  amount?: number;
  /** items the alert is about, ready for a drill-down */
  items?: { id: number | null; label: string; sub: string; href: string; value?: number }[];
};

export async function attentionQueue(): Promise<Alert[]> {
  const [counts] = await rows<Record<string, unknown>>(sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
      COUNT(*) FILTER (WHERE status = 'pending' AND created_at < now() - interval '12 hours')::int AS pending_old,
      COALESCE(SUM(total_millimes) FILTER (WHERE status = 'pending'), 0) AS pending_value,
      COUNT(*) FILTER (WHERE payment_status = 'failed')::int AS failed_payments,
      COALESCE(SUM(total_millimes) FILTER (WHERE payment_status = 'failed'), 0) AS failed_value,
      COUNT(*) FILTER (WHERE status IN ('confirmed','preparing') AND created_at < now() - interval '3 days')::int AS stuck_prep,
      COUNT(*) FILTER (WHERE status = 'delivered' AND payment_status = 'pending' AND created_at < now() - interval '7 days')::int AS uncollected,
      COALESCE(SUM(total_millimes) FILTER (WHERE status = 'delivered' AND payment_status = 'pending' AND created_at < now() - interval '7 days'), 0) AS uncollected_value
    FROM orders`);

  const [stock] = await rows<Record<string, unknown>>(sql`
    SELECT
      COUNT(*) FILTER (WHERE stock = 0 AND status = 'active')::int AS oos,
      COUNT(*) FILTER (WHERE stock > 0 AND stock <= low_stock_threshold AND status = 'active')::int AS low,
      COUNT(*) FILTER (WHERE status = 'active' AND (image IS NULL OR image = ''))::int AS no_media
    FROM products`);

  const [support] = await rows<Record<string, unknown>>(sql`
    SELECT
      (SELECT COUNT(*)::int FROM reviews WHERE status = 'pending') AS reviews_pending,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open') AS tickets_open,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open' AND priority IN ('high','urgent')) AS tickets_urgent,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'open' AND created_at < now() - interval '24 hours') AS tickets_old,
      (SELECT COUNT(*)::int FROM return_requests WHERE status IN ('pending','in_review')) AS returns_open,
      (SELECT COUNT(*)::int FROM email_outbox WHERE status = 'failed') AS emails_failed,
      (SELECT COUNT(*)::int FROM email_outbox WHERE status = 'pending' AND send_at < now() - interval '1 hour') AS emails_late,
      (SELECT COUNT(*)::int FROM restock_alerts WHERE notified_at IS NULL) AS restock_waiting,
      (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active' AND next_due_at < now()) AS subs_due,
      (SELECT COUNT(*)::int FROM promotions WHERE is_active AND ends_at IS NOT NULL AND ends_at < now() + interval '14 days' AND ends_at > now()) AS promos_expiring`);

  const alerts: Alert[] = [];

  const pendingList = await rows<{ id: number; number: string; at: Date; total: number; city: string; name: string; hours: number }>(sql`
    SELECT o.id, o.number, o.created_at AS at, o.total_millimes AS total, o.shipping_address->>'city' AS city,
      o.shipping_address->>'fullName' AS name, EXTRACT(EPOCH FROM (now() - o.created_at))/3600 AS hours
    FROM orders o WHERE o.status = 'pending' ORDER BY o.created_at ASC LIMIT 8`);
  if (num(counts?.pending_orders) > 0) {
    alerts.push({
      key: "orders-pending",
      title: "Commandes à confirmer",
      detail: `${num(counts?.pending_old)} en attente depuis plus de 12 heures — l'appel client est ce qui retient l'argent.`,
      count: num(counts?.pending_orders),
      severity: num(counts?.pending_old) > 0 ? "critical" : "high",
      href: "/admin/commandes?status=pending&sort=oldest",
      action: "Ouvrir la file",
      amount: num(counts?.pending_value),
      items: pendingList.map((o) => ({ id: o.id, label: o.number, sub: `${o.name} · ${o.city} · ${Math.round(num(o.hours))} h`, href: `/admin/commandes/${o.id}`, value: num(o.total) })),
    });
  }

  const failed = await rows<{ id: number; number: string; total: number; method: string; name: string }>(sql`
    SELECT o.id, o.number, o.total_millimes AS total, o.payment_method AS method, o.shipping_address->>'fullName' AS name
    FROM orders o WHERE o.payment_status = 'failed' ORDER BY o.created_at DESC LIMIT 8`);
  if (num(counts?.failed_payments) > 0) {
    alerts.push({
      key: "payments-failed",
      title: "Règlements en échec",
      detail: "Le paiement n'a pas abouti : à relancer ou à basculer en paiement à la livraison.",
      count: num(counts?.failed_payments), severity: "critical", href: "/admin/commandes?payment=failed",
      action: "Voir les commandes", amount: num(counts?.failed_value),
      items: failed.map((o) => ({ id: o.id, label: o.number, sub: `${o.name} · ${o.method}`, href: `/admin/commandes/${o.id}`, value: num(o.total) })),
    });
  }

  const lowStock = await rows<{ id: number; name: string; stock: number; threshold: number; sales: number }>(sql`
    SELECT p.id, p.name, p.stock, p.low_stock_threshold AS threshold, p.sales_count AS sales
    FROM products p WHERE p.status = 'active' AND p.stock > 0 AND p.stock <= p.low_stock_threshold
    ORDER BY p.stock ASC LIMIT 8`);
  if (num(stock?.low) > 0) {
    alerts.push({
      key: "stock-low",
      title: "Stock bas",
      detail: "Sous le seuil de la fiche : réapprovisionner avant la rupture.",
      count: num(stock?.low), severity: "high", href: "/admin/stock?view=low",
      action: "Ouvrir l'inventaire",
      items: lowStock.map((p) => ({ id: p.id, label: p.name, sub: `${p.stock} unité(s) — seuil ${p.threshold}`, href: `/admin/produits/${p.id}`, value: num(p.stock) })),
    });
  }

  const oos = await rows<{ id: number; name: string; wishes: number }>(sql`
    SELECT p.id, p.name, COUNT(w.user_id)::int AS wishes FROM products p
    LEFT JOIN wishlist_items w ON w.product_id = p.id
    WHERE p.status = 'active' AND p.stock = 0 GROUP BY 1,2 ORDER BY wishes DESC LIMIT 8`);
  if (num(stock?.oos) > 0) {
    alerts.push({
      key: "stock-out",
      title: "Références épuisées",
      detail: "Publiées sans stock : la fiche est visible et ne peut pas être vendue.",
      count: num(stock?.oos), severity: "critical", href: "/admin/stock?view=out",
      action: "Traiter les ruptures",
      items: oos.map((p) => ({ id: p.id, label: p.name, sub: `${num(p.wishes)} personne(s) l'attendent`, href: `/admin/produits/${p.id}`, value: num(p.wishes) })),
    });
  }

  if (num(counts?.uncollected) > 0) {
    alerts.push({
      key: "uncollected",
      title: "Livré et non encaissé",
      detail: "La marchandise est partie et le règlement traîne depuis plus de sept jours.",
      count: num(counts?.uncollected), severity: "high", href: "/admin/commandes?payment=pending&status=delivered",
      action: "Relancer les règlements", amount: num(counts?.uncollected_value),
    });
  }

  if (num(counts?.stuck_prep) > 0) {
    alerts.push({
      key: "prep-stuck",
      title: "Préparations immobilisées",
      detail: "Confirmées il y a plus de trois jours et toujours en atelier.",
      count: num(counts?.stuck_prep), severity: "high", href: "/admin/commandes?status=preparing",
      action: "Voir les préparations",
    });
  }

  if (num(support?.reviews_pending) > 0) {
    alerts.push({
      key: "reviews-pending",
      title: "Avis à modérer",
      detail: "Un avis publié rassure ; un avis oublié laisse la parole aux autres.",
      count: num(support?.reviews_pending), severity: "normal", href: "/admin/avis",
      action: "Modérer",
    });
  }
  if (num(support?.tickets_open) > 0) {
    alerts.push({
      key: "tickets-open",
      title: "Messages clients ouverts",
      detail: `${num(support?.tickets_urgent)} en priorité haute, ${num(support?.tickets_old)} depuis plus de 24 h.`,
      count: num(support?.tickets_open), severity: num(support?.tickets_urgent) > 0 ? "critical" : "high",
      href: "/admin/support", action: "Répondre",
    });
  }
  if (num(support?.returns_open) > 0) {
    alerts.push({ key: "returns", title: "Retours à statuer", detail: "Un retour non statué devient une cliente qui ne revient pas.", count: num(support?.returns_open), severity: "high", href: "/admin/support?tab=retours", action: "Statuer" });
  }
  if (num(support?.emails_failed) > 0) {
    alerts.push({ key: "emails-failed", title: "Lettres en échec", detail: "Le transporteur a refusé la remise : renvoyer ou corriger l'adresse.", count: num(support?.emails_failed), severity: "high", href: "/admin/emails?status=failed", action: "Ouvrir la file" });
  }
  if (num(support?.emails_late) > 0) {
    alerts.push({ key: "emails-late", title: "Lettres en retard", detail: "Programmées et non parties : le cron a besoin d'un passage.", count: num(support?.emails_late), severity: "normal", href: "/admin/emails?status=pending", action: "Vérifier" });
  }
  if (num(support?.restock_waiting) > 0) {
    alerts.push({ key: "restock-waiting", title: "« Prévenez-moi » en attente", detail: "Des clientes guettent un retour en rayon : les prévenir dès le réassort.", count: num(support?.restock_waiting), severity: "normal", href: "/admin/stock?view=out", action: "Voir les ruptures" });
  }
  if (num(support?.subs_due) > 0) {
    alerts.push({ key: "subs-due", title: "Recharges échues", detail: "Échéance dépassée : à expédier ou à reporter.", count: num(support?.subs_due), severity: "normal", href: "/admin/clients?tab=abonnements", action: "Traiter les abonnements" });
  }
  if (num(support?.promos_expiring) > 0) {
    alerts.push({ key: "promos-expiring", title: "Promotions qui expirent", detail: "Un code qui meurt sans relais laisse un creux de chiffre la semaine suivante.", count: num(support?.promos_expiring), severity: "normal", href: "/admin/promotions", action: "Reconduire" });
  }
  if (num(stock?.no_media) > 0) {
    alerts.push({ key: "no-media", title: "Fiches sans visuel", detail: "Sans image, la fiche ne peut pas être montrée.", count: num(stock?.no_media), severity: "critical", href: "/admin/qualite?kind=media", action: "Corriger les fiches" });
  }

  const order: Record<Severity, number> = { critical: 0, high: 1, normal: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity] || b.count - a.count);
}

/* ── Opportunities ───────────────────────────────────────────────────────── */

export type Opportunity = {
  key: string;
  title: string;
  detail: string;
  metric: string;
  metricLabel: string;
  severity: "chaud" | "tiede" | "calme";
  href: string;
  action: string;
  secondary?: { label: string; href: string }[];
  evidence: { label: string; value: string }[];
};

export async function opportunities(): Promise<Opportunity[]> {
  const out: Opportunity[] = [];
  const wish = await wishlistIntelligence();
  const gap = wish.top.filter((w) => w.gap >= 5 && w.stock > 0).slice(0, 5);
  if (gap.length) {
    const value = gap.reduce((a, g) => a + Math.round((g.wishes - g.units) * (g.price / 1000)), 0);
    out.push({
      key: "wishlist-gap",
      title: "Désirées sans être achetées",
      detail: `${gap.length} référence(s) sont mises de côté bien plus qu'elles ne sortent du comptoir. La demande existe : c'est la mise en avant qui manque.`,
      metric: `${gap.reduce((a, g) => a + g.gap, 0)}`, metricLabel: "écarts liste d'envie / ventes",
      severity: "chaud", href: "/admin/analytique/desir", action: "Explorer la liste d'envie",
      secondary: [{ label: "Composer une sélection", href: "/admin/mise-en-scene" }, { label: "Créer une promotion", href: "/admin/promotions" }],
      evidence: [
        { label: "Valeur indicative", value: `${value} DT` },
        ...gap.slice(0, 3).map((g) => ({ label: g.name, value: `${g.wishes} ♥ · ${g.units} vendues` })),
      ],
    });
  }

  const pairs = await boughtTogether(6);
  if (pairs.length) {
    out.push({
      key: "pairs",
      title: "Duos qui se vendent déjà ensemble",
      detail: "Ces couples partent dans le même panier sans que la maison ne les suggère nulle part.",
      metric: `${pairs.length}`, metricLabel: "paires récurrentes",
      severity: "chaud", href: "/admin/mise-en-scene?tab=duos", action: "Créer des duos",
      evidence: pairs.slice(0, 4).map((p) => ({ label: `${p.a.name} + ${p.b.name}`, value: `${p.count} commandes` })),
    });
  }

  const rising = await rows<{ id: number; name: string; now: number; before: number; revenue: number; image: string | null }>(sql`
    SELECT p.id, p.name, p.image,
      COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at > now() - interval '30 days'), 0)::int AS now,
      COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'), 0)::int AS before,
      COALESCE(SUM(oi.line_total_millimes) FILTER (WHERE o.created_at > now() - interval '30 days'), 0) AS revenue
    FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
    GROUP BY 1,2,3 HAVING COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'), 0) >= 2
    ORDER BY (COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at > now() - interval '30 days'), 0)::float / NULLIF(COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'), 0), 0)) DESC
    LIMIT 6`);
  const accelerating = rising.filter((r) => num(r.now) > num(r.before) * 1.3);
  if (accelerating.length) {
    out.push({
      key: "rising",
      title: "Références en accélération",
      detail: "Le rythme des trente derniers jours dépasse nettement celui du mois précédent.",
      metric: `${accelerating.length}`, metricLabel: "références en progression",
      severity: "tiede", href: "/admin/analytique/produits", action: "Voir les produits",
      evidence: accelerating.slice(0, 4).map((r) => ({ label: r.name, value: `${num(r.now)} vs ${num(r.before)} unités` })),
    });
  }

  const universes = await rows<{ name: string; now: number; before: number; revenue: number }>(sql`
    SELECT c.name,
      COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at > now() - interval '30 days'), 0)::int AS now,
      COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'), 0)::int AS before,
      COALESCE(SUM(oi.line_total_millimes) FILTER (WHERE o.created_at > now() - interval '30 days'), 0) AS revenue
    FROM categories c JOIN products p ON p.universe_id = c.id
    JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
    GROUP BY 1 HAVING COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'), 0) >= 5
    ORDER BY (COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at > now() - interval '30 days'), 0)::float / NULLIF(COALESCE(SUM(oi.quantity) FILTER (WHERE o.created_at BETWEEN now() - interval '60 days' AND now() - interval '30 days'), 0), 0)) DESC`);
  if (universes.length && num(universes[0].now) > num(universes[0].before) * 1.25) {
    const u = universes[0];
    out.push({
      key: "universe-growth",
      title: `L'univers ${u.name} accélère`,
      detail: "Une croissance de rayon mérite une vitrine, pas seulement un réassort.",
      metric: `+${Math.round(((num(u.now) - num(u.before)) / Math.max(1, num(u.before))) * 100)} %`, metricLabel: "unités sur 30 jours",
      severity: "chaud", href: "/admin/analytique/categories", action: "Analyser le rayon",
      secondary: [{ label: "Mettre en vitrine", href: "/admin/mise-en-scene" }],
      evidence: [{ label: `${u.name} — 30 jours`, value: `${num(u.now)} unités` }, { label: "30 jours précédents", value: `${num(u.before)} unités` }],
    });
  }

  const sleeping = await rows<{ id: number; name: string; spent: number; days: number; orders: number }>(sql`
    SELECT u.id, u.first_name || ' ' || u.last_name AS name, SUM(o.total_millimes) AS spent,
      EXTRACT(EPOCH FROM (now() - MAX(o.created_at)))/86400 AS days, COUNT(*)::int AS orders
    FROM users u JOIN orders o ON o.user_id = u.id AND o.status <> 'cancelled'
    GROUP BY 1,2 HAVING COUNT(*) >= 2 AND MAX(o.created_at) < now() - interval '75 days'
    ORDER BY SUM(o.total_millimes) DESC LIMIT 8`);
  if (sleeping.length) {
    out.push({
      key: "sleeping",
      title: "Clientes fidèles endormies",
      detail: "Elles ont commandé plus d'une fois, dépensé vraiment, et n'ont plus rien pris depuis 75 jours.",
      metric: `${sleeping.reduce((a, s) => a + num(s.spent) / 1000, 0).toFixed(0)} DT`, metricLabel: "chiffre d'affaires à reconquérir",
      severity: "tiede", href: "/admin/clients?segment=à%20risque", action: "Ouvrir le segment",
      secondary: [{ label: "Créer un code", href: "/admin/promotions" }],
      evidence: sleeping.slice(0, 3).map((s) => ({ label: s.name, value: `${num(s.orders)} commandes · ${Math.round(num(s.days))} j sans achat` })),
    });
  }

  const pendingSearch = await rows<{ query: string; n: number; landed: boolean }>(sql`
    SELECT s.query, COUNT(*)::int AS n,
      EXISTS (SELECT 1 FROM query_landings ql WHERE ql.query = s.query) AS landed
    FROM search_events s WHERE s.results_count = 0
    GROUP BY 1 ORDER BY n DESC LIMIT 6`);
  const uncurated = pendingSearch.filter((s) => !s.landed);
  if (uncurated.length) {
    out.push({
      key: "zero-search",
      title: "Demandes sans réponse",
      detail: "Des clientes cherchent un mot que le catalogue ne reconnaît pas : une page d'atterrissage curetée suffit souvent.",
      metric: `${num(uncurated[0].n)}`, metricLabel: `recherches pour « ${uncurated[0].query} »`,
      severity: "chaud", href: "/admin/analytique/recherche", action: "Curer ces requêtes",
      evidence: uncurated.slice(0, 4).map((s) => ({ label: s.query, value: `${num(s.n)} recherches sans résultat` })),
    });
  }

  const audit = await qualityAudit();
  const completeness = audit.byKind.filter((k) => ["media", "gallery", "description", "seo"].includes(k.kind));
  if (completeness.length) {
    const worst = completeness[0];
    out.push({
      key: "catalogue-completion",
      title: "Catalogue à compléter",
      detail: "Les fiches pauvres convertissent moins : chaque champ manquant est un argument en moins.",
      metric: `${audit.issues.length}`, metricLabel: "points à corriger",
      severity: "tiede", href: "/admin/qualite", action: "Ouvrir l'audit",
      evidence: completeness.slice(0, 3).map((k) => ({ label: k.label, value: `${k.n} référence(s)` })),
    });
    void worst;
  }

  const dormant = await rows<{ id: number; name: string; stock: number; last: Date }>(sql`
    SELECT p.id, p.name, p.stock, MAX(o.created_at) AS last
    FROM products p JOIN order_items oi ON oi.product_id = p.id JOIN orders o ON o.id = oi.order_id
    WHERE p.stock > 0 AND p.status = 'active' GROUP BY 1,2,3
    HAVING MAX(o.created_at) < now() - interval '60 days' ORDER BY p.stock DESC LIMIT 6`);
  if (dormant.length) {
    out.push({
      key: "dormant-stock",
      title: "Stock qui dort",
      detail: "Des références en rayon qui n'ont pas bougé depuis deux mois : trésorerie immobile.",
      metric: `${dormant.reduce((a, d) => a + num(d.stock), 0)}`, metricLabel: "unités dormantes",
      severity: "calme", href: "/admin/stock?view=dead", action: "Voir le stock dormant",
      evidence: dormant.slice(0, 3).map((d) => ({ label: d.name, value: `${num(d.stock)} unités · dernière vente il y a ${Math.round((Date.now() - new Date(d.last).getTime()) / 86_400_000)} j` })),
    });
  }

  return out;
}

/* ── Work queue: tasks + alerts, in one list ─────────────────────────────── */

export type QueueBucket = "critical" | "today" | "later";

export function bucketOf(severity: Severity, dueAt: Date | null): QueueBucket {
  if (severity === "critical") return "critical";
  if (severity === "high") return "today";
  if (dueAt && dueAt.getTime() < Date.now() + 86_400_000) return "today";
  return "later";
}

export async function periodStats(p: Period) {
  const [r] = await rows<Record<string, unknown>>(sql`
    SELECT COUNT(*)::int AS orders, COALESCE(SUM(total_millimes),0) AS revenue,
      COUNT(DISTINCT user_id)::int AS buyers
    FROM orders WHERE created_at BETWEEN ${p.from} AND ${p.to} AND status <> 'cancelled'`);
  return { orders: num(r?.orders), revenue: num(r?.revenue), buyers: num(r?.buyers) };
}
