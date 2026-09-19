import "server-only";
import { and, asc, desc, eq, gt, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, orderItems, orders, productLots, products, reviews, stores, wishlistItems } from "@/db/schema";
import { publiclyVisible } from "@/lib/catalog";

export async function productToolRows(limit = 80) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brandName: brands.name,
      categoryName: categories.name,
      priceMillimes: products.priceMillimes,
      stock: products.stock,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      ingredients: products.ingredients,
      shortDescription: products.shortDescription,
      keyActives: products.keyActives,
      texture: products.texture,
      volume: products.volume,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(publiclyVisible)
    .orderBy(desc(products.salesCount), asc(products.name))
    .limit(limit);
}

export async function selectProducts(limit = 80) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brandName: brands.name,
      priceMillimes: products.priceMillimes,
      stock: products.stock,
      volume: products.volume,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(publiclyVisible)
    .orderBy(desc(products.salesCount), asc(products.name))
    .limit(limit);
}

export async function miniProducts(limit = 120) {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brandName: brands.name,
      image: products.image,
      priceMillimes: products.priceMillimes,
      stock: products.stock,
      volume: products.volume,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(publiclyVisible)
    .orderBy(desc(products.salesCount), asc(products.name))
    .limit(limit);
}

export async function selectStores() {
  return db.select({ id: stores.id, name: stores.name, city: stores.city, hours: stores.hours, phone: stores.phone }).from(stores).where(eq(stores.isActive, true)).orderBy(asc(stores.name));
}

export async function lotRows(limit = 120) {
  return db
    .select({
      id: productLots.id,
      lot: productLots.lot,
      productName: products.name,
      productSlug: products.slug,
      sku: products.sku,
      brandName: brands.name,
      storeName: stores.name,
      expiresAt: productLots.expiresAt,
      quantity: productLots.quantity,
      status: productLots.status,
      clearancePercent: productLots.clearancePercent,
    })
    .from(productLots)
    .innerJoin(products, eq(products.id, productLots.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .innerJoin(stores, eq(stores.id, productLots.storeId))
    .where(and(publiclyVisible, gt(productLots.quantity, 0)))
    .orderBy(asc(productLots.expiresAt))
    .limit(limit)
    .then((rows) => rows.map((row) => ({ ...row, expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null })));
}

export async function nearExpiryRows(limit = 24) {
  return db
    .select({
      id: productLots.id,
      lot: productLots.lot,
      productName: products.name,
      productSlug: products.slug,
      brandName: brands.name,
      priceMillimes: products.priceMillimes,
      storeName: stores.name,
      expiresAt: productLots.expiresAt,
      quantity: productLots.quantity,
      clearancePercent: productLots.clearancePercent,
    })
    .from(productLots)
    .innerJoin(products, eq(products.id, productLots.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .innerJoin(stores, eq(stores.id, productLots.storeId))
    .where(and(publiclyVisible, eq(productLots.status, "sale"), gt(productLots.quantity, 0), or(lte(productLots.expiresAt, sql`now() + interval '120 days'`), gt(productLots.clearancePercent, 0))))
    .orderBy(asc(productLots.expiresAt))
    .limit(limit)
    .then((rows) => rows.map((row) => ({ ...row, expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null })));
}

export async function restockRows(limit = 24) {
  const base = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brandName: brands.name,
      stock: products.stock,
      lowStockThreshold: products.lowStockThreshold,
      salesCount: products.salesCount,
      priceMillimes: products.priceMillimes,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, lte(products.stock, sql`${products.lowStockThreshold} + 2`)))
    .orderBy(asc(products.stock), desc(products.salesCount))
    .limit(limit);
  return base.map((row, index) => {
    const expected = new Date();
    expected.setDate(expected.getDate() + 3 + (index % 7) * 2);
    return { ...row, expectedAt: expected.toISOString() };
  });
}

export async function brandFollowRows() {
  const rows = await db
    .select({ id: brands.id, slug: brands.slug, name: brands.name, story: brands.story, count: sql<number>`count(${products.id})::int` })
    .from(brands)
    .leftJoin(products, and(eq(products.brandId, brands.id), publiclyVisible))
    .groupBy(brands.id, brands.slug, brands.name, brands.story)
    .orderBy(desc(sql`count(${products.id})`), asc(brands.name))
    .limit(48);
  return rows;
}

export async function reviewCommunityRows(limit = 16) {
  return db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      productName: products.name,
      productSlug: products.slug,
      authorName: reviews.authorName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      isVerified: reviews.isVerified,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(and(publiclyVisible, eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function pickingOrders(limit = 18) {
  const rows = await db.query.orders.findMany({
    where: inArray(orders.status, ["confirmed", "preparing"]),
    orderBy: desc(orders.createdAt),
    limit,
    with: { items: true },
  });
  return rows;
}

export async function deliveryIssueRows(limit = 12) {
  return db.query.orders.findMany({
    where: inArray(orders.status, ["shipped", "cancelled", "returned"]),
    orderBy: desc(orders.updatedAt),
    limit,
    with: { items: true },
  });
}

export async function returnOrderRows(limit = 12) {
  return db.query.orders.findMany({
    where: inArray(orders.status, ["delivered", "returned"]),
    orderBy: desc(orders.createdAt),
    limit,
    with: { items: true },
  });
}

export async function sampleableProducts(limit = 40) {
  return selectProducts(limit);
}

export async function verifiedReviewStats() {
  const [verified, total, wishes] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(and(eq(reviews.status, "approved"), eq(reviews.isVerified, true))),
    db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.status, "approved")),
    db.select({ n: sql<number>`count(*)::int` }).from(wishlistItems),
  ]);
  return { verified: verified[0]?.n ?? 0, total: total[0]?.n ?? 0, wishes: wishes[0]?.n ?? 0 };
}

export async function orderItemProductIds(userId?: number | null) {
  if (!userId) return [] as number[];
  const rows = await db
    .select({ id: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orders.userId, userId))
    .limit(120);
  return [...new Set(rows.map((row) => row.id).filter((id): id is number => typeof id === "number"))];
}
