import { NextResponse, type NextRequest } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories } from "@/db/schema";
import { quickSearch } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { clientKey } from "@/lib/origin";

export const dynamic = "force-dynamic";

/**
 * Search suggestions.
 *
 * A shopper does not always know the name of a product — they know a brand
 * ("Avène"), a need ("peau sensible") or a family ("solaire"). The endpoint
 * therefore answers with four buckets, and the immersive search surface
 * composes them. `items` keeps its original shape for existing callers.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return NextResponse.json({ items: [], brands: [], categories: [] });

  if (!(await rateLimit(`search:${await clientKey()}`, 40, 60_000))) {
    return NextResponse.json({ items: [], brands: [], categories: [] }, { status: 429 });
  }

  // Accent-insensitive so "serum" finds "Sérum" and "avene" finds "Avène".
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const [items, brandRows, categoryRows] = await Promise.all([
    quickSearch(q, 8),
    db
      .select({ slug: brands.slug, name: brands.name, country: brands.country })
      .from(brands)
      .where(or(sql`unaccent(${brands.name}) ILIKE unaccent(${like})`, ilike(brands.slug, like)))
      .orderBy(brands.name)
      .limit(4),
    db
      .select({ slug: categories.slug, name: categories.name, isUniverse: categories.isUniverse })
      .from(categories)
      .where(and(sql`unaccent(${categories.name}) ILIKE unaccent(${like})`, eq(categories.isUniverse, false)))
      .orderBy(categories.sortOrder)
      .limit(4),
  ]);

  return NextResponse.json(
    { items, brands: brandRows, categories: categoryRows },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
