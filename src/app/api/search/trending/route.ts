import { NextResponse } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, products, searchEvents } from "@/db/schema";
import { productCardSelect, publiclyVisible, type ProductCard } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * The empty search room: what the country actually asks for, and what the
 * counter actually sells. Both are aggregates over committed rows — no
 * personal data, no per-visitor anything — so the answer caches publicly.
 */
export async function GET() {
  const [queries, topProducts] = await Promise.all([
    // Words that found something in the last 30 days, most asked first.
    // Zero-result queries are excluded: the room must not promise dead ends.
    db
      .select({ q: searchEvents.query, n: sql<number>`count(*)::int` })
      .from(searchEvents)
      .where(sql`${searchEvents.createdAt} > now() - interval '30 days' AND ${searchEvents.resultsCount} > 0`)
      .groupBy(searchEvents.query)
      .orderBy(sql`count(*) desc`)
      .limit(8),
    // The counter's best sellers, in stock and on sale.
    db
      .select(productCardSelect)
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(and(publiclyVisible, gt(products.stock, 0)))
      .orderBy(desc(products.salesCount))
      .limit(6),
  ]);
  return NextResponse.json(
    { queries, products: topProducts as ProductCard[] },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
  );
}
