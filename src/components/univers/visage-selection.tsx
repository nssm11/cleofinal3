import Link from "next/link";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/catalog/product-card";
import { ArrowRightIcon } from "@/components/icons";
import type { ProductCard as PC } from "@/lib/catalog";
import type { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * VISAGE SELECTION — the curated eight, ranked on a rail.
 *
 * Untouched visitors meet the officine's shortlist first, exactly as before —
 * but dealt as a numbered snap rail (01–08) with the whole shelf waiting on
 * an end card (`?all=1`), instead of the old editorial grid.
 */
export function VisageSelection({
  items,
  total,
  basePath,
  copy,
}: {
  items: PC[];
  total: number;
  basePath: string;
  copy: Copy;
}) {
  if (items.length === 0) return null;
  return (
    <section id="explorer" aria-label={copy.univers.selection} className="scroll-mt-28">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <SectionBrow
          index="03"
          eyebrow={copy.merch.roomEyebrow}
          title={copy.univers.selection}
          action={{ href: `${basePath}?all=1`, label: fmt(copy.merch.roomAll, { n: total }) }}
        />
        <Reveal delay={0.08}>
          <ol className="scrollbar-none -mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
            {items.map((p, i) => (
              <li key={p.id} className="w-60 shrink-0 snap-start sm:w-64">
                <p className="mb-3 flex items-baseline justify-between gap-3">
                  <span className="font-display text-[15px] italic text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden className="h-px flex-1 bg-ink/10" />
                </p>
                <ProductCard p={p} priority={i < 2} />
              </li>
            ))}
            <li className="shrink-0 snap-start">
              <p className="mb-3 flex items-baseline justify-between gap-3" aria-hidden>
                <span className="font-display text-[15px] italic text-muted-2">→</span>
                <span className="h-px w-24 bg-ink/10" />
              </p>
              <Link
                href={`${basePath}?all=1`}
                className="group flex h-full min-h-72 w-60 flex-col items-start justify-between gap-6 bg-ink p-6 text-paper transition-transform duration-300 hover:-translate-y-1 sm:w-64"
              >
                <span className="font-display text-[34px] italic leading-none">{total}</span>
                <span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-paper/70">
                    {fmt(copy.merch.roomAll, { n: total })}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-2 text-[13px] text-paper">
                    Tout parcourir <ArrowRightIcon size={14} className="transition-transform duration-300 group-hover:translate-x-1 rtl-mirror" />
                  </span>
                </span>
              </Link>
            </li>
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
