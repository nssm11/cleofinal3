import "server-only";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, duos, productPairs, productSubstitutes, products, routineSteps, shelves } from "@/db/schema";
import type { LText } from "@/db/schema";
import { getLocale } from "@/lib/i18n/server";
import { pickLText } from "@/lib/ltext";
import { translateCardsAll } from "@/lib/i18n/content";
import { publiclyVisible, type ProductCard } from "@/lib/catalog";
import { monthWindowActive, tunisMonth } from "@/lib/merch-math";

/**
 * LA MISE EN SCÈNE (P01) — the reads behind the staff-curated surfaces:
 * seasonal shelves, need→routine strips, out-of-stock substitutions, duo
 * bundles and the brand hero trio. Rules first, products second: a surface
 * without enough curated truth is simply not rendered — a shelf of one, a dead
 * link in a ritual, an incomplete duo all stay silent rather than pad the page.
 */

const cardCols = {
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
};
type MerchCard = ProductCard;

const loc = () => getLocale();
const L = (t: LText | null | undefined, locale: Awaited<ReturnType<typeof loc>>) => pickLText(t, locale);

/** Resolve a set of ids to visible, in-stock cards (order supplied by caller). */
async function cardsByIds(ids: number[], opts: { inStock: boolean }) {
  if (!ids.length) return [] as MerchCard[];
  const where = opts.inStock
    ? and(inArray(products.id, ids), publiclyVisible, gt(products.stock, 0))
    : and(inArray(products.id, ids), publiclyVisible);
  const found = (await db
    .select({ ...cardCols, brandName: brands.name, brandSlug: brands.slug })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(where)) as MerchCard[];
  const byId = new Map(found.map((p) => [p.id, p]));
  const locale = await loc();
  const ordered = ids.map((id) => byId.get(id)).filter((x): x is MerchCard => !!x);
  return locale === "fr" ? ordered : translateCardsAll(ordered, locale);
}

/** THE SEASONAL SHELF — at most one shelf, the one the calendar points to. */
export async function getShelfForToday(now = new Date()) {
  const rows = await db.select().from(shelves).where(eq(shelves.isActive, true)).orderBy(asc(shelves.id));
  const month = tunisMonth(now);
  const shelf = rows.find((s) => monthWindowActive(month, s.startMonth, s.endMonth));
  if (!shelf || shelf.productIds.length < 2) return null;
  const items = await cardsByIds(shelf.productIds, { inStock: false });
  if (items.length < 2) return null;
  const locale = await loc();
  return {
    id: shelf.id,
    title: L(shelf.title, locale),
    subtitle: L(shelf.subtitle, locale),
    items,
  };
}

/** THE ROUTINE STRIP — shown only when exactly three live gestures are curated. */
export async function getRoutineStrip(concernId: number) {
  const rows = await db
    .select({ position: routineSteps.position, label: routineSteps.label, reason: routineSteps.reason, productId: routineSteps.productId })
    .from(routineSteps)
    .where(eq(routineSteps.concernId, concernId))
    .orderBy(asc(routineSteps.position));
  if (rows.length !== 3) return null;
  const cards = await cardsByIds(rows.map((r) => r.productId), { inStock: false });
  const byId = new Map(cards.map((c) => [c.id as number, c]));
  const locale = await loc();
  const steps = rows
    .map((r, i) => ({ product: byId.get(r.productId) ?? null, label: L(r.label, locale), reason: L(r.reason, locale), position: i + 1 }))
    .filter((x): x is { product: MerchCard; label: string; reason: string; position: number } => !!x.product);
  if (steps.length !== 3) return null; // a broken ritual is worse than none
  return steps;
}

/** THE SUBSTITUTION — “Remplacer par”, staff-approved, in stock, max two. */
export async function getSubstitutes(productId: number) {
  const rows = await db
    .select({ productId: productSubstitutes.substituteProductId, reason: productSubstitutes.reason })
    .from(productSubstitutes)
    .where(eq(productSubstitutes.productId, productId))
    .orderBy(asc(productSubstitutes.position))
    .limit(2);
  if (!rows.length) return null;
  const cards = await cardsByIds(rows.map((r) => r.productId), { inStock: true });
  const byId = new Map(cards.map((c) => [c.id as number, c]));
  const locale = await loc();
  const items = rows
    .map((r) => ({ product: byId.get(r.productId) ?? null, reason: L(r.reason, locale) }))
    .filter((x): x is { product: MerchCard; reason: string } => !!x.product);
  if (!items.length) return null; // honest: no approved substitute in stock, no claim
  return items;
}

/** THE DUO — active bundles that contain this product, both members in stock. */
export async function getDuosForProduct(productId: number) {
  const rows = await db
    .select()
    .from(duos)
    .where(and(eq(duos.isActive, true), sql`${productId} in (${duos.productIdA}, ${duos.productIdB})`))
    .limit(2);
  if (!rows.length) return null;
  const locale = await loc();
  const out = [];
  for (const d of rows) {
    const members = await cardsByIds([d.productIdA, d.productIdB], { inStock: true });
    if (members.length !== 2) continue; // an incomplete duo is not on offer
    const sum = members.reduce((a, m) => a + (m.priceMillimes as number), 0);
    // Honest, small, and never the whole price: the duo pays for something.
    const discount = Math.max(0, Math.min(d.discountMillimes, sum - 1));
    out.push({
      id: d.id,
      slug: d.slug,
      name: L(d.name, locale),
      note: d.note,
      discountMillimes: discount,
      duoPrice: sum - discount,
      sumPrice: sum,
      members,
    });
  }
  return out.length ? out : null;
}

/**
 * “Souvent associé” (P02) — at most two complements, curated with a one-line
 * pharmacist reason, live products only. No row → the block is not rendered;
 * an algorithmic “frequently bought together” would be a claim we can't sign.
 */
export async function getFrequentlyBought(productId: number): Promise<{ product: MerchCard; reason: string }[]> {
  const rows = await db
    .select({ pairId: productPairs.pairProductId, reason: productPairs.reason })
    .from(productPairs)
    .where(eq(productPairs.productId, productId))
    .orderBy(asc(productPairs.position))
    .limit(2);
  if (!rows.length) return [];
  const cards = await cardsByIds(rows.map((r) => r.pairId), { inStock: true });
  const byId = new Map(cards.map((c) => [c.id as number, c]));
  return rows
    .map((r) => ({ product: byId.get(r.pairId) ?? null, reason: r.reason ?? "" }))
    .filter((x): x is { product: MerchCard; reason: string } => !!x.product);
}

/** THE BRAND HERO TRIO — curated SKUs first, the lab’s top sellers complete it. */
export async function getBrandHeroProducts(brandId: number) {
  const [brand] = await db.select({ heroProductIds: brands.heroProductIds }).from(brands).where(eq(brands.id, brandId));
  const hero = (brand?.heroProductIds ?? []).filter((n): n is number => Number.isInteger(n)).slice(0, 3);
  const heroOrder = hero.length
    ? sql`coalesce(array_position(array[${sql.join(hero.map((h) => sql`${h}`), sql`,`)}]::int[], ${products.id}), 99)`
    : null;
  const rows = await db
    .select({ ...cardCols, brandName: brands.name, brandSlug: brands.slug })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, eq(products.brandId, brandId)))
    .orderBy(...(heroOrder ? [heroOrder, desc(products.salesCount)] : [desc(products.salesCount)]))
    .limit(3);
  if (!rows.length) return [];
  const locale = await loc();
  return locale === "fr" ? rows : translateCardsAll(rows, locale);
}
