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
import { HeartIcon } from "@/components/icons";
import { AccountCard } from "@/components/account/account-ui";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";
import { WishlistSharePanel, WishNote, GiftLink } from "@/components/experience/wishlist-share";
import { RemoveWishButton, WishToList } from "@/components/experience/wishlist-buttons";
import { translateCard } from "@/lib/i18n/content";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes favoris" };

/**
 * SAVED FOR YOU — the favorites, a curated collection rather than a list.
 *
 * The same bones as the house's product card — a borderless photograph, a
 * pure-type caption, the price and the gestures — but re-arranged as a
 * private gallery: two or three per row, the share window above, the gift
 * and the remove within reach of the picture.
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
      .select({
        id: wishlistShares.id,
        token: wishlistShares.token,
        label: wishlistShares.label,
        message: wishlistShares.message,
        createdAt: wishlistShares.createdAt,
      })
      .from(wishlistShares)
      .where(and(eq(wishlistShares.userId, user.id)))
      .orderBy(desc(wishlistShares.createdAt))
      .limit(3),
  ]);
  const items = rows.map((r) => ({ ...translateCard(r, locale), note: r.note, addedAt: r.addedAt }));
  const shareRows = shares.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));

  return (
    <section aria-labelledby="fav-title" className="max-w-[64rem]">
      <SectionBrow
        index="04"
        eyebrow="Votre collection"
        title={t.title}
        description={t.intro}
      />

      <Reveal y={12} amount={0.05} className="mt-9">
        <WishlistSharePanel shares={shareRows} siteUrl={SITE_URL} />
      </Reveal>

      {items.length === 0 ? (
        <Reveal y={10} className="mt-8">
          <div className="rounded-[3px] border border-dashed border-line-strong/70 bg-mist/50 px-6 py-16 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line-strong/60 text-iodine-deep">
              <HeartIcon size={20} />
            </span>
            <p className="mt-6 font-ant uppercase text-h3 text-carbon">{t.empty}</p>
            <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">{t.intro}</p>
            <Link href="/boutique" className="btn-outline mt-8">
              {t.emptyCta}
            </Link>
          </div>
        </Reveal>
      ) : (
        <ul className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((p, i) => (
            <Reveal as="li" key={p.id} y={16} delay={Math.min(i * 0.05, 0.35)} amount={0.05} className="h-full">
              <WishFiche
                p={p}
                outOfStock={copy.product.outOfStock}
                line={{
                  productId: p.id,
                  slug: p.slug,
                  name: p.name,
                  brandName: p.brandName,
                  image: p.image,
                  priceMillimes: p.priceMillimes,
                  stock: p.stock,
                  volume: p.volume,
                }}
              />
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One frame of the private gallery. */
function WishFiche({
  p,
  outOfStock,
  line,
}: {
  p: {
    id: number;
    slug: string;
    name: string;
    shortDescription: string | null;
    priceMillimes: number;
    compareAtMillimes: number | null;
    stock: number;
    image: string | null;
    brandName: string | null;
    note: string | null;
  };
  outOfStock: string;
  line: {
    productId: number;
    slug: string;
    name: string;
    brandName: string | null;
    image: string | null;
    priceMillimes: number;
    stock: number;
    volume: string | null;
  };
}) {
  const out = p.stock <= 0;
  return (
    <AccountCard className="group flex h-full flex-col p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-[2px]">
        <Link href={`/produit/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-canvas-2">
          {p.image && (
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(min-width: 768px) 22vw, 45vw"
              className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            />
          )}
          {out && (
            <span className="absolute inset-0 grid place-items-center bg-carbon/55 text-[8px] font-bold uppercase tracking-[0.2em] text-canvas">
              {outOfStock}
            </span>
          )}
        </Link>
        <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-0.5 rounded-full bg-porcelain/92 px-1.5 py-1 shadow-sheet backdrop-blur-sm">
          <GiftLink slug={p.slug} />
          <span aria-hidden className="h-4 w-px bg-line/50" />
          <RemoveWishButton productId={p.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-4 sm:px-2 sm:pb-2">
        <p className="truncate text-[8.5px] font-bold uppercase tracking-[0.22em] text-faint">{p.brandName}</p>
        <Link
          href={`/produit/${p.slug}`}
          className="mt-1 line-clamp-2 font-ant uppercase text-[14.5px] leading-snug text-carbon transition-colors hover:text-iodine-deep sm:text-[15.5px]"
        >
          {p.name}
        </Link>
        {p.note && <p className="mt-1 line-clamp-1 text-[11.5px] text-faint">« {p.note} »</p>}
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-[13.5px] font-medium tabular-nums text-carbon">{formatDTShort(p.priceMillimes)}</span>
          {p.compareAtMillimes && (
            <span className="text-[11px] tabular-nums text-faint line-through">{formatDTShort(p.compareAtMillimes)}</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-3">
          <WishToList line={line} />
          <WishNote productId={p.id} initial={p.note} />
        </div>
      </div>
    </AccountCard>
  );
}
