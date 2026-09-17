import type { Metadata } from "next";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { brands, products, users, wishlistItems, wishlistShares } from "@/db/schema";
import { getCopy, getLocale } from "@/lib/i18n/server";
import { Room } from "@/components/motion/room";
import { Brand } from "@/components/shell/brand";
import Link from "next/link";
import { formatDTShort } from "@/lib/money";
import { GiftIcon } from "@/components/icons";
import Image from "next/image";
import { notFound } from "next/navigation";
import { translateCard } from "@/lib/i18n/content";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const share = await db.query.wishlistShares.findFirst({ where: and(eq(wishlistShares.token, token), isNull(wishlistShares.revokedAt)) });
  return { title: share?.label ?? "Liste", robots: { index: false, follow: false } };
}

/**
 * A GIFT WINDOW — someone's list, held open by a secret link. The page is a
 * letter rather than a shop: the host's name, the sentence they left, and the
 * references they gathered, each one a button away from being offered.
 */
export default async function SharedListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await db.query.wishlistShares.findFirst({
    where: and(eq(wishlistShares.token, token), isNull(wishlistShares.revokedAt)),
  });
  if (!share) notFound();
  const owner = (await db.select({ firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, share.userId)).limit(1))[0] ?? { firstName: "Cléopâtre", lastName: "" };

  const copy = await getCopy();
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
      lowStockThreshold: products.lowStockThreshold,
      image: products.image,
      volume: products.volume,
      isNew: products.isNew,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      brandName: brands.name,
      brandSlug: brands.slug,
      note: wishlistItems.note,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(eq(wishlistItems.userId, share.userId)))
    .orderBy(wishlistItems.createdAt);
  const locale = await getLocale();
  const items = rows.map((r) => translateCard(r, locale));

  return (
    <div className="relative min-h-dvh bg-porcelain">
      <Room />
      <div className="relative container-narrow px-5 py-16 lg:py-24">
        <div className="border border-rule-strong/40 bg-bone/80 shadow-soft backdrop-blur-xl">
          <header className="border-b border-rule-strong/40 px-6 py-8 text-center lg:px-10">
            <Brand size="sm" className="justify-center" />
            <p className="mt-6 eyebrow text-cinabre-2">{t.publicTitle}</p>
            <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ink">{share.label}</h1>
            {share.message && (
              <p className="mx-auto mt-4 max-w-[34rem] text-[14px] italic leading-[1.85] text-graphite">« {share.message} »</p>
            )}
            <p className="mt-3 text-[12px] text-ash">
              {t.publicIntro.replace("{name}", `${owner.firstName} ${owner.lastName}`.trim())}
            </p>
          </header>

          {items.length === 0 ? (
            <p className="px-8 py-14 text-center text-[13px] text-graphite">{t.publicEmpty}</p>
          ) : (
            <ul className="divide-y divide-rule/70">
              {items.map((p) => (
                <li key={p.slug} className="grid grid-cols-[72px_1fr] items-center gap-5 px-6 py-5 lg:px-10">
                  <Link href={`/produit/${p.slug}`} className="relative aspect-[4/5] overflow-hidden bg-bone-2">
                    {p.image && <Image src={p.image} alt="" fill sizes="72px" className="object-cover" />}
                    {p.stock <= 0 && <span className="absolute inset-0 grid place-items-center bg-ink/55 text-[8px] font-bold uppercase tracking-[0.2em] text-porcelain">{copy.product.outOfStock}</span>}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-ash">{p.brandName}</p>
                    <Link href={`/produit/${p.slug}`} className="mt-0.5 block font-display text-[18px] leading-snug text-ink hover:text-cinabre-2">
                      {p.name}
                    </Link>
                    {p.note && <p className="mt-1 text-[12px] italic text-ash">« {p.note} »</p>}
                    <p className="mt-2 flex items-center gap-4 text-[13px] tabular-nums text-slate">
                      {formatDTShort(p.priceMillimes)}
                      {p.compareAtMillimes && <span className="text-[11px] text-ash line-through">{formatDTShort(p.compareAtMillimes)}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-rule-strong/40 px-6 py-6 lg:px-10">
            <p className="max-w-[34rem] text-[11.5px] leading-relaxed text-ash">{copy.product.giftNote}</p>
            <Link href="/boutique" className="btn-primary !min-h-11 px-5">
              <GiftIcon size={14} /> {copy.common.discover}
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
