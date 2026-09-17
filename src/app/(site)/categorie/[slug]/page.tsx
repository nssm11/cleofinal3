import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRightIcon } from "@/components/icons";
import { getCategoryBySlug, getUniverses, listProducts } from "@/lib/catalog";
import { Listing, type SP } from "@/components/catalog/listing";
import { EmblaRow } from "@/components/catalog/embla-row";
import { Breadcrumbs, ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";
import { ArrowRightIcon } from "@/components/icons";
import { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  return c
    ? {
        title: c.name,
        description: c.description ?? undefined,
        alternates: { canonical: `/categorie/${c.slug}` },
        openGraph: { images: c.image ? [c.image] : [] },
      }
    : {};
}

/**
 * A ROOM, THEN A SHELF.
 *
 * The category opens as a film still — the rayon's image, the name set wide
 * across it — then the story of the parent universe in editorial measure,
 * then a curated row of what the house sells most in this room, and finally
 * the full shelf with its filters.
 */
export default async function CategoriePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [c, unis, copy] = await Promise.all([getCategoryBySlug(slug), getUniverses(), getCopy()]);
  if (!c || c.isUniverse) notFound();
  const t = copy.categorie;

  const siblings = unis.find((x) => x.slug === c.parent?.slug)?.children ?? [];
  const heroImage = c.parent?.image ?? c.image;

  // Curated: the room's own bestsellers, for the opening row.
  const curatedRow = (await listProducts({ categoryId: c.id, sort: "bestsellers", perPage: 8 })).items;

  return (
    <div>
      {/* ══ THE STILL ═══════════════════════════════════════════════════ */}
      <section className="relative">
        {heroImage ? (
          <div className="relative h-[52vh] min-h-[420px] w-full overflow-hidden bg-night lg:h-[62vh]">
            <Image src={heroImage} alt={c.parent?.name ?? c.name} fill priority sizes="100vw" className="object-cover opacity-80" />
            <div aria-hidden className="cine-scrim-hero" />
            <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-50" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="container-wide pb-12 lg:pb-16">
                <div className="flex items-center gap-4" aria-hidden>
                  <span className="cine-kicker">{c.parent?.name ?? "La maison"}</span>
                  <span className="h-px w-10 bg-film-line" />
                </div>
                <h1 className="cine-title mt-5 max-w-[20ch]">{c.name}</h1>
                {c.description && <p className="mt-5 max-w-[42ch] text-[14px] leading-[1.8] text-haze">{c.description}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-night">
            <div className="container-wide pb-12 pt-28 lg:pb-16 lg:pt-40">
              <span className="cine-kicker">{c.parent?.name ?? "La maison"}</span>
              <h1 className="cine-title mt-5 max-w-[20ch]">{c.name}</h1>
              {c.description && <p className="mt-5 max-w-[42ch] text-[14px] leading-[1.8] text-haze">{c.description}</p>}
            </div>
          </div>
        )}
      </section>

      {/* ══ THE EDITORIAL ROW ═══════════════════════════════════════════ */}
      <section className="border-b border-rule/60 bg-porcelain">
        <div className="container-wide grid gap-10 py-14 lg:grid-cols-12 lg:gap-16 lg:py-20">
          <Reveal className="lg:col-span-5" y={12}>
            {c.parent?.story && (
              <>
                <p className="rule-label mb-6">{c.parent.name}</p>
                <p className="text-[15px] leading-[1.95] text-slate">{c.parent.story}</p>
              </>
            )}
          </Reveal>

          {siblings.length > 0 && (
            <Reveal className="lg:col-span-6 lg:col-start-7" y={12} delay={0.08}>
              <p className="eyebrow mb-6 text-ash">{fmt(t.alsoIn, { name: c.parent?.name ?? "" })}</p>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-4">
                {siblings.map((s) =>
                  s.slug === c.slug ? (
                    <li key={s.id}>
                      <span aria-current="page" className="inline-flex items-baseline gap-3 font-display text-[18px] font-light text-cinabre-2">
                        <span aria-hidden className="h-px w-5 bg-cinabre-2" />
                        {s.name}
                      </span>
                    </li>
                  ) : (
                    <li key={s.id}>
                      <Link
                        href={`/categorie/${s.slug}`}
                        className="group inline-flex items-baseline gap-3 font-display text-[18px] font-light text-slate transition-colors hover:text-ink"
                      >
                        <span aria-hidden className="h-px w-5 bg-rule-strong transition-all duration-500 group-hover:w-7 group-hover:bg-cinabre-2" />
                        {s.name}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </Reveal>
          )}
        </div>
      </section>

      {/* ══ THE CURATED ROW ═════════════════════════════════════════════ */}
      {curatedRow.length > 0 && (
        <section className="border-b border-rule/60 bg-bone/50">
          <div className="container-wide py-14 lg:py-20">
            <Reveal>
              <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="eyebrow mb-4 text-ash">Sélection</p>
                  <h2 className="font-display text-[clamp(1.6rem,2.8vw,2.3rem)] font-light text-ink">
                    Ce que la maison recommande
                  </h2>
                </div>
                <Link
                  href={`/categorie/${c.slug}?sort=bestsellers`}
                  className="group inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.24em] text-graphite transition-colors hover:text-ink"
                >
                  Le rayon complet
                  <ArrowUpRightIcon size={14} strokeWidth={1.5} className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl-mirror" />
                </Link>
              </div>
            </Reveal>
            <EmblaRow ariaLabel={c.name} slidesPerView={4}>
              {curatedRow.map((p) => (
                <EditorialProductCard key={p.id} p={p} />
              ))}
            </EmblaRow>
          </div>
        </section>
      )}

      {/* ══ THE SHELF ═══════════════════════════════════════════════════ */}
      <div className="container-wide pb-12 pt-10 lg:pb-16 lg:pt-14">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ categoryId: c.id }} sp={sp} basePath={`/categorie/${c.slug}`} hideConcerns />
        </Suspense>
      </div>

      <section className="border-t border-rule/60 bg-bone/50">
        <div className="container-wide flex flex-wrap items-center justify-between gap-5 py-8">
          {c.parent && (
            <Link href={`/univers/${c.parent.slug}`} className="btn-ghost">
              <ArrowRightIcon size={13} className="rotate-180 rtl-mirror" /> {fmt(t.backTo, { name: c.parent.name })}
            </Link>
          )}
          <p className="text-[13px] text-graphite">
            {t.doubt}{" "}
            <Link href="/diagnostic" className="link-underline text-ink">
              {t.doubtCta}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
