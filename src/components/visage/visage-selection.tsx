import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { CineFeature, CinePlate } from "./visage-product";
import type { ProductCard as PC } from "@/lib/catalog";
import type { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * THE SELECTION — the curated eight, staged asymmetrically.
 *
 * Untouched visitors meet the officine's shortlist first: one reference
 * promoted to a full editorial statement, the rest gliding past on a
 * snap rail, the whole shelf waiting on a gold end card (`?all=1`).
 */
export function VisageSelection({
  items,
  total,
  basePath,
  copy,
  wishedIds = [],
  isAuthed = false,
}: {
  items: PC[];
  total: number;
  basePath: string;
  copy: Copy;
  wishedIds?: number[];
  isAuthed?: boolean;
}) {
  if (items.length === 0) return null;
  const [lead, ...rest] = items;
  return (
    <section id="selection" aria-label={copy.univers.selection} className="scroll-mt-16 bg-cine-noir">
      <div className="container-wide py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-4">
              <span className="cine-index">02</span>
              <span className="h-px w-10 bg-cine-line" aria-hidden />
              <span className="cine-kicker">{copy.merch.roomEyebrow}</span>
            </p>
            <h2 className="cine-title mt-6">{copy.univers.selection}</h2>
          </div>
          <Link href={`${basePath}?all=1`} className="cine-cta">
            {fmt(copy.merch.roomAll, { n: total })}
            <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
          </Link>
        </div>

        <div className="mt-12 lg:mt-16">
          <CineFeature p={lead} wished={wishedIds.includes(lead.id)} isAuthed={isAuthed} />
        </div>
      </div>

      {rest.length > 0 && (
        <div className="pb-20 lg:pb-28">
          <ol className="scrollbar-none flex snap-x snap-mandatory gap-8 overflow-x-auto px-[var(--spacing-gutter)] pb-2 lg:gap-12 lg:px-[var(--spacing-gutter-lg)]">
            {rest.map((p, i) => (
              <li key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
                <p className="mb-4 flex items-baseline gap-3" aria-hidden>
                  <span className="cine-index">{String(i + 2).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-cine-line" />
                </p>
                <CinePlate p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} />
              </li>
            ))}
            <li className="shrink-0 snap-start">
              <p className="mb-4 flex items-baseline gap-3" aria-hidden>
                <span className="cine-index">→</span>
                <span className="h-px w-24 bg-cine-line" />
              </p>
              <Link
                href={`${basePath}?all=1`}
                className="group flex min-h-[26rem] w-60 flex-col items-start justify-between gap-6 bg-cine-gold p-6 text-cine-noir transition-transform duration-500 hover:-translate-y-1 sm:w-72"
              >
                <span className="font-display text-[3rem] font-light italic leading-none">{total}</span>
                <span>
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.22em]">
                    {fmt(copy.merch.roomAll, { n: total })}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em]">
                    {copy.common.viewAll}
                    <ArrowRightIcon size={13} className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          </ol>
        </div>
      )}
    </section>
  );
}
