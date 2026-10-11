import Link from "next/link";
import { cn } from "@/lib/cn";
import { TINT_LABELS, type CollectionLayout } from "@/data/types";

/**
 * Section headings are printed like program entries: a mono index, the
 * Arabic title, the Latin counterpart quietly opposite, and a hairline.
 * The composition differs by section role so the page never reads as a
 * stack of identical headers.
 */
export function SectionHead({
  index,
  titleAr,
  titleLat,
  note,
  href,
  hrefLabel = "الكل",
  tint,
  className,
}: {
  index: number;
  titleAr: string;
  titleLat: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
  tint?: keyof typeof TINT_LABELS;
  className?: string;
}) {
  return (
    <header className={cn("mb-8", className)}>
      <div className="rule-double mb-5" />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex items-end gap-4">
          <span className="label-mono translate-y-[-4px] text-tungsten">
            {String(index).padStart(2, "0")}
          </span>
          <h2 className="display-tight text-3xl font-bold text-bone md:text-4xl">
            {titleAr}
            {tint && (
              <span className="ms-3 align-middle text-[13px] font-normal text-faint">
                {TINT_LABELS[tint]}
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-latin text-sm italic text-ash">{titleLat}</span>
          {href && (
            <Link
              href={href}
              className="label-ar group inline-flex items-center gap-1 text-bone hover:text-tungsten"
            >
              {hrefLabel}
              <span aria-hidden className="transition-transform duration-(--duration-flip) group-hover:-translate-x-1">
                ←
              </span>
            </Link>
          )}
        </div>
      </div>
      {note && <p className="mt-3 max-w-2xl text-sm leading-7 text-ash">{note}</p>}
    </header>
  );
}

/** A quieter head for sub-views (episode blocks, related shelves). */
export function SubHead({ titleAr, extra, className }: { titleAr: string; extra?: string; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-2", className)}>
      <h2 className="display-tight text-xl font-bold">{titleAr}</h2>
      {extra && <span className="label-ar text-faint">{extra}</span>}
    </div>
  );
}

export const LAYOUT_HINT: Record<CollectionLayout, string> = {
  rail: "شريط قابل للسحب",
  index: "فهرس",
  salon: "معلّق",
  wall: "جدار",
  wide: "عريض",
  feature: "بطل واحد",
};
