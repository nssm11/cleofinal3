import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getConcernBySlug, getConcerns } from "@/lib/catalog";
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
  const [c, all] = await Promise.all([getConcernBySlug(slug), getConcerns()]);
  if (!c) notFound();
  const i = all.findIndex((x) => x.id === c.id);

  return (
    <div>
      <section className="relative overflow-hidden bg-paper pb-12 pt-28 lg:pb-16 lg:pt-36">
        <MotifLayer motif="clarity" light={[20, 10]} />
        <div className="relative container-wide">
          <p className="mb-7 flex items-baseline gap-5">
            <span className="font-display text-[clamp(1.5rem,2.6vw,2.4rem)] italic leading-none text-champagne-2">
              {String(i + 1).padStart(2, "0")}
              <span className="text-[0.5em] text-muted-2"> / {String(all.length).padStart(2, "0")}</span>
            </span>
            <span className="eyebrow">Par besoin</span>
          </p>
          <Reveal y={12} amount={0.1}>
            <h1 className="max-w-[24ch] font-display text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[0.95] tracking-[-0.028em] text-ink">
              {c.name}
              <span className="block italic text-champagne-2">que faire&nbsp;?</span>
            </h1>
          </Reveal>

          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-6" y={14} delay={0.08}>
              <div className="flex gap-5 border-l border-champagne/60 pl-6">
                <InfoIcon size={18} className="mt-1 shrink-0 text-champagne-2" />
                <p className="text-[15.5px] leading-[1.9] text-charcoal">{c.intro}</p>
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
              <p className="eyebrow mb-6 text-muted-2">Les autres besoins</p>
              <ul className="border-t border-stone/70">
                {all
                  .filter((x) => x.id !== c.id)
                  .map((x) => (
                    <li key={x.id} className="border-b border-stone/70">
                      <Link
                        href={`/besoin/${x.slug}`}
                        className="group flex items-center justify-between gap-4 py-3.5 text-[14.5px] text-charcoal transition-colors hover:text-ink"
                      >
                        {x.name}
                        <ArrowRightIcon
                          size={13}
                          className="shrink-0 text-sand-2 transition-all duration-300 group-hover:translate-x-1 group-hover:text-champagne-2"
                        />
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      <div className="container-wide pb-16 lg:pb-24">
        <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
          <Listing base={{ concernId: c.id }} sp={sp} hideConcerns basePath={`/besoin/${c.slug}`} />
        </Suspense>
      </div>
    </div>
  );
}
