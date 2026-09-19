import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses, giftCards, giftCardTransactions, orders, rituals, subscriptions } from "@/db/schema";
import { daysUntil } from "./lots";

/**
 * Ce que la cliente a le droit de voir, et d'emporter.
 *
 * Two questions a person is entitled to ask a shop that holds her data: *what
 * do you have about me*, and *what should I know about what I bought*. Both
 * are answered here, plainly, from the real rows — no summary, no estimate.
 */

export type ExpiringAtHome = {
  name: string;
  slug: string | null;
  lotNumber: string | null;
  expiresAt: Date | null;
  quantity: number;
  orderNumber: string;
  days: number | null;
};

/**
 * Les lots achetés qui approchent de leur date. A shop that knows a customer
 * still has a box from last spring does her a service by saying so — most
 * people throw away a tube they could have finished.
 */
export async function expiringAtHome(userId: number, withinDays = 120): Promise<ExpiringAtHome[]> {
  const rows = await db.execute(sql`
    SELECT oi.name, oi.lot_number, oi.lot_expires_at, oi.quantity, o.number AS order_number, p.slug
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = ${userId}
       AND oi.lot_expires_at IS NOT NULL
       AND oi.lot_expires_at > now()
       AND oi.lot_expires_at < now() + ${sql.raw(`interval '${Math.max(1, Math.floor(withinDays))} days'`)}
       AND o.status NOT IN ('cancelled', 'returned')
     ORDER BY oi.lot_expires_at ASC
     LIMIT 12`);
  return (rows.rows as Array<{ name: string; lot_number: string | null; lot_expires_at: string | Date; quantity: number; order_number: string; slug: string | null }>).map((r) => {
    const expiresAt = r.lot_expires_at instanceof Date ? r.lot_expires_at : new Date(r.lot_expires_at);
    return {
      name: r.name,
      slug: r.slug,
      lotNumber: r.lot_number,
      expiresAt,
      quantity: r.quantity,
      orderNumber: r.order_number,
      days: daysUntil(expiresAt),
    };
  });
}

export type ReorderCandidate = {
  productId: number;
  name: string;
  slug: string | null;
  lastBoughtAt: Date;
  /** Jours écoulés depuis le dernier achat. */
  daysSince: number;
  /** Cadence observée entre deux achats, en jours — nulle si un seul achat. */
  cadenceDays: number | null;
};

/**
 * Ce qui est probablement fini chez vous.
 *
 * The rule is the customer's own rhythm, not a marketing calendar: a product
 * bought at least twice comes back on the list once the observed interval
 * between purchases has passed by 20 %. One purchase only — no cadence to
 * speak of, so nothing is suggested.
 */
