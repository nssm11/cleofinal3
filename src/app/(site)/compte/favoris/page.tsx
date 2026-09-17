import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, products, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { formatDT } from "@/lib/money";
import { translateCard } from "@/lib/i18n/content";
import { getLocale } from "@/lib/i18n/server";
import { WishlistSharePanel } from "@/components/experience/wishlist-share";
import { RemoveWishButton, WishToList } from "@/components/experience/wishlist-buttons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavorisPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const copy = await getCopy();
  const locale = await getLocale();
  const t = copy.favorites;

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      shortDescription: products.shortDescription,
      priceMillimes: products.priceMillimes,
      compareAtMillimes: products.compareAtMillimes,
      stock: products.stock,
      image: products.image,
      volume: products.volume,
      brandName: brands.name,
      note: wishlistItems.note,
      addedAt: wishlistItems.createdAt,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(eq(wishlistItems.userId, user.id))
    .orderBy(desc(wishlistItems.createdAt));

  const items = rows.map((r) => ({ ...translateCard(r, locale), note: r.note }));

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">04 — Collection privée</p>
        <h1 className="mt-3 font-sans text-[24px] font-semibold tracking-[-0.02em]">{t.title}</h1>
        <p className="mt-2 max-w-[50ch] font-sans text-[13px] leading-[1.5] text-text-secondary">{t.intro}</p>
      </div>

      <div className="mt-8 border border-line bg-bg p-4">
        <WishlistSharePanel shares={[]} siteUrl="" />
      </div>

      {items.length === 0 ? (
        <div className="mt-8 border border-dashed border-line p-12 text-center">
          <p className="font-sans text-[18px] font-semibold">{t.empty}</p>
          <p className="mt-2 font-sans text-[13px] text-text-secondary">{t.intro}</p>
          <Link href="/boutique" className="btn-primary mt-6 inline-flex">{t.emptyCta}</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.id} className="group bg-bg flex flex-col">
              <Link href={`/produit/${p.slug}`} className="relative aspect-[4/5] bg-bg-2 border-b border-line">
                {p.image && <Image src={p.image} alt={p.name} fill className="object-cover" />}
                {p.stock <= 0 && <span className="absolute inset-0 grid place-items-center bg-black/50 font-mono text-[10px] uppercase tracking-[0.12em] text-paper">Rupture</span>}
              </Link>
              <div className="p-4 flex flex-1 flex-col">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted truncate">{p.brandName}</p>
                <Link href={`/produit/${p.slug}`} className="mt-1 font-sans text-[14px] font-medium leading-[1.3] hover:underline underline-offset-4">{p.name}</Link>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-[13px]">{formatDT(p.priceMillimes)}</span>
                  {p.compareAtMillimes && <span className="font-mono text-[11px] text-text-muted line-through">{formatDT(p.compareAtMillimes)}</span>}
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-line">
                  <WishToList line={{ productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock, volume: p.volume }} />
                  <RemoveWishButton productId={p.id} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
