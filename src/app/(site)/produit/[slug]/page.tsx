import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { restockAlerts, subscriptionItems, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { SITE_URL } from "@/lib/env";
import { discountPercent, formatDT, formatDTShort } from "@/lib/money";
import { formatDate, jsonLd } from "@/lib/utils";
import { Badge, Breadcrumbs, SectionHeading } from "@/components/ui/primitives";
import { Stars } from "@/components/ui/stars";
import { Reveal } from "@/components/motion/reveal";
import { ProductGrid } from "@/components/catalog/product-card";
import { RecentlyViewed, TrackView } from "@/components/catalog/recently-viewed";
import { ProductGallery } from "@/components/product/gallery";
import { BuyBox } from "@/components/product/buy-box";
import { ReviewForm } from "@/components/product/review-form";
import { ArrowRightIcon, DropIcon, LeafIcon, SunIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const title = `${p.name}${p.brand ? ` — ${p.brand.name}` : ""}`;
  return {
    title,
    description: p.shortDescription ?? undefined,
    alternates: { canonical: `/produit/${p.slug}` },
    openGraph: { title, description: p.shortDescription ?? undefined, images: p.image ? [p.image] : [], type: "website" },
    twitter: { card: "summary_large_image", title, images: p.image ? [p.image] : [] },
  };
}

/**
 * THE PRODUCT — the strongest page of the house.
 *
 * It is not an "image | information" pair. It is a small exhibition in five
 * movements:
 *
 *   01  the theatre   a large plate, sticky on desktop, that can be magnified
 *                     by hand or opened full-screen
 *   02  the counter   the purchase panel, sticky beside it, that never leaves
 *   03  the ritual    how the product is used, set as an editorial statement
 *   04  the formula   what is inside, said plainly
 *   05  the voices    the reviews, led by a score set in the display face
 *
 * The packaging is never overlaid, cropped, stretched or recoloured.
 */
export default async function ProduitPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ offrir?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const giftMode = sp.offrir === "1";
  const [p, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!p) notFound();

  const [related, wishedRow, restockRow, subRow, copy] = await Promise.all([
    getRelated(p.id, p.categoryId, p.universeId, 8),
    user
      ? db
          .select()
          .from(wishlistItems)
          .where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, p.id)))
          .limit(1)
      : Promise.resolve([] as { id: number }[]),
    user
      ? db
          .select({ id: sql<number>`id::int` })
          .from(restockAlerts)
          .where(and(eq(restockAlerts.userId, user.id), eq(restockAlerts.productId, p.id)))
          .limit(1)
      : Promise.resolve([] as { id: number }[]),
    user
      ? db
          .select({ id: sql<number>`subscriptions.id::int` })
          .from(subscriptions)
          .innerJoin(subscriptionItems, eq(subscriptionItems.subscriptionId, subscriptions.id))
          .where(and(eq(subscriptions.userId, user.id), eq(subscriptionItems.productId, p.id), eq(subscriptions.status, "active")))
          .limit(1)
      : Promise.resolve([] as { id: number }[]),
    getCopy(),
  ]);
  const t = copy.product;

  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const images = p.images.length ? p.images : p.image ? [p.image] : [];
  const alts = p.images.length ? p.imageAlts : [];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: images.map((i) => `${SITE_URL}${i}`),
    description: p.shortDescription,
    sku: p.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/produit/${p.slug}`,
      priceCurrency: "TND",
      price: (p.priceMillimes / 1000).toFixed(3),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating:
      p.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: (p.ratingAvg / 100).toFixed(1), reviewCount: p.ratingCount }
        : undefined,
    review: p.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      reviewBody: r.body,
    })),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      ...(p.universe
        ? [{ "@type": "ListItem", position: 2, name: p.universe.name, item: `${SITE_URL}/univers/${p.universe.slug}` }]
        : []),
      { "@type": "ListItem", position: 3, name: p.name, item: `${SITE_URL}/produit/${p.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }} />
      <TrackView id={p.id} />

      {/* ══ 01 + 02 · THE THEATRE AND THE COUNTER ═══════════════════════ */}
      <section className="relative overflow-hidden bg-paper pt-24 lg:pt-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-40" />
          <div className="grain absolute inset-0" />
        </div>

        <div className="relative container-wide">
          <Breadcrumbs
            items={[
              ...(p.universe ? [{ href: `/univers/${p.universe.slug}`, label: p.universe.name }] : []),
              ...(p.category ? [{ href: `/categorie/${p.category.slug}`, label: p.category.name }] : []),
              { label: p.name },
            ]}
          />

          <div className="mt-10 grid gap-14 pb-16 lg:grid-cols-12 lg:gap-16 lg:pb-24">
            {/* The theatre */}
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-32">
                <ProductGallery
                  images={images}
                  alts={alts}
                  name={p.name}
                  sku={p.sku}
                  volume={p.volume}
                  brandName={p.brand?.name ?? null}
                  out={out}
                  badge={
                    <>
                      {pct > 0 && <Badge tone="ink">−{pct} %</Badge>}
                      {p.isNew && pct === 0 && <Badge tone="accent">Nouveauté</Badge>}
                    </>
                  }
                />
              </div>
            </div>

            {/* The counter */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-32">
                {p.brand && (
                  <Link href={`/marque/${p.brand.slug}`} className="group inline-flex items-baseline gap-3">
                    <span className="font-display text-[17px] italic text-champagne-2">{p.brand.name}</span>
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">
                      {p.brand.country}
                    </span>
                  </Link>
                )}

                <h1 className="mt-4 font-display text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.04] tracking-[-0.024em] text-ink">
                  {p.name}
                </h1>

                {p.ratingCount > 0 && (
                  <a href="#avis" className="mt-5 inline-flex items-center gap-2.5">
                    <Stars value={p.ratingAvg / 100} count={p.ratingCount} size={13} />
                    <span className="text-[12.5px] text-muted">{t.readReviews}</span>
                  </a>
                )}

                <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-y border-stone/70 py-5">
                  <span className="font-display text-[clamp(1.7rem,2.8vw,2.3rem)] tabular-nums leading-none text-ink">
                    {formatDT(p.priceMillimes)}
                  </span>
                  {pct > 0 && p.compareAtMillimes && (
                    <>
                      <span className="text-[14px] tabular-nums text-muted-2 line-through">
                        {formatDT(p.compareAtMillimes)}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-success">
                        {t.save.replace("{x}", formatDTShort(p.compareAtMillimes! - p.priceMillimes))}
                      </span>
                    </>
                  )}
                </div>

                {p.shortDescription && (
                  <p className="mt-7 text-[15px] leading-[1.9] text-charcoal">{p.shortDescription}</p>
                )}

                {p.concerns.length > 0 && (
                  <div className="mt-7">
                    <p className="eyebrow mb-3.5 text-muted-2">{t.answersTo}</p>
                    <ul className="flex flex-wrap gap-2.5">
                      {p.concerns.map((c) => (
                        <li key={c.concernId}>
                          <Link
                            href={`/besoin/${c.concern.slug}`}
                            className="group relative inline-flex min-h-10 items-center overflow-hidden border border-stone-2/55 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal transition-colors duration-500 hover:border-champagne hover:text-ink"
                          >
                            <span
                              aria-hidden
                              className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-champagne-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
                            />
                            {c.concern.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-9">
                  <BuyBox
                    p={{
                      id: p.id,
                      slug: p.slug,
                      name: p.name,
                      brandName: p.brand?.name ?? null,
                      image: p.image,
                      priceMillimes: p.priceMillimes,
                      compareAtMillimes: p.compareAtMillimes,
                      stock: p.stock,
                      lowStockThreshold: p.lowStockThreshold,
                      volume: p.volume,
                    }}
                    wished={wishedRow.length > 0}
                    isAuthed={!!user}
                    giftMode={giftMode}
                    restockSubscribed={restockRow.length > 0}
                    subscribed={subRow.length > 0}
                  />
                </div>

                {/* The details, revealed progressively */}
                {(p.description || p.ingredients || p.howToUse) && (
                  <div className="mt-12 border-t border-stone/70">
                    {[
                      [t.descriptionTitle, p.description],
                      [t.formulaTitle, p.ingredients],
                      [t.howToTitle, p.howToUse],
                    ].map(([title, body], i) =>
                      body ? (
                        <details key={title} open={i === 0} className="group border-b border-stone/70">
                          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.22em] text-ink">
                            {title}
                            <span
                              aria-hidden
                              className="font-display text-[22px] font-light leading-none text-muted-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45"
                            >
                              +
                            </span>
                          </summary>
                          <p className="pb-6 pr-6 text-[14px] leading-[1.9] text-charcoal">{body}</p>
                        </details>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 03 · THE RITUAL ═════════════════════════════════════════════ */}
      {p.howToUse && (
        <section className="relative overflow-hidden bg-noir text-paper">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="marble-veil opacity-20" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "repeating-linear-gradient(to right, rgba(203,176,120,0.05) 0 1px, transparent 1px 25%)",
              }}
            />
            <div className="grain absolute inset-0" />
          </div>
          <div className="relative container-wide grid gap-12 py-section-sm lg:grid-cols-12 lg:gap-16 lg:py-section">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="rule-label mb-8 text-champagne-3/80">Le rituel</p>
                <p className="font-display text-[clamp(1.7rem,3vw,2.5rem)] italic leading-[1.08] text-paper">
                  Comment
                  <br />
                  l&apos;utiliser.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal y={16} delay={0.08}>
                <p className="text-[clamp(1.05rem,1.8vw,1.5rem)] leading-[1.65] text-paper/85">{p.howToUse}</p>
                <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-paper/12 pt-6">
                  {[
                    { i: DropIcon, t: "Texture testée sur peaux réactives" },
                    { i: LeafIcon, t: "Formule sans parabènes" },
                    { i: SunIcon, t: "Convient à une exposition quotidienne" },
                  ].map((x) => (
                    <span key={x.t} className="flex items-center gap-2.5 text-[12.5px] text-paper/55">
                      <x.i size={15} className="text-champagne-3" /> {x.t}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ══ 04 · THE FORMULA ════════════════════════════════════════════ */}
      {p.ingredients && (
        <section className="relative overflow-hidden border-y border-stone/70 bg-cream">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="marble-veil opacity-35" />
          </div>
          <div className="relative container-wide grid gap-12 py-section-sm lg:grid-cols-12 lg:gap-16 lg:py-section">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="rule-label mb-7">La formule</p>
                <p className="font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.1] text-ink">
                  Ce qu&apos;il y a
                  <br />
                  <span className="italic text-champagne-2">vraiment dedans.</span>
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal y={14} delay={0.06}>
                <p className="font-display text-[clamp(1.05rem,1.6vw,1.3rem)] leading-[1.85] text-charcoal">
                  {p.ingredients}
                </p>
                <p className="mt-8 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                  Nous publions la liste telle qu&apos;elle figure sur l&apos;emballage. En cas d&apos;allergie connue,
                  lisez-la en boutique avec notre pharmacien avant la première application.
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ══ 05 · THE VOICES ═════════════════════════════════════════════ */}
      <section id="avis" className="relative container-wide py-section-sm lg:py-section">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <p className="rule-label mb-7">Les avis</p>
                <p className="font-display text-[clamp(3.4rem,7vw,5.4rem)] leading-none tracking-[-0.04em] text-ink">
                  {p.ratingCount > 0 ? (p.ratingAvg / 100).toFixed(1) : "—"}
                  <span className="font-display text-[0.28em] align-super text-muted-2">/5</span>
                </p>
                {p.ratingCount > 0 && <Stars value={p.ratingAvg / 100} count={p.ratingCount} size={16} className="mt-4" />}
                <p className="mt-6 max-w-xs text-[13.5px] leading-relaxed text-muted">
                  Avis authentiques, modérés par notre équipe. Nous ne supprimons jamais un retour négatif fondé — même
                  lorsqu&apos;il nous dérange.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            {p.reviews.length === 0 ? (
              <div className="border border-dashed border-stone-2/60 bg-cream/60 px-6 py-12">
                <p className="font-display text-[20px] italic text-ink">Aucun avis pour l&apos;instant.</p>
                <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
                  Soyez la première à raconter votre expérience : c&apos;est ce qui aide le plus les autres clientes à
                  choisir.
                </p>
              </div>
            ) : (
              <ul>
                {p.reviews.map((r, i) => (
                  <Reveal key={r.id} as="li" y={12} delay={i * 0.04} className="border-b border-stone/70 py-7 first:pt-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <span className="flex h-10 w-10 items-center justify-center border border-stone-2/50 bg-cream font-display text-[15px] italic text-champagne-2">
                          {r.authorName.charAt(0)}
                        </span>
                        <span>
                          <span className="block text-[13.5px] text-ink">{r.authorName}</span>
                          <span className="block text-[11.5px] text-muted-2">{formatDate(r.createdAt)}</span>
                        </span>
                      </div>
                      <Stars value={r.rating} showCount={false} size={12} />
                    </div>
                    {r.title && <p className="mt-5 font-display text-[17px] text-ink">{r.title}</p>}
                    <p className="mt-2 text-[14px] leading-[1.9] text-charcoal">{r.body}</p>
                    {r.reply && (
                      <div className="mt-5 border-l border-champagne/60 bg-cream/70 px-5 py-4">
                        <p className="eyebrow mb-2 text-champagne-2">Réponse de Cléopâtre</p>
                        <p className="text-[13.5px] leading-relaxed text-charcoal">{r.reply}</p>
                      </div>
                    )}
                  </Reveal>
                ))}
              </ul>
            )}
            <div className="mt-10">
              <ReviewForm productId={p.id} defaultName={user ? `${user.firstName} ${user.lastName[0]}.` : ""} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMPLÉTER LE RITUEL ═════════════════════════════════════════ */}
      {related.length > 0 && (
        <section className="relative overflow-hidden border-t border-stone/70 bg-paper-2/40">
          <div className="relative container-wide py-section-sm lg:py-section">
            <Reveal>
              <SectionHeading
                index="Compléter"
                eyebrow="Votre rituel"
                title="Ce qui va bien avec"
                action={{ href: p.category ? `/categorie/${p.category.slug}` : "/boutique", label: "Tout le rayon" }}
              />
            </Reveal>
            <div className="mt-14">
              <ProductGrid items={related.slice(0, 4)} isAuthed={!!user} priorityCount={0} />
            </div>
            {related.length > 4 && (
              <ul className="mt-14 grid gap-x-8 gap-y-6 border-t border-stone/70 pt-10 sm:grid-cols-2">
                {related.slice(4).map((r) => (
                  <li key={r.id}>
                    <Link href={`/produit/${r.slug}`} className="group flex items-baseline justify-between gap-5">
                      <span className="min-w-0">
                        <span className="block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">
                          {r.brandName}
                        </span>
                        <span className="mt-1 block truncate font-display text-[17px] text-charcoal transition-colors group-hover:text-champagne-2">
                          {r.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] tabular-nums text-muted">
                        {formatDTShort(r.priceMillimes)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={p.id} isAuthed={!!user} />

      {/* The mobile counter sits above the thumb bar; this clears it. */}
      <div className="h-32 lg:hidden" />

      {/* A discreet return to the shelf */}
      <div className="container-wide hidden pb-16 lg:block">
        <Link href={p.universe ? `/univers/${p.universe.slug}` : "/boutique"} className="btn-ghost no-underline">
          <ArrowRightIcon size={13} className="rotate-180" /> Revenir à {p.universe?.name ?? "la boutique"}
        </Link>
      </div>
    </>
  );
}
