import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lte, or, sql, type SQL } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { brands, categories, concerns, productConcerns, products, reviews } from "@/db/schema";
import { getLocale } from "@/lib/i18n/server";
import { localeCategory, localeConcern, translateCard, translateProductFull } from "@/lib/i18n/content";

/**
 * Single source of truth for "may this product be seen by the public?".
 * Every public read path (listing, search, related, feeds, `/api/products`)
 * must include this — filtering by hand at each call site is how draft and
 * archived products end up leaking behind a known id.
 * Admin screens query `products` directly and are NOT affected.
 */
export const publiclyVisible = eq(products.status, "active");



/** The tongue of the current request, applied to product-card rows. */
async function locCards<T extends { slug: string; shortDescription: string | null }>(rows: T[]): Promise<T[]> {
  const l = await getLocale();
  return l === "fr" ? rows : rows.map((r) => translateCard(r, l));
}

export const productCardSelect = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  shortDescription: products.shortDescription,
  priceMillimes: products.priceMillimes,
  compareAtMillimes: products.compareAtMillimes,
  stock: products.stock,
  lowStockThreshold: products.lowStockThreshold,
  image: products.image,
  volume: products.volume,
  isNew: products.isNew,
  isCounterPick: products.isCounterPick,
  ratingAvg: products.ratingAvg,
  ratingCount: products.ratingCount,
  brandName: brands.name,
  brandSlug: brands.slug,
};
export type ProductCard = {
  id: number; slug: string; name: string; shortDescription: string | null; priceMillimes: number;
  compareAtMillimes: number | null; stock: number; lowStockThreshold: number; image: string | null; volume: string | null;
  isNew: boolean; isCounterPick: boolean; ratingAvg: number; ratingCount: number; brandName: string | null; brandSlug: string | null;
};

/** Tolerances the officine actually verifies — the allowlist is the schema. */
export const TOLERANCE_KEYS = ["sansParfum", "grossesse", "peauAtopique", "yeuxSensibles"] as const;
export type ToleranceKey = (typeof TOLERANCE_KEYS)[number];
function tolCond(key: ToleranceKey): SQL {
  // key is from the allowlist above, never from user input.
  return sql`coalesce((${products.tolerances} ->> ${key})::boolean, false)`;
}

export type SortKey = "featured" | "price_asc" | "price_desc" | "newest" | "rating" | "bestsellers";
export type ListFilters = {
  q?: string;
  universeId?: number;
  categoryId?: number;
  categoryIds?: number[];
  brandSlugs?: string[];
  concernSlugs?: string[];
  concernId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  promo?: boolean;
  minRating?: number;
  tolerances?: ToleranceKey[];
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

const SEARCH_FOLD_FROM = "àáâãäåçèéêëìíîïñòóôõöøùúûüýÿ";
const SEARCH_FOLD_TO = "aaaaaaceeeeiiiinoooooouuuuyy";

/** Keep accent-insensitive search portable without requiring PostgreSQL extensions. */
function foldSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .toLowerCase();
}

function foldedColumn(column: unknown) {
  return sql`translate(lower(${column}), ${SEARCH_FOLD_FROM}, ${SEARCH_FOLD_TO})`;
}

function foldedMatch(column: unknown, pattern: string) {
  return sql`${foldedColumn(column)} ILIKE ${foldSearchText(pattern)}`;
}

/**
 * Build a LIKE pattern that is safe against `%`/`_` (LIKE wildcards) in the
 * user's input and matches anywhere in the text. Both sides are accent-folded
 * so "serum" finds "Sérum" while the query stays portable in local PGlite.
 */
function likePattern(q: string): string {
  const escaped = q.trim().replace(/[\\%_]/g, (m) => `\\${m}`);
  return `%${escaped}%`;
}

