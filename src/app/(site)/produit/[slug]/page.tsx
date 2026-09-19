import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { ArrowUpRightIcon, CheckIcon, MapPinIcon, MessageIcon, PackageIcon, RefreshIcon, SparklesIcon, TruckIcon } from "@/components/icons";
import { db } from "@/db";
import { orderItems, orders, restockAlerts, subscriptionItems, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getProductBySlug, getRelated, TOLERANCE_KEYS } from "@/lib/catalog";
import { getDuosForProduct, getFrequentlyBought, getSubstitutes } from "@/lib/merch";
import { shippingPromise, tunisClock } from "@/lib/fulfilment";
import { unitPrice } from "@/lib/units";
import { canonise } from "@/lib/actives";
import { shelfFor } from "@/lib/lot-stock";
import { expiryState, expiryWords, lotMonthLabel } from "@/lib/lots";
import { SITE_URL } from "@/lib/env";
import { discountPercent, formatDT, formatDTShort } from "@/lib/money";
import { formatDate, jsonLd } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Stars } from "@/components/ui/stars";
import { Reveal } from "@/components/motion/reveal";
import { EmblaRow } from "@/components/catalog/embla-row";
import { ProductCard } from "@/components/catalog/product-card";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";
import { CompareToggle } from "@/components/catalog/compare";
import { RecentlyViewed, TrackView } from "@/components/catalog/recently-viewed";
import { ProductGallery } from "@/components/product/gallery";
import { BuyBox } from "@/components/product/buy-box";
import { DuoOffer } from "@/components/product/duo-offer";
import { ReviewForm } from "@/components/product/review-form";

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
 * THE PRODUCT — the catalogue page.
 *
 * One large plate on the left, the purchase on the right, set in the house
 * type with editorial air around it. No boxes, no badges fighting for the
 * eye: hairlines, one champagne note, and the packaging at its true size.
 */
