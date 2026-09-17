import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getConcernBySlug, getConcerns } from "@/lib/catalog";
import { getRoutineStrip } from "@/lib/merch";
import { getCopy } from "@/lib/i18n/server";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";
import { Listing, type SP } from "@/components/catalog/listing";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { ArrowRightIcon, InfoIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getConcernBySlug((await params).slug);
  return c
    ? {
        title: `${c.name} — conseils & produits`,
        description: c.intro ?? undefined,
        alternates: { canonical: `/besoin/${c.slug}` },
      }
    : {};
}

/**
 * THE ADVISOR'S PAGE.
 *
 * This is the one place in the house where words come before images: a shopper
 * who arrives with a concern needs an answer, not a shelf. The advice panel
 * therefore stays in the flow of reading (not in a sidebar), and only then do
 * the products appear as the answer to it.
 */
export default async function BesoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [c, all, copy] = await Promise.all([getConcernBySlug(slug), getConcerns(), getCopy()]);
  if (!c) notFound();
  // The curated ritual needs the concern id first — one small serial hop, then
  // the page renders with or without the strip depending on what staff set up.
  const strip = await getRoutineStrip(c.id);
  const mm = copy.merch;
  const i = all.findIndex((x) => x.id === c.id);

  return (
    <div>
      <section className="relative overflow-hidden bg-canvas pb-12 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="clarity" mark={[20, 10]} />
        <div className="relative shell-wide">
          <p className="mb-7 flex items-baseline gap-5">
            <span className="font-ant uppercase text-[clamp(1.5rem,2.6vw,2.4rem)] leading-none text-iodine-deep">
              {String(i + 1).padStart(2, "0")}
              <span className="text-[0.5em] text-faint"> / {String(all.length).padStart(2, "0")}</span>
            </span>
            <span className="kicker-xs">Par besoin</span>
          </p>
          <Reveal y={12} amount={0.1}>
            <h1 className="max-w-[24ch] font-ant uppercase text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[0.95] tracking-[-0.028em] text-carbon">
              {c.name}
              <span className="block text-iodine-deep">que faire&nbsp;?</span>
            </h1>
          </Reveal>

          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6" y={14} delay={0.08}>
              <div className="flex gap-5 border-l border-iodine/60 pl-6">
                <InfoIcon size={18} className="mt-1 shrink-0 text-iodine-deep" />
                <p className="text-[15.5px] leading-[1.9] text-carbon">{c.intro}</p>
              </div>
              <p className="mt-7 text-[13.5px] leading-relaxed text-muted">
                Cette sélection a été relue par notre équipe officinale. Elle n&apos;est ni exhaustive ni
                définitive&nbsp;: si votre situation est particulière — grossesse, traitement en cours, peau réactive —
                appelez-nous avant de commander.
              </p>
              <a href="tel:+21671450210" className="btn-ghost mt-6">
                Parler à un pharmacien — 71 450 210
              </a>
            </Reveal>

            <nav className="lg:col-span-5 lg:col-start-8" aria-label="Autres besoins">
              <p className="kicker-xs mb-6 text-faint">Les autres besoins</p>
              <ul className="border-t border-line/70">
                {all
                  .filter((x) => x.id !== c.id)
                  .map((x) => (
                    <li key={x.id} className="border-b border-line/70">
                      <Link
                        href={`/besoin/${x.slug}`}
                        className="group flex items-center justify-between gap-4 py-3.5 text-[14.5px] text-carbon transition-colors hover:text-carbon"
                      >
                        {x.name}
                        <ArrowRightIcon
                          size={13}
                          className="shrink-0 text-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-iodine-deep"
                        />
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      {strip && (
        <section className="relative overflow-hidden border-y border-line/70 bg-mist" aria-label={mm.routineTitle}>
          <div className="shell-wide py-12 lg:py-14">
            <Reveal>
              <p className="kicker-xs mb-2 flex items-center gap-3 text-iodine-deep">
                <span aria-hidden className="h-px w-8 bg-iodine" />
                {mm.routineEyebrow}
              </p>
              <h2 className="font-ant uppercase text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight tracking-[-0.02em] text-carbon">{mm.routineTitle}</h2>
            </Reveal>
            <ol className="mt-9 grid gap-8 md:grid-cols-3 md:gap-6">
              {strip.map((st, i) => (
                <Reveal key={st.position} as="li" y={12} delay={i * 0.08} className="relative flex flex-col">
                  <p className="mb-3 flex items-baseline gap-3">
                    <span className="font-ant uppercase text-[15px] text-iodine-deep">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-carbon">{st.label}</span>
                  </p>
                  <EditorialProductCard p={st.product} />
                  {st.reason && (
                    <p className="mt-3 text-[12.5px] leading-relaxed text-muted before:mr-1.5 before: before:text-iodine-deep before:content-['—']">
                      {st.reason}
                    </p>
                  )}
                  {i < 2 && (
                    <ArrowRightIcon
                      size={16}
                      className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-faint md:block rtl-mirror"
                      aria-hidden
                    />
                  )}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      <div className="shell-wide pb-16 lg:pb-24">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ concernId: c.id }} sp={sp} hideConcerns basePath={`/besoin/${c.slug}`} />
        </Suspense>
      </div>
    </div>
  );
}
