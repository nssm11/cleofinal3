import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBrandBySlug } from "@/lib/catalog";
import { getBrandHeroProducts } from "@/lib/merch";
import { getCopy } from "@/lib/i18n/server";
import { ProductCard } from "@/components/catalog/product-card";
import { Listing, type SP } from "@/components/catalog/listing";
import { Breadcrumbs, ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { ArrowRightIcon, ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await getBrandBySlug((await params).slug);
  return b
    ? {
        title: `${b.name} — tous les produits`,
        description: b.story ?? undefined,
        alternates: { canonical: `/marque/${b.slug}` },
      }
    : {};
}

/** THE HOUSE OF A LABORATORY — the story first, then its references. */
export default async function MarquePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const b = await getBrandBySlug(slug);
  if (!b) notFound();
  const [hero, copy] = await Promise.all([getBrandHeroProducts(b.id), getCopy()]);
  const mm = copy.merch;

  return (
    <div>
      <section className="relative overflow-hidden bg-paper pb-12 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="architecture" light={[16, 16]} />
        <div className="relative container-wide">
          <Breadcrumbs items={[{ href: "/marques", label: "Les laboratoires" }, { label: b.name }]} />

          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-7" y={14} amount={0.1}>
              <p className="eyebrow mb-7">{b.country ?? "Laboratoire"}</p>
              <h1 className="font-display text-[clamp(2.4rem,5.8vw,4.8rem)] leading-[0.94] tracking-[-0.03em] text-ink">
                {b.name}
              </h1>
              {b.story && (
                <p className="mt-8 max-w-[42rem] text-[15.5px] leading-[1.9] text-muted">{b.story}</p>
              )}
              <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-stone/70 pt-6 text-[12.5px] text-muted">
                <span className="flex items-center gap-2">
                  <ShieldIcon size={14} className="text-champagne-2" /> Distribution officielle en Tunisie
                </span>
                {b.isFeatured && (
                  <span className="flex items-center gap-2 text-champagne-2">
                    <span aria-hidden className="h-px w-5 bg-champagne-2" /> Sélection maison
                  </span>
                )}
              </div>
            </Reveal>

            <Reveal className="lg:col-span-4 lg:col-start-9 lg:pt-6" y={14} delay={0.1}>
              <p className="eyebrow mb-6 text-muted-2">Continuer</p>
              <ul className="border-t border-stone/70">
                {[
                  [`/marque/${b.slug}?sort=price_asc`, "Trier par prix croissant"],
                  [`/marque/${b.slug}?sort=newest`, "Les nouveautés de la maison"],
                  ["/marques", "Les autres laboratoires"],
                  ["/besoin/peau-sensible", "Trouver mon soin autrement"],
                ].map(([href, label]) => (
                  <li key={href} className="border-b border-stone/70">
                    <Link
                      href={href}
                      className="group flex items-center justify-between gap-4 py-3.5 text-[14px] text-charcoal transition-colors hover:text-ink"
                    >
                      {label}
                      <ArrowRightIcon
                        size={13}
                        className="shrink-0 text-sand-2 transition-all duration-300 group-hover:translate-x-1 group-hover:text-champagne-2"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {hero.length >= 2 && (
        <section className="container-wide pb-14" aria-label={mm.brandHeroEyebrow}>
          <Reveal>
            <p className="eyebrow mb-7 flex items-center gap-3 text-muted-2">
              <span aria-hidden className="h-px w-8 bg-champagne-3" />
              {mm.brandHeroEyebrow}
              <span className="text-champagne-2">— {b.name}</span>
            </p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 lg:gap-x-8">
              {hero.map((hp, hi) => (
                <ProductCard key={hp.id} p={hp} priority={hi === 0} />
              ))}
            </div>
          </Reveal>
        </section>
      )}

      <div className="container-wide pb-16 lg:pb-24">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ brandId: b.id }} sp={sp} hideBrands basePath={`/marque/${b.slug}`} />
        </Suspense>
      </div>
    </div>
  );
}