export default async function ProduitPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ offrir?: string; alert?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const giftMode = sp.offrir === "1";
  const [p, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!p) notFound();

  const [related, wishedRow, restockRow, subRow, copy, substitutes, duosForProduct, oftenWith, verifiedPurchase, shelf] = await Promise.all([
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
    getSubstitutes(p.id),
    getDuosForProduct(p.id),
    getFrequentlyBought(p.id),
    user
      ? db
          .select({ one: sql<number>`1::int` })
          .from(orders)
          .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
          .where(and(eq(orders.userId, user.id), eq(orders.status, "delivered"), eq(orderItems.productId, p.id)))
          .limit(1)
      : Promise.resolve([] as { one: number }[]),
    shelfFor(p.id),
  ]);
  const t = copy.product;
  const mm = copy.merch;

  const tolerances = TOLERANCE_KEYS.filter((k) => p.tolerances?.[k] === true);
  const unit = unitPrice(p.priceMillimes, p.volume, {
    forceSmall: p.category?.slug === "serums" || /s[ée]rum/i.test(p.name),
  });

  const pct = discountPercent(p.priceMillimes, p.compareAtMillimes);
  const out = p.stock <= 0;
  const promise = shippingPromise({ stock: p.stock, ...tunisClock() });
  const shipLabel =
    promise === "today" ? mm.pdpShipToday : promise === "tomorrow" ? mm.pdpShipTomorrow : promise === "monday" ? mm.pdpShipMonday : mm.pdpShipRestock;
  /* Le comptoir, par le lot : ce n'est plus « 11 en stock » mais « 11 unités,
     dont 8 en rayon, le lot le plus proche expirant en 04/2027 ». */
  const STORE_LABELS: Record<string, string> = { ezzahra: mm.pdpLocEzzahra, "hammam-lif": mm.pdpLocHammam, entrepot: mm.pdpLocEntrepot };
  const locParts = shelf.summary.perStore
    .filter((s) => s.sellable > 0 || s.undated > 0)
    .map((s) => ({
      label: STORE_LABELS[s.slug] ?? s.name,
      n: s.sellable,
      undated: s.undated,
      shelf: s.shelf,
      back: s.back,
      earliest: s.earliest,
      isWarehouse: s.slug === "entrepot",
    }));
  /** La date que le comptoir peut promettre, aujourd'hui, sur cette référence. */
  const lotCeiling = shelf.summary.earliest;
  const promiseState = lotCeiling ? expiryState(lotCeiling) : null;
  /** Ce que la maison ne peut pas dire : les unités sans date, comptées. */
  const undatedUnits = shelf.summary.undated;
  const shelfNote = lotCeiling ? `${lotMonthLabel(lotCeiling)} — ${expiryWords(promiseState!)}` : null;
  const adviceHref = `/aide?type=pharmacist_advice&subject=${encodeURIComponent(`Conseil — ${p.name}`)}&message=${encodeURIComponent(`Référence : ${p.name}\n${SITE_URL}/produit/${p.slug}\n\nMa question :`)}`;
  const waHref = `https://wa.me/21671450210?text=${encodeURIComponent(`Bonjour, j'aurais une question sur ${p.name} : ${SITE_URL}/produit/${p.slug}`)}`;
  /* Ce qu'un pharmacien vérifie avant de tendre la boîte — imprimé tel quel,
     avec l'aveu quand la fiche n'a pas encore été relue par un humain. */
  const identityLines = [
    p.barcode ? `Code-barres (EAN-13) : ${p.barcode}` : null,
    p.paoMonths ? `Après ouverture, à utiliser dans : ${p.paoMonths} mois` : null,
    p.madeIn ? `Fabriqué en ${p.madeIn}` : null,
    p.distributor ? `Distribué en Tunisie par ${p.distributor}` : null,
    p.allergens.length
      ? `Allergènes parfumants déclarés : ${p.allergens.join(", ")}`
      : p.ingredients
        ? "Aucun allergène parfumant déclaré dans cette formule"
        : null,
    p.tolerances?.grossesse === true ? "Grossesse : vérifié au comptoir, autorisé" : null,
  ].filter((x): x is string => !!x);
  const detailBlocks: { title: string; body: string | null }[] = [
    { title: t.descriptionTitle, body: p.description },
    { title: t.formulaTitle, body: p.ingredients },
    { title: t.howToTitle, body: p.howToUse },
    { title: "Identité & précautions", body: identityLines.length ? identityLines.join("\n") : null },
  ];
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
      ...(p.universe ? [{ "@type": "ListItem", position: 2, name: p.universe.name, item: `${SITE_URL}/univers/${p.universe.slug}` }] : []),
      { "@type": "ListItem", position: 3, name: p.name, item: `${SITE_URL}/produit/${p.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbs) }} />
      <TrackView id={p.id} />

      {/* ══ THE PLATE AND THE PURCHASE ═══════════════════════════════════ */}
      <section className="bg-canvas pt-24 lg:pt-32">
        <div className="shell-wide">
          <Breadcrumbs
            items={[
              ...(p.universe ? [{ href: `/univers/${p.universe.slug}`, label: p.universe.name }] : []),
              ...(p.category ? [{ href: `/categorie/${p.category.slug}`, label: p.category.name }] : []),
              { label: p.name },
            ]}
          />

          <div className="grid gap-12 pb-16 pt-10 lg:grid-cols-12 lg:gap-20 lg:pb-28">
            {/* The plate */}
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-28">
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
                      {pct > 0 && <span className="bg-carbon px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-canvas">−{pct} %</span>}
                      {p.isNew && pct === 0 && <span className="bg-iodine-wash px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-iodine-deep">Nouveauté</span>}
                    </>
                  }
                />
              </div>
            </div>

            {/* The purchase */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {p.brand && (
                    <Link href={`/marque/${p.brand.slug}`} className="font-ant uppercase text-[19px] text-iodine-deep">
                      {p.brand.name}
                    </Link>
                  )}
                  {p.brand && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-faint">{p.brand.country}</span>
                  )}
                  {p.isCounterPick && (
                    <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-iodine-deep" title={mm.counterPickNote}>
                      <span aria-hidden className="h-px w-5 bg-iodine" />
                      {mm.counterPick}
                    </span>
                  )}
                </div>

                <h1 className="mt-5 font-ant uppercase text-[clamp(2rem,3.6vw,3.1rem)] font-light leading-[1.06] tracking-[-0.02em] text-carbon">
                  {p.name}
                </h1>

                {p.ratingCount > 0 && (
                  <a href="#avis" className="mt-5 inline-flex items-center gap-3">
                    <Stars value={p.ratingAvg / 100} count={p.ratingCount} size={13} />
                    <span className="text-[12.5px] text-muted">{t.readReviews}</span>
                  </a>
                )}

                <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-line/60 pb-6">
                  <span className="font-ant uppercase text-[clamp(1.8rem,2.9vw,2.5rem)] font-light tabular-nums text-carbon">
                    {formatDT(p.priceMillimes)}
                  </span>
                  {pct > 0 && p.compareAtMillimes && (
                    <>
                      <span className="text-[14px] tabular-nums text-faint line-through">{formatDT(p.compareAtMillimes)}</span>
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ok">
                        {t.save.replace("{x}", formatDTShort(p.compareAtMillimes! - p.priceMillimes))}
                      </span>
                    </>
                  )}
                  {unit && <span className="w-full text-[11.5px] tabular-nums text-faint">{unit.text}</span>}
                </div>

                {p.shortDescription && (
                  <p className="mt-7 text-[15px] leading-[1.95] text-carbon">{p.shortDescription}</p>
                )}

                {p.concerns.length > 0 && (
                  <div className="mt-8">
                    <p className="kicker-xs mb-4 text-faint">{t.answersTo}</p>
                    <ul className="flex flex-wrap gap-2.5">
                      {p.concerns.map((c) => (
                        <li key={c.concernId}>
                          <Link
                            href={`/besoin/${c.concern.slug}`}
                            className="inline-flex min-h-10 items-center border border-line-strong/60 px-4 text-[10.5px] font-bold uppercase tracking-[0.18em] text-carbon transition-colors duration-400 hover:border-iodine hover:text-carbon"
                          >
                            {c.concern.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tolerances.length > 0 && (
                  <div className="mt-7">
                    <p className="kicker-xs mb-3.5 text-faint">{mm.tolEyebrow}</p>
                    <ul className="flex flex-wrap gap-2">
                      {tolerances.map((k) => (
                        <li key={k}>
                          <span className="inline-flex min-h-8 items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ok">
                            <CheckIcon size={11} strokeWidth={2.4} />
                            {mm.tol[k]}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2.5 text-[11px] text-faint">{mm.tolNote}</p>
                  </div>
                )}

                {(p.audience || p.precautions) && (
                  <div className="mt-8 grid gap-8 border-b border-line/60 pb-8 sm:grid-cols-2 sm:gap-10">
                    {p.audience && (
                      <div>
                        <p className="kicker-xs text-iodine-deep">{mm.pdpFor}</p>
                        <p className="mt-3 text-[13.5px] leading-[1.8] text-carbon">{p.audience}</p>
                      </div>
                    )}
                    {p.precautions && (
                      <div>
                        <p className="kicker-xs text-iodine-deep">{mm.pdpAvoid}</p>
                        <p className="mt-3 text-[13.5px] leading-[1.8] text-carbon">{p.precautions}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8">
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
                    openAlert={sp.alert === "1"}
                    subscribed={subRow.length > 0}
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <CompareToggle item={{ id: p.id, name: p.name }} />
                </div>

                {/* The small truths */}
                <div className="mt-8 space-y-3 border-b border-line/60 pb-8">
                  <p className="flex items-start gap-3 text-[12.5px] leading-relaxed text-carbon">
                    <TruckIcon size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-iodine-deep" />
                    {shipLabel}
                  </p>
                  <p className="flex items-start gap-3 text-[12.5px] leading-relaxed text-carbon">
                    <RefreshIcon size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-iodine-deep" />
                    <span>
                      {mm.pdpReturns}{" "}
                      <Link href="/livraison" className="link-underline text-carbon">
                        {mm.pdpReturnsLink}
                      </Link>
                    </span>
                  </p>
                  {locParts.length > 0 && (
                    <div className="pt-2">
                      <p className="kicker-xs mb-2.5 text-faint">{mm.pdpLocTitle}</p>
                      <ul className="space-y-2">
                        {locParts.map((x) => (
                          <li key={x.label} className="text-[12.5px]">
                            <span className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-2 text-carbon">
                                {x.isWarehouse ? <PackageIcon size={12} strokeWidth={1.5} className="text-faint" /> : <MapPinIcon size={12} strokeWidth={1.5} className="text-iodine-deep" />}
                                {x.label}
                              </span>
                              <span className="tabular-nums text-faint">{x.n}</span>
                            </span>
                            {(x.shelf !== x.n || x.earliest) && (
                              <span className="mt-0.5 block pl-5 text-[11px] text-faint">
                                {x.shelf > 0 && `${x.shelf} en rayon`}
                                {x.shelf > 0 && x.back > 0 && " · "}
                                {x.back > 0 && `${x.back} en réserve`}
                                {x.earliest && ` · lot ${lotMonthLabel(x.earliest)}`}
                                {x.undated > 0 && ` · ${x.undated} sans date`}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {shelfNote && (
                        <p className="mt-2.5 flex items-start gap-2 text-[11.5px] leading-relaxed text-faint">
                          <CheckIcon size={11} strokeWidth={1.8} className="mt-0.5 shrink-0 text-iodine-deep" />
                          Ce que nous pouvons garantir : la date du lot le plus proche, {shelfNote}. Toute commande part avec le lot qui expire en premier.
                        </p>
                      )}
                      {undatedUnits > 0 && (
                        <p className="mt-2 text-[11.5px] leading-relaxed text-amber-700">
                          {undatedUnits} unité(s) de cette référence sont arrivées sans date de péremption : elles ne sont pas vendues tant qu&apos;un pharmacien ne les a pas datées.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Le conseil */}
                <div className="mt-8 border border-iodine/30 p-6">
                  <p className="flex items-center gap-2.5 font-ant uppercase text-[16px] text-carbon">
                    <SparklesIcon size={14} strokeWidth={1.3} className="text-iodine-deep" /> {mm.pdpAdviceTitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={adviceHref} className="btn-outline min-h-11">
                      {mm.pdpAdviceCta}
                    </Link>
                    <a href={waHref} target="_blank" rel="noopener" className="btn-ghost inline-flex min-h-11 items-center gap-2 no-underline">
                      <MessageIcon size={14} strokeWidth={1.5} /> {mm.pdpAdviceWa}
                    </a>
                  </div>
                  <p className="mt-3.5 text-[11.5px] text-faint">{mm.pdpAdviceNote}</p>
                </div>

                {/* Souvent associé */}
                {oftenWith.length > 0 && (
                  <div className="mt-9 border-t border-line/60 pt-7">
                    <p className="kicker-xs mb-5 text-faint">{mm.pdpOftenWith}</p>
                    <ul className="space-y-6">
                      {oftenWith.map((x) => (
                        <li key={x.product.id}>
                          <ProductCard p={x.product} />
                          {x.reason && <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">— {x.reason}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {out && substitutes && (
                  <div className="mt-9 border-t border-iodine/30 pt-7">
                    <p className="kicker-xs mb-5 text-iodine-deep">{mm.replaceBy}</p>
                    <ul className="space-y-6">
                      {substitutes.map((s) => (
                        <li key={s.product.id}>
                          <ProductCard p={s.product} />
                          {s.reason && <p className="mt-2 text-[12.5px] leading-relaxed text-muted">— {s.reason}</p>}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-[11.5px] text-faint">{mm.replaceNote}</p>
                  </div>
                )}

                {duosForProduct && (
                  <DuoOffer
                    duo={duosForProduct[0]}
                    labels={{ eyebrow: mm.duoEyebrow, together: mm.duoTogether, save: mm.duoSave, add: mm.duoAdd, added: mm.duoAdded }}
                  />
                )}

                {/* The details */}
                {(p.description || p.ingredients || p.howToUse) && (
                  <div className="mt-9 border-t border-line/60">
                    {detailBlocks                    .map(({ title, body }, i) =>
                      body ? (
                        <details key={title} open={i === 0} className="group border-b border-line/60">
                          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-carbon">
                            {title}
                            <span aria-hidden className="font-ant uppercase text-[22px] font-light leading-none text-faint transition-transform duration-500 group-open:rotate-45">
                              +
                            </span>
                          </summary>
                          <div className="pb-7 pr-6 text-[14px] leading-[1.9] text-carbon">
                            {body.split("\n").map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
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

      {/* ══ THE RITUAL — the dark statement ══════════════════════════════ */}
      {(p.howToUse || p.useWhen || p.useAmount || p.useOrder) && (
        <section className="bg-petrol text-chalk">
          <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-40" />
          <div className="shell-wide grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="kicker mb-8 text-chalk-faint!">{mm.pdpHowEyebrow}</p>
                <p className="max-w-[16ch] font-ant uppercase text-[clamp(1.8rem,3.2vw,2.7rem)] font-light leading-[1.1] text-chalk">
                  {mm.pdpHowTitle}
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {p.howToUse && (
                <Reveal y={16} delay={0.06}>
                  <p className="text-[clamp(1.05rem,1.8vw,1.5rem)] leading-[1.7] text-chalk-muted">{p.howToUse}</p>
                </Reveal>
              )}
              {(p.useWhen || p.useAmount || p.useOrder) && (
                <Reveal y={16} delay={0.1}>
                  <dl className="mt-10 grid gap-x-10 gap-y-8 border-t border-night-line pt-8 sm:grid-cols-3">
                    {p.useWhen && (
                      <div>
                        <dt className="kicker text-[9px]! text-chalk-faint!">{mm.pdpWhen}</dt>
                        <dd className="mt-3 text-[14px] leading-relaxed text-chalk-muted">{p.useWhen}</dd>
                      </div>
                    )}
                    {p.useAmount && (
                      <div>
                        <dt className="kicker text-[9px]! text-chalk-faint!">{mm.pdpAmount}</dt>
                        <dd className="mt-3 text-[14px] leading-relaxed text-chalk-muted">{p.useAmount}</dd>
                      </div>
                    )}
                    {p.useOrder && (
                      <div>
                        <dt className="kicker text-[9px]! text-chalk-faint!">{mm.pdpOrder}</dt>
                        <dd className="mt-3 text-[14px] leading-relaxed text-chalk-muted">{p.useOrder}</dd>
                      </div>
                    )}
                  </dl>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══ THE FORMULA ══════════════════════════════════════════════════ */}
      {(p.ingredients || p.keyActives.length > 0) && (
        <section className="border-y border-line/60 bg-mist/60">
          <div className="shell-wide grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="kicker mb-8">La formule</p>
                <p className="font-ant uppercase text-[clamp(1.6rem,2.6vw,2.2rem)] font-light leading-[1.12] text-carbon">
                  Ce qu&apos;il y a
                  <br />
                  <span className="text-iodine-deep">vraiment dedans.</span>
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal y={14} delay={0.06}>
                {p.keyActives.length > 0 && (
                  <>
                    <p className="kicker-xs mb-4 text-iodine-deep">{mm.pdpActives}</p>
                    <ul className="flex flex-wrap gap-2.5">
                      {p.keyActives.map((a) => {
                        const canon = canonise(a);
                        const cls =
                          "inline-flex min-h-9 items-center gap-2 border border-iodine/30 bg-canvas/60 px-3.5 text-[12px] font-semibold tracking-[0.02em] text-carbon";
                        return (
                          <li key={a}>
                            {canon ? (
                              <Link
                                href={`/actifs/${canon.slug}`}
                                className={`${cls} transition-colors hover:border-iodine hover:text-iodine-deep`}
                                title={`${canon.label} — ${canon.note}`}
                              >
                                <SparklesIcon size={11} strokeWidth={1.5} className="text-iodine-deep" />
                                {a}
                              </Link>
                            ) : (
                              <span className={cls}>
                                <SparklesIcon size={11} strokeWidth={1.5} className="text-iodine-deep" />
                                {a}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {p.keyActives.some((a) => canonise(a)) && (
                      <p className="mt-4 text-[12px] leading-relaxed text-faint">
                        Ouvrez un actif pour lire ce que nous en disons et les autres produits du
                        comptoir qui le contiennent.{" "}
                        <Link href="/actifs" className="font-semibold text-iodine-deep underline decoration-iodine/40 underline-offset-4">
                          Le glossaire →
                        </Link>
                      </p>
                    )}
                  </>
                )}
                {p.ingredients && (
                  <details className="group mt-8 border-t border-line/60 pt-2">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-carbon">
                      {mm.pdpInciToggle}
                      <span aria-hidden className="font-ant uppercase text-[20px] font-light text-faint transition-transform duration-500 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="pt-2 pb-6 pr-4 text-[13px] leading-[1.9] text-muted">{p.ingredients}</p>
                  </details>
                )}
                <p className="mt-7 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                  Nous publions la liste telle qu&apos;elle figure sur l&apos;emballage. En cas d&apos;allergie connue,
                  lisez-la en boutique avec notre pharmacien avant la première application.
                </p>
                {p.allergens.length > 0 && (
                  <p className="mt-4 max-w-2xl border-l-2 border-iodine/40 pl-4 text-[13px] leading-relaxed text-carbon">
                    Allergènes parfumants présents dans cette formule : <strong className="font-semibold">{p.allergens.join(", ")}</strong>.
                    Ils sont lus dans la liste ci-dessus, jamais déclarés à la main.
                  </p>
                )}
                {p.ingredients && p.dataSources?.ingredients?.state !== "verified" && (
                  <p className="mt-4 max-w-2xl text-[12.5px] leading-relaxed text-amber-700">
                    Fiche non encore contrôlée ligne à ligne par un pharmacien de la maison
                    {p.dataSources?.ingredients?.source ? ` — source : ${p.dataSources.ingredients.source}` : ""}.
                    Une composition douteuse se demande au comptoir, jamais au hasard : appelez-nous et nous vérifions la notice avec vous.
                  </p>
                )}
                {p.verifiedAt && (
                  <p className="mt-3 text-[12px] text-faint">
                    Fiche vérifiée le {formatDate(p.verifiedAt)}
                    {p.verifiedBy ? ` par ${p.verifiedBy}` : ""}.
                  </p>
                )}
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ══ THE VOICES ═══════════════════════════════════════════════════ */}
      <section id="avis" className="shell-wide py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="kicker mb-8">Les avis</p>
                <p className="font-ant uppercase text-[clamp(3.6rem,7vw,5.6rem)] font-light leading-none tracking-[-0.04em] text-carbon">
                  {p.ratingCount > 0 ? (p.ratingAvg / 100).toFixed(1) : "—"}
                  <span className="font-ant uppercase text-[0.26em] align-super text-faint">/5</span>
                </p>
                {p.ratingCount > 0 && <Stars value={p.ratingAvg / 100} count={p.ratingCount} size={16} className="mt-5" />}
                <p className="mt-7 max-w-xs text-[13.5px] leading-relaxed text-muted">
                  {mm.pdpReviewGate} Chaque avis est relu avant publication ; un retour négatif fondé ne sera jamais
                  supprimé — même lorsqu&apos;il nous dérange.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            {p.reviews.length === 0 ? (
              <div className="border border-dashed border-line-strong/60 px-6 py-14">
                <p className="font-ant uppercase text-[20px] font-light text-carbon">Aucun avis pour l&apos;instant.</p>
                <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">
                  {mm.pdpReviewGate} Les premières lignes arriveront avec les premières clientes livrées.
                </p>
              </div>
            ) : (
              <ul>
                {p.reviews.map((r, i) => (
                  <Reveal key={r.id} as="li" y={12} delay={i * 0.04} className="border-b border-line/60 py-8 first:pt-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center border border-line-strong/50 bg-mist font-ant uppercase text-[15px] text-iodine-deep">
                          {r.authorName.charAt(0)}
                        </span>
                        <span>
                          <span className="block text-[13.5px] text-carbon">
                            {r.authorName}
                            {r.isVerified && (
                              <span className="ml-2.5 inline-flex min-h-5 translate-y-[1px] items-center gap-1 border border-ok/25 bg-ok-wash/40 px-1.5 align-middle text-[8.5px] font-bold uppercase tracking-[0.12em] text-ok">
                                <CheckIcon size={8} strokeWidth={3} /> {mm.pdpVerified}
                              </span>
                            )}
                          </span>
                          <span className="block text-[11.5px] text-faint">{formatDate(r.createdAt)}</span>
                        </span>
                      </div>
                      <Stars value={r.rating} showCount={false} size={12} />
                    </div>
                    {r.title && <p className="mt-6 font-ant uppercase text-[17px] font-light text-carbon">{r.title}</p>}
                    <p className="mt-2.5 text-[14px] leading-[1.9] text-carbon">{r.body}</p>
                    {r.reply && (
                      <div className="mt-6 border-l border-iodine/60 bg-mist/70 px-6 py-5">
                        <p className="kicker-xs mb-2.5 text-iodine-deep">Réponse de Cléopâtre</p>
                        <p className="text-[13.5px] leading-relaxed text-carbon">{r.reply}</p>
                      </div>
                    )}
                  </Reveal>
                ))}
              </ul>
            )}
            <div className="mt-10">
              {verifiedPurchase.length > 0 ? (
                <ReviewForm productId={p.id} />
              ) : (
                <p className="border border-dashed border-line-strong/60 bg-mist/40 px-6 py-5 text-[13px] leading-relaxed text-muted">
                  {user ? (
                    mm.pdpReviewGate
                  ) : (
                    <>
                      {mm.pdpReviewLogin}{" "}
                      <Link href={`/connexion?next=/produit/${p.slug}`} className="link-underline text-carbon">
                        Se connecter
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMPLÉTER LE RITUEL — the carousel ═══════════════════════════ */}
      {related.length > 0 && (
        <section className="border-t border-line/60 bg-canvas-2/30">
          <div className="shell-wide py-20 lg:py-28">
            <Reveal>
              <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="kicker-xs mb-4 text-faint">Votre rituel</p>
                  <h2 className="font-ant uppercase text-[clamp(1.7rem,3vw,2.5rem)] font-light text-carbon">Ce qui va bien avec</h2>
                </div>
                <Link
                  href={p.category ? `/categorie/${p.category.slug}` : "/boutique"}
                  className="group inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em] text-muted transition-colors hover:text-carbon"
                >
                  Tout le rayon
                  <ArrowUpRightIcon size={14} strokeWidth={1.5} className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl-mirror" />
                </Link>
              </div>
            </Reveal>
            <EmblaRow ariaLabel="Produits complémentaires" slidesPerView={4}>
              {related.map((r) => (
                <EditorialProductCard key={r.id} p={r} isAuthed={!!user} />
              ))}
            </EmblaRow>
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={p.id} />

      {/* The mobile counter sits above the thumb bar; this clears it. */}
      <div className="h-32 lg:hidden" />

      <div className="shell-wide hidden pb-20 lg:block">
        <Link
          href={p.universe ? `/univers/${p.universe.slug}` : "/boutique"}
          className="group inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em] text-muted transition-colors hover:text-carbon"
        >
          <span aria-hidden className="h-px w-8 bg-line-strong transition-all duration-500 group-hover:w-12 group-hover:bg-iodine-deep" />
          Revenir à {p.universe?.name ?? "la boutique"}
        </Link>
      </div>
    </>
  );
}
