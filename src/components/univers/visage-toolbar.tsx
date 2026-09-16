"use client";

import { useFilterParams } from "@/components/catalog/filters";
import { SortIcon } from "@/components/icons";
import type { SortKey } from "@/lib/catalog";

const SORTS: { v: SortKey; l: string }[] = [
  { v: "featured", l: "Notre sélection" },
  { v: "bestsellers", l: "Les plus demandés" },
  { v: "newest", l: "Nouveautés" },
  { v: "price_asc", l: "Prix croissant" },
  { v: "price_desc", l: "Prix décroissant" },
  { v: "rating", l: "Mieux notés" },
];

/**
 * VISAGE TOOLBAR — the explorer's headline row.
 *
 * The count of references on the left, a framed sort control on the right.
 * Same sort keys as every other shelf; a different posture — a console
 * readout, not a quiet line of words.
 */
export function VisageToolbar({ total }: { total: number }) {
  const f = useFilterParams();
  const active = (f.sp.get("sort") as SortKey | null) ?? "featured";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-ink/10 bg-cream/50 py-3 pe-4 ps-5">
      <p className="flex items-baseline gap-2.5" role="status" aria-live="polite">
        <span className="font-display text-[24px] italic leading-none text-ink">{total}</span>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted">
          référence{total > 1 ? "s" : ""}
        </span>
      </p>
      <label className="flex min-h-11 items-center gap-2.5 border border-ink/15 bg-paper px-3.5">
        <SortIcon size={14} className="shrink-0 text-muted-2" />
        <span className="sr-only">Trier par</span>
        <select
          value={active}
          onChange={(e) => f.set("sort", e.target.value === "featured" ? null : e.target.value)}
          className="max-w-44 truncate bg-transparent py-2.5 pe-1 text-[12.5px] text-ink focus:outline-none"
          aria-label="Trier par"
        >
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.l}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