function baseWhere(f: ListFilters): SQL[] {
  const w: SQL[] = [publiclyVisible];
  if (f.q) {
    const pat = likePattern(f.q);
    w.push(
      or(
        foldedMatch(products.name, pat),
        foldedMatch(products.shortDescription, pat),
        foldedMatch(brands.name, pat),
      )!,
    );
  }
  if (f.universeId) w.push(eq(products.universeId, f.universeId));
  if (f.categoryId) w.push(eq(products.categoryId, f.categoryId));
  if (f.categoryIds?.length) w.push(inArray(products.categoryId, f.categoryIds));
  if (f.brandId) w.push(eq(products.brandId, f.brandId));
  if (f.brandSlugs?.length) w.push(inArray(brands.slug, f.brandSlugs));
  if (f.minPrice) w.push(gte(products.priceMillimes, f.minPrice));
  if (f.maxPrice) w.push(lte(products.priceMillimes, f.maxPrice));
  if (f.inStock) w.push(sql`${products.stock} > 0`);
  if (f.promo) w.push(and(isNotNull(products.compareAtMillimes), sql`${products.compareAtMillimes} > ${products.priceMillimes}`)!);
  if (f.minRating) w.push(gte(products.ratingAvg, f.minRating * 100));
  if (f.concernId) {
    w.push(sql`${products.id} IN (SELECT product_id FROM product_concerns WHERE concern_id = ${f.concernId})`);
  }
  if (f.concernSlugs?.length) {
    w.push(
      sql`${products.id} IN (SELECT pc.product_id FROM product_concerns pc JOIN concerns c ON c.id = pc.concern_id WHERE c.slug IN ${f.concernSlugs})`,
    );
  }
  if (f.tolerances?.length) {
    for (const k of f.tolerances) {
      if ((TOLERANCE_KEYS as readonly string[]).includes(k)) w.push(tolCond(k as ToleranceKey));
    }
  }
  return w;
}

function orderBy(sort: SortKey = "featured") {
  switch (sort) {
    case "price_asc": return [asc(products.priceMillimes)];
    case "price_desc": return [desc(products.priceMillimes)];
    case "newest": return [desc(products.createdAt)];
    case "rating": return [desc(products.ratingAvg), desc(products.ratingCount)];
    case "bestsellers": return [desc(products.salesCount)];
    default: return [desc(products.isFeatured), desc(products.salesCount), asc(products.name)];
  }
}

export async function listProducts(f: ListFilters) {
  const perPage = Math.min(f.perPage ?? 24, 48);
  const page = Math.max(f.page ?? 1, 1);
  const where = and(...baseWhere(f));
  let [items, countRow] = await Promise.all([
    db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(where)
      .orderBy(...orderBy(f.sort)).limit(perPage).offset((page - 1) * perPage),
    db.select({ n: sql<number>`count(*)::int` }).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(where),
  ]);
  let total = countRow[0]?.n ?? 0;
  /* Typo tolerance (P03): when the exact shelf is empty, the trigram index
     answers “what did you mean” — honestly labelled, never silently mixed. */
  let fuzzy = false;
  if (f.q && total === 0 && page === 1) {
    const fuzzyWhere = and(...baseWhere({ ...f, q: undefined }), foldedMatch(products.name, f.q));
    const [fzItems, fzCount] = await Promise.all([
      db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(fuzzyWhere)
        .orderBy(sql`lower(${products.name}) asc`, desc(products.salesCount)).limit(perPage),
      db.select({ n: sql<number>`count(*)::int` }).from(products).where(fuzzyWhere),
    ]);
    if (fzItems.length) {
      items = fzItems;
      total = fzCount[0]?.n ?? 0;
      fuzzy = true;
    }
  }
  return { items: await locCards(items as ProductCard[]), total, page, perPage, fuzzy, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function facetsFor(f: ListFilters) {
  const where = and(...baseWhere({ ...f, brandSlugs: undefined, concernSlugs: undefined, tolerances: undefined, minPrice: undefined, maxPrice: undefined, inStock: undefined, promo: undefined, minRating: undefined }));
  const [brandRows, concernRows, priceRow, tolRow] = await Promise.all([
    db.select({ slug: brands.slug, name: brands.name, n: sql<number>`count(*)::int` }).from(products)
      .innerJoin(brands, eq(brands.id, products.brandId)).where(where).groupBy(brands.slug, brands.name).orderBy(asc(brands.name)),
    db.select({ slug: concerns.slug, name: concerns.name, n: sql<number>`count(distinct ${products.id})::int` }).from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .innerJoin(productConcerns, eq(productConcerns.productId, products.id))
      .innerJoin(concerns, eq(concerns.id, productConcerns.concernId)).where(where).groupBy(concerns.slug, concerns.name).orderBy(asc(concerns.name)),
    db.select({ min: sql<number>`coalesce(min(${products.priceMillimes}),0)::int`, max: sql<number>`coalesce(max(${products.priceMillimes}),0)::int` })
      .from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(where),
    // Count, in scope, how many products carry a verified `true` for each
    // tolerance. A key with zero is dropped by the UI — no filter without data.
    db.select({
      sansParfum: sql<number>`count(*) filter (where ${tolCond("sansParfum")})::int`,
      grossesse: sql<number>`count(*) filter (where ${tolCond("grossesse")})::int`,
      peauAtopique: sql<number>`count(*) filter (where ${tolCond("peauAtopique")})::int`,
      yeuxSensibles: sql<number>`count(*) filter (where ${tolCond("yeuxSensibles")})::int`,
    }).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(where),
  ]);
  const tolCounts = tolRow[0] ?? { sansParfum: 0, grossesse: 0, peauAtopique: 0, yeuxSensibles: 0 };
  const tolerances = TOLERANCE_KEYS.map((k) => ({ key: k, n: tolCounts[k] })).filter((t) => t.n > 0);
  return { brands: brandRows, concerns: concernRows, tolerances, priceMin: priceRow[0]?.min ?? 0, priceMax: priceRow[0]?.max ?? 0 };
}

export const getProductBySlug = cache(async (slug: string) => {
  const p = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), publiclyVisible),
    with: { brand: true, category: true, universe: true, concerns: { with: { concern: true } } },
  });
  if (!p) return null;
  /* P02 — approved and purchase-verified, or not shown at all. */
  const approved = await db.select().from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, "approved"), eq(reviews.isVerified, true))).orderBy(desc(reviews.createdAt)).limit(20);
  const loc = await getLocale();
  const full = { ...p, reviews: approved };
  if (loc === "fr") return full;
  return {
    ...translateProductFull(full, loc, p.universe?.slug ?? ""),
    reviews: approved,
    category: p.category ? localeCategory(p.category, loc) : p.category,
    universe: p.universe ? localeCategory(p.universe, loc) : p.universe,
  };
});

