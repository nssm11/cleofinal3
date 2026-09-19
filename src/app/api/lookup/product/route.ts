import { NextResponse, type NextRequest } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { publiclyVisible } from "@/lib/catalog";
import { SITE_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
  if (raw.length < 3) return NextResponse.json({ item: null, reason: "Code trop court" });
  const [item] = await db
    .select({
      id: products.id,
      slug: products.slug,
      sku: products.sku,
      barcode: products.barcode,
      name: products.name,
      image: products.image,
      brandName: brands.name,
      stock: products.stock,
      status: products.status,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(publiclyVisible, or(eq(products.sku, raw), eq(products.barcode, raw), sql`lower(${products.sku}) = lower(${raw})`)))
    .limit(1);

  return NextResponse.json({
    item: item
      ? {
          ...item,
          url: `${SITE_URL}/produit/${item.slug}`,
          authentic: true,
          verification: "Catalogue Cléopâtre actif — SKU/code connu, vente autorisée si stock disponible.",
        }
      : null,
    reason: item ? null : "Aucun produit actif ne correspond à ce code.",
  });
}