export async function reorderCandidates(userId: number, limit = 6): Promise<ReorderCandidate[]> {
  const rows = await db.execute(sql`
    WITH bought AS (
      SELECT oi.product_id, o.created_at
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ${userId} AND o.status NOT IN ('cancelled', 'returned') AND oi.product_id IS NOT NULL
    ),
    per AS (
      SELECT product_id, count(*)::int AS n, max(created_at) AS last_at, min(created_at) AS first_at
        FROM bought GROUP BY product_id HAVING count(*) >= 2
    )
    SELECT per.product_id, per.n, per.last_at, per.first_at,
           GREATEST(1, floor(EXTRACT(EPOCH FROM (per.last_at - per.first_at)) / 86400.0 / (per.n - 1)))::int AS cadence,
           EXTRACT(EPOCH FROM (now() - per.last_at)) / 86400.0 AS days_since,
           p.name, p.slug
      FROM per JOIN products p ON p.id = per.product_id
     WHERE p.status = 'active'
     ORDER BY per.last_at ASC
     LIMIT 40`);
  const out: ReorderCandidate[] = [];
  for (const r of rows.rows as Array<{ product_id: number; cadence: number; days_since: number; last_at: string | Date; name: string; slug: string | null }>) {
    const daysSince = Math.floor(Number(r.days_since));
    const cadence = Number(r.cadence);
    if (!Number.isFinite(cadence) || cadence <= 0) continue;
    if (daysSince < cadence * 1.2) continue;
    out.push({
      productId: r.product_id,
      name: r.name,
      slug: r.slug,
      lastBoughtAt: r.last_at instanceof Date ? r.last_at : new Date(r.last_at),
      daysSince,
      cadenceDays: cadence,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Tout ce que la maison garde sur une personne, dans un objet qu'elle peut
 * emporter. Les commandes sont incluses — ce sont ses factures.
 */
export async function exportPayload(userId: number) {
  const me = await db.execute(sql`
    SELECT id, email, first_name, last_name, phone, loyalty_points, locale, email_opt_in,
           email_verified_at, created_at
      FROM users WHERE id = ${userId}`);
  const person = me.rows[0] as Record<string, unknown> | undefined;
  if (!person) return null;

  const [addr, wish, orderRows, itemRows, reviewRows, ritualRows, subRows, giftRows] = await Promise.all([
    db.select().from(addresses).where(eq(addresses.userId, userId)),
    db.execute(sql`SELECT p.name, p.slug, w.created_at FROM wishlist_items w LEFT JOIN products p ON p.id = w.product_id WHERE w.user_id = ${userId} ORDER BY w.created_at DESC`),
    db.execute(sql`SELECT number, status, created_at, total_millimes, payment_method, payment_status, shipping_method, tracking_code FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`),
    db.execute(sql`
      SELECT o.number AS order_number, oi.name, oi.sku, oi.quantity, oi.unit_price_millimes, oi.line_total_millimes,
             oi.lot_number, oi.lot_expires_at::date AS lot_expires_at
        FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = ${userId} ORDER BY o.created_at DESC`),
    db.execute(sql`SELECT r.rating, r.title, r.body, r.status, r.created_at, p.name AS product FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.user_id = ${userId} ORDER BY r.created_at DESC`),
    db.select({ name: rituals.name, moment: rituals.moment, season: rituals.season, createdAt: rituals.createdAt }).from(rituals).where(eq(rituals.userId, userId)),
    db.select({ status: subscriptions.status, frequencyDays: subscriptions.frequencyDays, nextDueAt: subscriptions.nextDueAt }).from(subscriptions).where(eq(subscriptions.userId, userId)),
    /* Les cartes cadeaux sont au porteur : la maison ne sait pas à qui elles
       appartiennent tant qu'un code n'a pas été utilisé sur une commande. On
       exporte donc celles qui ont servi sur ses commandes, pas « les siennes ». */
    db.execute(sql`
      SELECT g.code_prefix, g.initial_millimes, g.balance_millimes, g.status, g.expires_at,
             t.amount_millimes, t.kind, t.created_at
        FROM gift_card_transactions t
        JOIN gift_cards g ON g.id = t.gift_card_id
        JOIN orders o ON o.id = t.order_id
       WHERE o.user_id = ${userId} ORDER BY t.created_at DESC`),
  ]);

  const loyalty = await db.execute(sql`SELECT kind, points, created_at FROM loyalty_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 200`);

  return {
    exportedAt: new Date().toISOString(),
    note: "Export complet des données que Cléopâtre conserve sur ce compte. Les commandes sont conservées dix ans (obligation comptable) et le resteront même après une suppression de compte, mais sans vos coordonnées.",
    account: person,
    addresses: addr,
    wishlist: wish.rows,
    orders: orderRows.rows,
    orderItems: itemRows.rows,
    reviews: reviewRows.rows,
    rituals: ritualRows,
    subscriptions: subRows,
    giftCardsUsedOnOrders: giftRows.rows,
    loyaltyLedger: loyalty.rows,
  };
}

/** Une coquille vide ne sert à rien : on dit ce que l'export contiendra. */
export async function exportSummary(userId: number): Promise<{ orders: number; items: number; addresses: number; wishlist: number; reviews: number; rituals: number }> {
  const r = await db.execute(sql`
    SELECT (SELECT count(*)::int FROM orders WHERE user_id = ${userId}) AS orders,
           (SELECT count(*)::int FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = ${userId}) AS items,
           (SELECT count(*)::int FROM addresses WHERE user_id = ${userId}) AS addresses,
           (SELECT count(*)::int FROM wishlist_items WHERE user_id = ${userId}) AS wishlist,
           (SELECT count(*)::int FROM reviews WHERE user_id = ${userId}) AS reviews,
           (SELECT count(*)::int FROM rituals WHERE user_id = ${userId}) AS rituals`);
  const row = r.rows[0] as Record<string, number>;
  return { orders: Number(row.orders), items: Number(row.items), addresses: Number(row.addresses), wishlist: Number(row.wishlist), reviews: Number(row.reviews), rituals: Number(row.rituals) };
}

/** Un mot d'aide quand un lot acheté va bientôt périmer — sans dramatiser. */
export function lotAdvice(days: number | null): string {
  if (days === null) return "date non communiquée";
  if (days <= 14) return `à finir dans ${days} jour(s)`;
  if (days <= 60) return `encore ${days} jours`;
  return `encore ${Math.round(days / 30)} mois`;
}
