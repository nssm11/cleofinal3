import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, orders, products } from "@/db/schema";
import { publiclyVisible } from "@/lib/catalog";

/**
 * LA PREUVE VIVANTE — one read of what the house is actually doing.
 *
 * Everything here is a real count, taken at request time. The rule for this
 * file is stricter than elsewhere in the shop: **no number may be invented,
 * rounded up, or padded with a plausible-looking minimum.** If three orders
 * went out this week, the counter says three. A jury asks "where does that
 * figure come from?" and the answer has to be a query, not a story.
 *
 * Privacy is part of the same rule: the street knows a parcel went to
 * Sousse. It does not know to whom. Every field below is an aggregate or a
 * city — never a name, an address, an e-mail or an order number shown whole.
 */
export type Pulse = {
  /** Public references on the shelf right now. */
  references: number;
  /** Orders placed in the last seven days. */
  ordersWeek: number;
  /** Distinct cities delivered to, all time. */
  cities: number;
  /** Consultations recorded in the last seven days. */
  views: number;
  /** The most recent order, as the street would describe it. */
  last: { city: string | null; minutesAgo: number; status: string } | null;
  at: string;
};

export async function pulse(): Promise<Pulse> {
  const [rows] = await Promise.all([
    db.execute(sql`
      select
        (select count(*)::int from ${products} where ${publiclyVisible})                              as references,
        (select count(*)::int from ${orders} where created_at > now() - interval '7 days')            as orders_week,
        (select count(distinct shipping_address->>'city')::int from ${orders}
           where shipping_address->>'city' is not null)                                               as cities,
        (select count(*)::int from ${analyticsEvents} where created_at > now() - interval '7 days')   as views,
        (select extract(epoch from (now() - created_at)) / 60 from ${orders}
           order by created_at desc limit 1)                                                          as minutes_ago,
        (select shipping_address->>'city' from ${orders} order by created_at desc limit 1)            as city,
        (select status from ${orders} order by created_at desc limit 1)                               as status
    `),
  ]);

  const r = (rows as unknown as { rows: Record<string, unknown>[] }).rows?.[0] ?? {};
  const num = (v: unknown) => Number(v ?? 0);
  const minutesAgo = r.minutes_ago === null || r.minutes_ago === undefined ? null : num(r.minutes_ago);

  return {
    references: num(r.references),
    ordersWeek: num(r.orders_week),
    cities: num(r.cities),
    views: num(r.views),
    last:
      minutesAgo === null
        ? null
        : { city: (r.city as string) ?? null, minutesAgo, status: String(r.status ?? "") },
    at: new Date().toISOString(),
  };
}

/** "il y a 12 min" · "il y a 3 h" · "hier" — never "à l'instant" when it isn't. */
export function ago(minutes: number): string {
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${Math.round(minutes)} min`;
  if (minutes < 60 * 24) return `il y a ${Math.round(minutes / 60)} h`;
  const days = Math.round(minutes / (60 * 24));
  return days === 1 ? "hier" : `il y a ${days} jours`;
}