export async function getRelated(productId: number, categoryId: number | null, universeId: number | null, limit = 4) {
  const w: SQL[] = [publiclyVisible, sql`${products.id} <> ${productId}`];
  if (categoryId) w.push(eq(products.categoryId, categoryId));
  else if (universeId) w.push(eq(products.universeId, universeId));
  const rows = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(and(...w)).orderBy(desc(products.salesCount)).limit(limit);
  return locCards(rows as ProductCard[]);
}

export async function getFeatured(limit = 8) {
  const rows = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, eq(products.isFeatured, true))).orderBy(desc(products.salesCount)).limit(limit);
  return locCards(rows as ProductCard[]);
}
/**
 * NOUVEAUTÉS, kept honest: the rail shows only what actually arrived in the
 * last 14 days (launch date when the office set one, creation date otherwise).
 * A “Nouveauté” badge that never expires is just an old product lying politely.
 */
export const NOUVEAUTES_WINDOW_DAYS = 14;
export async function getNewArrivals(limit = 8) {
  const rows = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(
      publiclyVisible,
      eq(products.isNew, true),
      sql`coalesce(${products.launchedAt}, ${products.createdAt}) >= now() - make_interval(days => ${NOUVEAUTES_WINDOW_DAYS})`,
    ))
    .orderBy(desc(sql`coalesce(${products.launchedAt}, ${products.createdAt})`)).limit(limit);
  return locCards(rows as ProductCard[]);
}

