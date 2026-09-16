import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { CinePlate } from "./visage-product";
import type { ProductCard as PC } from "@/lib/catalog";
import type { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * THE SELECTION — the curated eight, ranked on a grid.
 *
 * Untouched visitors meet the officine's shortlist first: eight plates in
 * a staggered grid, each carrying its rank, the whole shelf waiting on a
 * gold end cell (`?all=1`) that spans the row on phones and closes the
 * grid on desktop.
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

        <ol className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 sm:pb-10 lg:mt-16 lg:grid-cols-3 lg:gap-x-10 sm:[&>li:nth-child(2n)]:translate-y-10">
          {items.map((p, i) => (
            <li key={p.id} className="min-w-0">
              <p className="mb-4 flex items-baseline gap-3" aria-hidden>
                <span className="cine-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="h-px flex-1 bg-cine-line" />
              </p>
              <CinePlate p={p} wished={wishedIds.includes(p.id)} isAuthed={isAuthed} priority={i < 3} />
            </li>
          ))}
          <li className="flex min-w-0 flex-col sm:col-span-2 lg:col-span-1">
            <p className="mb-4 flex items-baseline gap-3" aria-hidden>
              <span className="cine-index">→</span>
              <span className="h-px flex-1 bg-cine-line" />
            </p>
            <Link
              href={`${basePath}?all=1`}
              className="group flex min-h-72 flex-1 flex-col items-start justify-between gap-6 bg-cine-gold p-6 text-cine-noir transition-transform duration-500 hover:-translate-y-1 sm:min-h-60"
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
    </section>
  );
}
