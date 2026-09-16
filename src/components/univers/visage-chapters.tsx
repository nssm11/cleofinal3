import Link from "next/link";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRightIcon } from "@/components/icons";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type VisageChapter = { slug: string; name: string };

/**
 * VISAGE CHAPTERS — the other rooms, as doors.
 *
 * Where the old page closed with an index of quiet links, the new page ends
 * on a rail of room cards: each universe's film kicker, its name in the
 * display face, and the way in. The current room is never listed.
 */
export function VisageChapters({
  chapters,
  copy,
}: {
  chapters: VisageChapter[];
  copy: Copy;
}) {
  if (chapters.length === 0) return null;
  return (
    <section aria-label={copy.univers.otherRooms} className="border-t border-stone/60 bg-ink text-paper">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="[&_h2]:text-paper [&_p]:!text-paper/60">
          <SectionBrow index="04" eyebrow={copy.univers.otherRooms} title={copy.univers.otherRooms} />
        </div>
        <Reveal delay={0.08}>
          <ul className="scrollbar-none -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-6">
            {chapters.map((c) => {
              const cinema = UNIVERSE_CINEMA[c.slug];
              return (
                <li key={c.slug} className="w-52 shrink-0 snap-start sm:w-60 lg:w-auto">
                  <Link
                    href={`/univers/${c.slug}`}
                    className="group flex min-h-40 flex-col justify-between gap-4 border border-paper/15 bg-paper/[0.04] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-champagne hover:bg-paper/[0.08]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-champagne">
                      {cinema?.kicker ?? copy.univers.label}
                    </span>
                    <span className="flex items-end justify-between gap-3">
                      <span className="font-display text-[21px] leading-tight">{c.name}</span>
                      <ArrowRightIcon
                        size={15}
                        className="mb-1 shrink-0 text-paper/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-champagne rtl-mirror"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
