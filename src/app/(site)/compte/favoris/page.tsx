import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, products, wishlistItems, wishlistShares } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/env";
import { formatDTShort } from "@/lib/money";
import { GiftIcon, HeartIcon, TrashIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/primitives";
import { WishlistSharePanel, WishNote, GiftLink } from "@/components/experience/wishlist-share";
import { RemoveWishButton, WishToList } from "@/components/experience/wishlist-buttons";
import { translateCard } from "@/lib/i18n/content";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes favoris" };

/**
 * LA LISTE — the favorites, rebuilt as a letter you might send yourself:
 * each row carries the pharmacist's price line, a whisper of a note, the gift
 * gesture, and the share window that makes the whole list an opening for
 * someone else.
 */
export default async function FavorisPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the account layout already redirects
  const copy = await getCopy();
  const locale = await getLocale();
  const t = copy.favorites;

  const [rows, shares] = await Promise.all([
    db
      .select({
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
        brandName: brands.name,
        note: wishlistItems.note,
        addedAt: wishlistItems.createdAt,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(products.id, wishlistItems.productId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(eq(wishlistItems.userId, user.id))
      .orderBy(desc(wishlistItems.createdAt)),
    db
      .select({ id: wishlistShares.id, token: wishlistShares.token, label: wishlistShares.label, message: wishlistShares.message, createdAt: wishlistShares.createdAt })
      .from(wishlistShares)
      .where(and(eq(wishlistShares.userId, user.id)))
      .orderBy(desc(wishlistShares.createdAt))
      .limit(3),
  ]);
  const items = rows.map((r) => ({ ...translateCard(r, locale), note: r.note, addedAt: r.addedAt }));
  const shareRows = shares.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));

  return (
    <section aria-labelledby="fav-title" className="max-w-[56rem]">
      <p className="rule-label mb-4">{copy.header.favorites}</p>
      <h1 id="fav-title" className="font-display text-display-md leading-[1.05] tracking-[-0.02em] text-ink">
        {t.title}
      </h1>
      <p className="mt-4 max-w-[40rem] text-[14px] leading-[1.8] text-muted">{t.intro}</p>

      <div className="mt-8">
        <WishlistSharePanel shares={shareRows} siteUrl={SITE_URL} />
      </div>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<HeartIcon size={22} />} title={t.empty} description={t.intro} action={{ href: "/boutique", label: t.emptyCta }} />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-stone/70 border-y border-stone/70">
          {items.map((p) => (
            <li key={p.id} className="group grid grid-cols-[64px_1fr] items-start gap-5 py-5 lg:grid-cols-[72px_1fr_auto]">
              <Link href={`/produit/${p.slug}`} className="relative aspect-[4/5] overflow-hidden bg-marble">
                {p.image && (
                  <Image src={p.image} alt="" fill sizes="72px" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
                )}
                {p.stock <= 0 && <span className="absolute inset-0 grid place-items-center bg-ink/55 text-[8px] font-bold uppercase tracking-[0.2em] text-paper">{copy.product.outOfStock}</span>}
              </Link>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-2">{p.brandName}</p>
                <Link href={`/produit/${p.slug}`} className="mt-0.5 block font-display text-[18px] leading-snug text-ink transition-colors hover:text-champagne-2">
                  {p.name}
                </Link>
                {p.shortDescription && <p className="mt-1 line-clamp-1 text-[12.5px] text-muted">{p.shortDescription}</p>}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="text-[13.5px] tabular-nums text-ink">
                    {formatDTShort(p.priceMillimes)}
                    {p.compareAtMillimes && <span className="ms-2 text-[11px] text-muted-2 line-through">{formatDTShort(p.compareAtMillimes)}</span>}
                  </span>
                  <WishToList
                    line={{ productId: p.id, slug: p.slug, name: p.name, brandName: p.brandName, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock, volume: p.volume }}
                  />
                  <GiftLink slug={p.slug} />
                  <WishNote productId={p.id} initial={p.note} />
                </div>
              </div>
              <div className="hidden lg:block">
                <RemoveWishButton productId={p.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
