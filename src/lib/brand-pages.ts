import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, products } from "@/db/schema";
import { publiclyVisible } from "@/lib/catalog";

/**
 * Brand-page read models.
 *
 * The dynamic route `/marque/[slug]` can render any laboratory, but these
 * helpers make the promise explicit: every existing brand is discoverable,
 * receives a route parameter during build, and has a small set of factual
 * counters so an empty or half-filled brand page never looks accidental.
 */

export async function listBrandSlugs() {
  return db.select({ slug: brands.slug }).from(brands).orderBy(asc(brands.slug));
}

export async function brandDirectoryRows() {
  return db
    .select({
      id: brands.id,
      slug: brands.slug,
      name: brands.name,
      country: brands.country,
      story: brands.story,
      isFeatured: brands.isFeatured,
      productCount: sql<number>`count(${products.id})::int`,
      inStockCount: sql<number>`count(${products.id}) filter (where ${products.stock} > 0)::int`,
      minPriceMillimes: sql<number>`coalesce(min(${products.priceMillimes}), 0)::int`,
      maxPriceMillimes: sql<number>`coalesce(max(${products.priceMillimes}), 0)::int`,
      updatedAt: brands.updatedAt,
    })
    .from(brands)
    .leftJoin(products, and(eq(products.brandId, brands.id), publiclyVisible))
    .groupBy(brands.id, brands.slug, brands.name, brands.country, brands.story, brands.isFeatured, brands.updatedAt)
    .orderBy(desc(brands.isFeatured), asc(brands.name));
}

export async function brandPageStats(brandId: number) {
  const [totals, categoriesRows] = await Promise.all([
    db
      .select({
        productCount: sql<number>`count(${products.id})::int`,
        inStockCount: sql<number>`count(${products.id}) filter (where ${products.stock} > 0)::int`,
        lowStockCount: sql<number>`count(${products.id}) filter (where ${products.stock} > 0 and ${products.stock} <= ${products.lowStockThreshold})::int`,
        avgRating: sql<number>`coalesce(round(avg(nullif(${products.ratingAvg}, 0))::numeric, 0), 0)::int`,
        reviewCount: sql<number>`coalesce(sum(${products.ratingCount}), 0)::int`,
        minPriceMillimes: sql<number>`coalesce(min(${products.priceMillimes}), 0)::int`,
        maxPriceMillimes: sql<number>`coalesce(max(${products.priceMillimes}), 0)::int`,
      })
      .from(products)
      .where(and(eq(products.brandId, brandId), publiclyVisible)),
    db
      .select({
        slug: categories.slug,
        name: categories.name,
        n: sql<number>`count(${products.id})::int`,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(eq(products.brandId, brandId), publiclyVisible))
      .groupBy(categories.slug, categories.name)
      .orderBy(desc(sql`count(${products.id})`), asc(categories.name)),
  ]);

  return {
    ...(totals[0] ?? {
      productCount: 0,
      inStockCount: 0,
      lowStockCount: 0,
      avgRating: 0,
      reviewCount: 0,
      minPriceMillimes: 0,
      maxPriceMillimes: 0,
    }),
    categories: categoriesRows.filter((row): row is { slug: string; name: string; n: number } => Boolean(row.slug && row.name)),
  };
}

export async function brandRouteAuditRows() {
  const rows = await brandDirectoryRows();
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    href: `/marque/${row.slug}`,
    hasStory: Boolean(row.story?.trim()),
    productCount: row.productCount,
    inStockCount: row.inStockCount,
    ready: row.productCount > 0,
  }));
}
