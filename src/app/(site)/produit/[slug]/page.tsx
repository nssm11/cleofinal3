import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, restockAlerts, subscriptionItems, subscriptions, wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { getProductBySlug, getRelated, TOLERANCE_KEYS } from "@/lib/catalog";
import { getDuosForProduct, getFrequentlyBought, getSubstitutes } from "@/lib/merch";
import { SITE_URL } from "@/lib/env";
import { discountPercent, formatDT, formatDTShort } from "@/lib/money";
import { formatDate, jsonLd } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";
import { ProductCard } from "@/components/catalog/product-card";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";
import { RecentlyViewed, TrackView } from "@/components/catalog/recently-viewed";
import { ProductGallery } from "@/components/product/gallery";
import { BuyBox } from "@/components/product/buy-box";
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
  };
}

export default async function ProduitPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ offrir?: string; alert?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const giftMode = sp.offrir === "1";
  const [p, user] = await Promise.all([getProductBySlug(slug), getCurrentUser()]);
  if (!p) notFound();

  const [related, wishedRow, restockRow, subRow, copy, substitutes, duosForProduct, oftenWith, verifiedPurchase] = await Promise.all([
    getRelated(p.id, p.categoryId, p.universeId, 8),
    user ? db.select().from(wishlistItems).where(and(eq(wishlistItems.userId, user.id), eq(wishlistItems.productId, p.id))).limit(1) : Promise.resolve([] as { id: number }[]),
    user ? db.select({ id: sql<number>`id::int` }).from(restockAlerts).where(and(eq(restockAlerts.userId, user.id), eq(restockAlerts.productId, p.id))).limit(1) : Promise.resolve([] as { id: number }[]),
    user ? db.select({ id: sql<number>`subscriptions.id::int` }).from(subscriptions).innerJoin(subscriptionItems, eq(subscriptionItems.subscriptionId, subscriptions.id)).where(and(eq(subscriptions.userId, user.id), eq(subscriptionItems.productId, p.id), eq(subscriptions.status, "active"))).limit(1) : Promise.resolve([] as { id: number }[]),
    getCopy(),
    getSubstitutes(p.id),
    getDuosForProduct(p.id),
    getFrequentlyBought(p.id),
    user ? db.select({ one: sql<number>`1::int` }).from(orders).innerJoin(orderItems, eq(orderItems.orderId, orders.id)).where(and(eq(orders.userId, user.id), eq(orders.status, "delivered"), eq(orderItems.productId, p.id))).limit(1) : Promise.resolve([] as { one: number }[]),
  ]);
  const t = copy.product;
  const mm = copy.merch;
  const tolerances = TOLERANCE_KEYS.filter((k) => p.tolerances?.[k] === true);
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
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productLd) }} />
      <TrackView id={p.id} />

      {/* Breadcrumb + product */}
      <section className="border-b border-line">
        <div className="shell-wide">
          <div className="border-x border-line">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 px-6 py-4 lg:px-8 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted border-b border-line">
              <Link href="/" className="hover:text-ink">Accueil</Link>
              <span>/</span>
              {p.universe && <><Link href={`/univers/${p.universe.slug}`} className="hover:text-ink">{p.universe.name}</Link><span>/</span></>}
              <span className="text-ink truncate">{p.name}</span>
            </div>

            <div className="grid lg:grid-cols-12 gap-px bg-line">
              {/* Gallery */}
              <div className="lg:col-span-7 bg-bg p-6 lg:p-8">
                <ProductGallery images={images} alts={alts} name={p.name} sku={p.sku} volume={p.volume} brandName={p.brand?.name ?? null} out={out} badge={<>{pct > 0 && <span className="bg-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper">-{pct}%</span>}{p.isNew && pct === 0 && <span className="bg-bg border border-ink px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">Nouveau</span>}</>} />
              </div>

              {/* Info */}
              <div className="lg:col-span-5 bg-bg p-6 lg:p-8 flex flex-col">
                <div>
                  {p.brand && (
                    <Link href={`/marque/${p.brand.slug}`} className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted hover:text-ink">
                      {p.brand.name} {p.brand.country && `— ${p.brand.country}`}
                    </Link>
                  )}
                  <h1 className="mt-3 font-sans text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[1.0] tracking-[-0.03em]">{p.name}</h1>

                  {p.ratingCount > 0 && (
                    <div className="mt-4 flex items-center gap-3">
                      <Stars value={p.ratingAvg / 100} count={p.ratingCount} size={14} />
                      <a href="#avis" className="font-mono text-[11px] uppercase tracking-[0.06em] underline underline-offset-4">Avis</a>
                    </div>
                  )}

                  <div className="mt-6 flex items-baseline gap-3 border-b border-line pb-6">
                    <span className="font-sans text-[28px] font-semibold tracking-[-0.02em]">{formatDT(p.priceMillimes)}</span>
                    {pct > 0 && p.compareAtMillimes && (
                      <>
                        <span className="font-mono text-[13px] text-text-muted line-through">{formatDT(p.compareAtMillimes)}</span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-success">Économie {formatDTShort(p.compareAtMillimes - p.priceMillimes)}</span>
                      </>
                    )}
                  </div>

                  {p.shortDescription && <p className="mt-6 font-sans text-[15px] leading-[1.6] text-text-secondary">{p.shortDescription}</p>}

                  {p.concerns.length > 0 && (
                    <div className="mt-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Besoins</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.concerns.map((c) => (
                          <Link key={c.concernId} href={`/besoin/${c.concern.slug}`} className="border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] hover:border-ink">
                            {c.concern.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {tolerances.length > 0 && (
                    <div className="mt-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Tolérances</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tolerances.map((k) => (
                          <span key={k} className="bg-bg-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em]">{mm.tol[k]}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <BuyBox p={{ id: p.id, slug: p.slug, name: p.name, brandName: p.brand?.name ?? null, image: p.image, priceMillimes: p.priceMillimes, compareAtMillimes: p.compareAtMillimes, stock: p.stock, lowStockThreshold: p.lowStockThreshold, volume: p.volume }} wished={wishedRow.length > 0} isAuthed={!!user} giftMode={giftMode} restockSubscribed={restockRow.length > 0} openAlert={sp.alert === "1"} subscribed={subRow.length > 0} />
                </div>

                {(p.description || p.ingredients || p.howToUse) && (
                  <div className="mt-8 border-t border-line">
                    {[
                      ["Description", p.description],
                      ["Composition", p.ingredients],
                      ["Conseils", p.howToUse],
                    ].map(([title, body]) =>
                      body ? (
                        <details key={title as string} className="group border-b border-line">
                          <summary className="flex h-12 cursor-pointer items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
                            {title as string}
                            <span className="text-[14px] group-open:rotate-45 transition-transform">+</span>
                          </summary>
                          <p className="pb-6 font-sans text-[14px] leading-[1.7] text-text-secondary">{body as string}</p>
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

      {/* Ritual */}
      {(p.howToUse || p.useWhen) && (
        <section className="bg-ink text-paper border-b border-line">
          <div className="shell-wide">
            <div className="border-x border-line-inverse grid gap-12 px-8 py-12 lg:grid-cols-12 lg:px-12 lg:py-16">
              <div className="lg:col-span-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-inverse-muted">Rituel — 01</p>
                <h2 className="mt-6 font-sans text-[28px] font-semibold leading-[1.1] tracking-[-0.02em]">Comment l&apos;utiliser.</h2>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                {p.howToUse && <p className="font-sans text-[18px] leading-[1.6] text-text-inverse-secondary">{p.howToUse}</p>}
                {(p.useWhen || p.useAmount || p.useOrder) && (
                  <dl className="mt-10 grid gap-8 border-t border-line-inverse pt-8 sm:grid-cols-3">
                    {p.useWhen && <div><dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-inverse-muted">Quand</dt><dd className="mt-3 font-sans text-[14px] leading-[1.5] text-text-inverse-secondary">{p.useWhen}</dd></div>}
                    {p.useAmount && <div><dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-inverse-muted">Quantité</dt><dd className="mt-3 font-sans text-[14px] leading-[1.5] text-text-inverse-secondary">{p.useAmount}</dd></div>}
                    {p.useOrder && <div><dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-inverse-muted">Ordre</dt><dd className="mt-3 font-sans text-[14px] leading-[1.5] text-text-inverse-secondary">{p.useOrder}</dd></div>}
                  </dl>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Formula */}
      {(p.ingredients || p.keyActives.length > 0) && (
        <section className="border-b border-line bg-bg-2">
          <div className="shell-wide">
            <div className="border-x border-line grid gap-12 px-8 py-12 lg:grid-cols-12 lg:px-12 lg:py-16">
              <div className="lg:col-span-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Formule — 02</p>
                <h2 className="mt-6 font-sans text-[24px] font-semibold leading-[1.1] tracking-[-0.02em]">Ce qu&apos;il y a vraiment dedans.</h2>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                {p.keyActives.length > 0 && (
                  <>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Actifs clés</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.keyActives.map((a) => (
                        <span key={a} className="border border-line bg-bg px-3 py-1.5 font-sans text-[13px]">{a}</span>
                      ))}
                    </div>
                  </>
                )}
                {p.ingredients && (
                  <details className="mt-8 border-t border-line pt-2">
                    <summary className="flex h-12 cursor-pointer items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em]">INCI complet <span>+</span></summary>
                    <p className="pb-6 font-sans text-[13px] leading-[1.7] text-text-secondary">{p.ingredients}</p>
                  </details>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section id="avis" className="border-b border-line">
        <div className="shell-wide">
          <div className="border-x border-line grid gap-12 px-8 py-12 lg:grid-cols-12 lg:px-12 lg:py-16">
            <div className="lg:col-span-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Avis — 03</p>
              <p className="mt-6 font-sans text-[56px] font-bold leading-none tracking-[-0.04em]">{p.ratingCount > 0 ? (p.ratingAvg / 100).toFixed(1) : "—"}<span className="text-[20px] font-normal text-text-muted">/5</span></p>
              {p.ratingCount > 0 && <div className="mt-4"><Stars value={p.ratingAvg / 100} count={p.ratingCount} size={16} /></div>}
              <p className="mt-6 max-w-[28ch] font-sans text-[13px] leading-[1.6] text-text-secondary">Chaque avis est relu. Un retour négatif fondé ne sera jamais supprimé.</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {p.reviews.length === 0 ? (
                <div className="border border-dashed border-line p-8">
                  <p className="font-sans text-[18px] font-semibold">Aucun avis pour l&apos;instant.</p>
                  <p className="mt-2 font-sans text-[13px] text-text-secondary">Les premières lignes arriveront avec les premières livraisons.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line border-y border-line">
                  {p.reviews.map((r) => (
                    <li key={r.id} className="py-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center border border-line bg-bg-2 font-mono text-[11px]">{r.authorName.charAt(0)}</span>
                          <span className="font-sans text-[13px] font-medium">{r.authorName}</span>
                          <span className="font-mono text-[11px] text-text-muted">{formatDate(r.createdAt)}</span>
                        </div>
                        <Stars value={r.rating} showCount={false} size={12} />
                      </div>
                      {r.title && <p className="mt-3 font-sans text-[15px] font-medium">{r.title}</p>}
                      <p className="mt-2 font-sans text-[14px] leading-[1.6] text-text-secondary">{r.body}</p>
                      {r.reply && <div className="mt-4 border-l border-ink bg-bg-2 px-4 py-3"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Réponse CLÉOPÂTRE</p><p className="mt-2 font-sans text-[13px]">{r.reply}</p></div>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8">
                {verifiedPurchase.length > 0 ? <ReviewForm productId={p.id} /> : <p className="border border-dashed border-line p-4 font-sans text-[13px] text-text-secondary">{user ? "Vous pourrez laisser un avis après livraison." : <><Link href={`/connexion?next=/produit/${p.slug}`} className="underline">Connectez-vous</Link> pour laisser un avis.</>}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-b border-line">
          <div className="shell-wide">
            <div className="border-x border-line px-8 py-8 lg:px-12 flex items-baseline justify-between">
              <h2 className="font-sans text-[20px] font-semibold tracking-[-0.01em]">Compléter le rituel</h2>
              <Link href={p.category ? `/categorie/${p.category.slug}` : "/boutique"} className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">Tout le rayon →</Link>
            </div>
            <div className="border-x border-line grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
              {related.map((r) => (
                <EditorialProductCard key={r.id} p={r} isAuthed={!!user} />
              ))}
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={p.id} />
    </>
  );
}
