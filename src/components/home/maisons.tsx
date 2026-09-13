import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ChapterHead } from "./chapter-head";

/**
 * HM · LES MAISONS — a typographic wall.
 *
 * Sixteen laboratories carry the section by name alone; the scale alternates
 * so the wall reads as a composition, not a directory. Three stories anchor
 * the bottom for those who want to know *why* each house is here.
 */
export function Maisons({
  brands,
  copy,
}: {
  brands: { id: number; slug: string; name: string; country: string | null; story: string | null }[];
  copy: { index: string; eyebrow: string; title: string; description: string; cta: string };
}) {
  if (brands.length === 0) return null;
  return (
    <section aria-label={copy.index} className="relative">
      <div className="container-wide py-20 lg:py-32">
        <ChapterHead
          index={copy.index}
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          action={{ href: "/marques", label: copy.cta }}
        />

        <Reveal className="mt-12 lg:mt-16" y={18}>
          <ul className="flex flex-wrap items-baseline gap-x-10 gap-y-6 lg:gap-x-16 lg:gap-y-8">
            {brands.map((b, i) => (
              <li key={b.id}>
                <Link
                  href={`/marque/${b.slug}`}
                  className={`group inline-flex items-baseline gap-3 transition-colors duration-500 ${
                    i % 5 === 0
                      ? "font-display text-[clamp(1.8rem,3.6vw,3rem)] text-ink"
                      : "font-display text-[clamp(1.2rem,2vw,1.7rem)] text-charcoal"
                  }`}
                >
                  <span className="relative">
                    {b.name}
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 h-px w-full origin-right scale-x-0 bg-champagne-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100 ltr:left-0 rtl:right-0"
                    />
                  </span>
                  {b.country && <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-2">{b.country}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-12 grid gap-8 border-t border-stone/60 pt-9 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {brands.slice(0, 3).map((b, i) => (
            <Reveal key={b.id} delay={i * 0.08} y={14}>
              <Link href={`/marque/${b.slug}`} className="group block">
                <p className="flex items-baseline gap-3 font-display text-[21px] text-ink transition-colors duration-500 group-hover:text-champagne-2">
                  {b.name}
                  {b.country && <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-2">{b.country}</span>}
                </p>
                {b.story && <p className="mt-3 line-clamp-3 text-[13.5px] leading-[1.8] text-muted">{b.story}</p>}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