/** Rows for the compare table — full facts, ordered as the ids came in. */
export async function getCompareRows(ids: number[]) {
  if (!ids.length) return [];
  const [rows, brandRows] = await Promise.all([
    db.select().from(products).where(and(inArray(products.id, ids), publiclyVisible)),
    db.select({ id: brands.id, name: brands.name }).from(brands),
  ]);
  const bn = new Map(brandRows.map((b) => [b.id, b.name]));
  const loc = await getLocale();
  const out = rows.map((r) => ({
    product: loc === "fr" ? r : translateCard(r, loc),
    brandName: r.brandId ? bn.get(r.brandId) ?? null : null,
  }));
  const map = new Map(out.map((x) => [x.product.id, x]));
  return ids.map((id) => map.get(id)).filter((x): x is (typeof out)[number] => !!x);
}
export async function getPromoProducts(limit = 8) {
  const rows = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, isNotNull(products.compareAtMillimes), sql`${products.compareAtMillimes} > ${products.priceMillimes}`))
    .orderBy(desc(sql`${products.compareAtMillimes} - ${products.priceMillimes}`)).limit(limit);
  return locCards(rows as ProductCard[]);
}
export async function getByIds(ids: number[]) {
  if (!ids.length) return [] as ProductCard[];
  const rows = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(and(inArray(products.id, ids), publiclyVisible));
  const map = new Map(rows.map((r) => [r.id, r as ProductCard]));
  return locCards(ids.map((id) => map.get(id)).filter((x): x is ProductCard => !!x));
}

export const getUniverses = cache(async () => {
  const loc = await getLocale();
  const rows = await db.query.categories.findMany({ where: eq(categories.isUniverse, true), orderBy: asc(categories.sortOrder), with: { children: { orderBy: asc(categories.sortOrder) } } });
  if (loc === "fr") return rows;
  return rows.map((u) => ({ ...localeCategory(u, loc), children: u.children.map((c) => localeCategory(c, loc)) }));
});
export const getCategoryBySlug = cache(async (slug: string) => {
  const loc = await getLocale();
  const row = await db.query.categories.findFirst({ where: eq(categories.slug, slug), with: { children: { orderBy: asc(categories.sortOrder) }, parent: true } });
  if (!row || loc === "fr") return row;
  return {
    ...localeCategory(row, loc),
    children: row.children.map((c) => localeCategory(c, loc)),
    parent: row.parent ? localeCategory(row.parent, loc) : null,
  };
});
export const getBrands = cache(async () => db.select().from(brands).orderBy(asc(brands.name)));
export const getBrandBySlug = cache(async (slug: string) => db.query.brands.findFirst({ where: eq(brands.slug, slug) }));
export const getConcerns = cache(async () => {
  const loc = await getLocale();
  const rows = await db.select().from(concerns).orderBy(asc(concerns.name));
  return loc === "fr" ? rows : rows.map((c) => localeConcern(c, loc));
});
export const getConcernBySlug = cache(async (slug: string) => {
  const loc = await getLocale();
  const row = await db.query.concerns.findFirst({ where: eq(concerns.slug, slug) });
  return row && loc !== "fr" ? localeConcern(row, loc) : row;
});

export async function quickSearch(q: string, limit = 6) {
  if (q.trim().length < 2) return [] as ProductCard[];
  const pat = likePattern(q);
  const rows = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(
      publiclyVisible,
      or(
        foldedMatch(products.name, pat),
        foldedMatch(brands.name, pat),
        foldedMatch(products.shortDescription, pat),
      ),
    ))
    .orderBy(desc(products.salesCount)).limit(limit);
  if (rows.length) return locCards(rows as ProductCard[]);
  /* Suggestions tolerate a mistyped finger the same way the shelf does. */
  const fz = await db.select(productCardSelect).from(products).leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, foldedMatch(products.name, q)))
    .orderBy(sql`lower(${products.name}) asc`).limit(limit);
  return locCards(fz as ProductCard[]);
}

/** Needs whose name is close to the query — used by the rescue of an empty search. */
export async function concernsNearQuery(q: string, limit = 5) {
  if (q.trim().length < 2) return [] as { slug: string; name: string; n: number }[];
  const pat = likePattern(q);
  const rows = await db
    .select({ slug: concerns.slug, name: concerns.name, n: sql<number>`count(*)::int` })
    .from(concerns)
    .innerJoin(productConcerns, eq(productConcerns.concernId, concerns.id))
    .innerJoin(products, and(eq(products.id, productConcerns.productId), publiclyVisible))
    .where(or(foldedMatch(concerns.name, pat), foldedMatch(concerns.name, q)))
    .groupBy(concerns.slug, concerns.name)
    .orderBy(sql`max(length(${concerns.name})) desc`, desc(sql`count(*)`))
    .limit(limit);
  return rows;
}
