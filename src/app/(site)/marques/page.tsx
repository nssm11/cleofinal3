import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { getBrands } from "@/lib/catalog";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Les laboratoires",
  description:
    "Laboratoires dermatologiques et maisons de soin disponibles chez Cléopâtre, à Ezzahra et Hammam-Lif. Distribution officielle en Tunisie.",
  alternates: { canonical: "/marques" },
};
export const dynamic = "force-dynamic";

/**
 * THE INDEX OF HOUSES.
 *
 * Names carry this page. The featured laboratories are set as a wall of display
 * type at three sizes, then the full directory is alphabetised — a reference
 * page, not a shop window.
 */
export default async function MarquesPage() {
  const [list, featured] = await Promise.all([getBrands(), db.select().from(brands).where(eq(brands.isFeatured, true))]);
  const featuredIds = new Set(featured.map((f) => f.id));
  const rest = list.filter((b) => !featuredIds.has(b.id));
  const groups = rest.reduce<Record<string, typeof rest>>((acc, b) => {
    const k = b.name[0].toUpperCase();
    (acc[k] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div>
      <section className="relative overflow-hidden bg-paper pb-14 pt-28 lg:pb-20 lg:pt-36">
        <MotifLayer motif="architecture" light={[78, 12]} />
        <div className="relative container-wide">
          <p className="rule-label mb-8">Nos laboratoires</p>
          <Reveal y={14} amount={0.1}>
            <h1 className="max-w-[22ch] font-display text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[0.95] tracking-[-0.028em] text-ink">
              Seize maisons qui
              <span className="italic text-champagne-2"> engagent leur nom.</span>
            </h1>
            <p className="mt-8 max-w-[40rem] text-[15.5px] leading-[1.85] text-muted">
              Laboratoires dermatologiques européens et maisons de soin, distribués officiellement en Tunisie. Nous
              travaillons exclusivement avec des acteurs dont nous pouvons défendre les formules — et aucune marque
              n&apos;achète sa place dans cette liste.
            </p>
          </Reveal>
        </div>
      </section>

      {/* The wall */}
      <section className="relative overflow-hidden border-y border-stone/70 bg-cream">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-35" />
        </div>
        <div className="relative container-wide py-rhythm lg:py-rhythm-lg">
          <p className="eyebrow mb-10 text-muted-2">Les maisons invitées</p>
          <ul className="flex flex-wrap items-baseline gap-x-10 gap-y-5 lg:gap-x-16 lg:gap-y-6">
            {featured.map((b, i) => (
              <Reveal key={b.id} as="li" y={12} delay={i * 0.04}>
                <Link
                  href={`/marque/${b.slug}`}
                  className={`group inline-flex items-baseline gap-3 transition-colors duration-500 ${
                    i % 3 === 0
                      ? "font-display text-[clamp(1.9rem,3.8vw,3.1rem)] text-ink"
                      : i % 3 === 1
                        ? "font-display text-[clamp(1.4rem,2.4vw,2rem)] text-charcoal"
                        : "font-display text-[clamp(1.1rem,1.8vw,1.5rem)] text-charcoal"
                  }`}
                >
                  <span className="relative">
                    {b.name}
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-champagne-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100"
                    />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-2">{b.country}</span>
                </Link>
              </Reveal>
            ))}
          </ul>

          <div className="mt-16 grid gap-10 border-t border-stone/70 pt-12 lg:grid-cols-3">
            {featured.slice(0, 3).map((b, i) => (
              <Reveal key={b.id} y={14} delay={i * 0.07}>
                <Link href={`/marque/${b.slug}`} className="group block">
                  <p className="font-display text-[21px] text-ink transition-colors duration-500 group-hover:text-champagne-2">
                    {b.name}
                  </p>
                  <p className="mt-3 line-clamp-4 text-[13.5px] leading-relaxed text-muted">{b.story}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-2">
                    Découvrir <ArrowRightIcon size={11} className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The directory */}
      <section className="container-wide py-rhythm lg:py-rhythm-lg">
        <p className="eyebrow mb-10 text-muted-2">Le répertoire complet</p>
        <div className="grid gap-x-14 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(groups)
            .sort()
            .map(([letter, bs]) => (
              <div key={letter}>
                <p className="flex items-baseline gap-4 border-b border-stone/70 pb-3">
                  <span className="font-display text-[30px] italic leading-none text-champagne-2">{letter}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-2">
                    {bs.length} maison{bs.length > 1 ? "s" : ""}
                  </span>
                </p>
                <ul className="mt-1">
                  {bs.map((b) => (
                    <li key={b.id} className="border-b border-stone/50">
                      <Link href={`/marque/${b.slug}`} className="group flex items-baseline justify-between gap-3 py-3">
                        <span className="text-[14.5px] text-charcoal transition-colors group-hover:text-ink">
                          {b.name}
                        </span>
                        <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted-2">{b.country}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
