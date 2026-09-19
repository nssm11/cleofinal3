import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { publiclyVisible } from "@/lib/catalog";
import { eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/env";

export async function productFeed() {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      sku: products.sku,
      name: products.name,
      shortDescription: products.shortDescription,
      priceMillimes: products.priceMillimes,
      compareAtMillimes: products.compareAtMillimes,
      stock: products.stock,
      image: products.image,
      brandName: brands.name,
      barcode: products.barcode,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(publiclyVisible)
    .limit(500);

  return rows.map((p) => ({
    id: p.sku,
    title: p.name,
    description: p.shortDescription ?? p.name,
    link: `${SITE_URL}/produit/${p.slug}`,
    image_link: p.image ? `${SITE_URL}${p.image}` : undefined,
    brand: p.brandName ?? "Cléopâtre",
    gtin: p.barcode ?? undefined,
    availability: p.stock > 0 ? "in stock" : "out of stock",
    price: `${(p.priceMillimes / 1000).toFixed(3)} TND`,
    sale_price: p.compareAtMillimes && p.compareAtMillimes > p.priceMillimes ? `${(p.priceMillimes / 1000).toFixed(3)} TND` : undefined,
    updated_at: p.updatedAt,
  }));
}
