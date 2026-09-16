import Link from "next/link";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";
import { ArrowUpRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type VisageRayon = { slug: string; name: string; description: string | null };

/**
 * VISAGE RAYONS — the children, dealt as a hand of cards.
 *
 * The old page set each child category as a giant editorial row. Here the
 * same doors open from compact counter cards: numeral, name, one line of
 * promise, and the way in. Same destinations, different furniture.
 */
export function VisageRayons({ rayons, copy }: { rayons: VisageRayon[]; copy: Copy }) {
  if (rayons.length === 0) return null;
  return (
    <section id="rayon" aria-label={fmt(copy.univers.seeCategories, { n: rayons.length })} className="scroll-mt-28 border-y border-stone/60 bg-cream/45">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <SectionBrow
          index="02"
          eyebrow={copy.univers.inUniverse}
          title={fmt(copy.univers.seeCategories, { n: rayons.length })}
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {rayons.map((c, i) => (
            <li key={c.slug}>
              <Reveal delay={Math.min(i * 0.05, 0.3)} className="h-full">
                <Link
                  href={`/categorie/${c.slug}`}
                  className="group flex h-full min-h-36 flex-col justify-between gap-4 border border-ink/12 bg-paper p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_18px_36px_-20px_rgba(28,25,23,0.4)]"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-display text-[15px] italic text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                    <ArrowUpRightIcon
                      size={16}
                      className="text-muted-2 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                    />
                  </span>
                  <span>
                    <span className="block font-display text-[22px] leading-tight text-ink">{c.name}</span>
                    {c.description && (
                      <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-muted">{c.description}</span>
                    )}
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
