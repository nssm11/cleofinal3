import Link from "next/link";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type VisageNeed = { slug: string; name: string; n: number };

/**
 * VISAGE NEEDS — enter by preoccupation.
 *
 * A snap-scrolling rail of need cards. Each card is a door into the explorer,
 * pre-filtered (`?concerns=`), with the honest count of references behind it.
 * Needs with no data never appear — the facet query guarantees it.
 */
export function VisageNeeds({
  needs,
  basePath,
  copy,
}: {
  needs: VisageNeed[];
  basePath: string;
  copy: Copy;
}) {
  if (needs.length === 0) return null;
  return (
    <section id="besoins" aria-label={copy.home.needsEyebrow} className="scroll-mt-28">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <SectionBrow
          index="01"
          eyebrow={copy.home.needsEyebrow}
          title={`${copy.home.needsTitle1} ${copy.home.needsTitle2}`}
          description={copy.home.needsText}
        />
        <Reveal delay={0.08}>
          <ul className="scrollbar-none -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
            {needs.map((c, i) => (
              <li key={c.slug} className="shrink-0 snap-start">
                <Link
                  href={`${basePath}?concerns=${c.slug}`}
                  className="group flex min-h-24 w-56 flex-col justify-between gap-3 border border-ink/12 bg-cream/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink hover:bg-cream hover:shadow-[0_18px_36px_-20px_rgba(28,25,23,0.4)] sm:w-64"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-display text-[13px] italic text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                    <span className="badge shrink-0 tabular-nums">
                      {c.n} réf{c.n > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="font-display text-[19px] leading-tight text-ink">{c.name}</span>
                    <ArrowRightIcon
                      size={15}
                      className="mb-1 shrink-0 text-muted-2 transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink rtl-mirror"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
