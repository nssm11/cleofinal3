"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloseIcon, FilterIcon, SortIcon } from "@/components/icons";
import { FilterPanel, useFilterParams, type Facets } from "@/components/catalog/filters";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { VISAGE_EDITION } from "./edition";

const SORTS: { v: string; l: string }[] = [
  { v: "featured", l: "Notre sélection" },
  { v: "bestsellers", l: "Les plus demandés" },
  { v: "newest", l: "Nouveautés" },
  { v: "price_asc", l: "Prix croissant" },
  { v: "price_desc", l: "Prix décroissant" },
  { v: "rating", l: "Mieux notés" },
];

/**
 * LE BORD — the filter system of the nocturne.
 *
 * No sidebar lives here. One thin dock across the shelf — the count, the
 * order, the word « Affiner » — and everything else hides behind it: a lit
 * study slides in from the right where the house's own filter panel does the
 * actual work, untouched. The URL remains the single memory of every choice.
 */
export function FilterDock({ facets, total }: { facets: Facets; total: number }) {
  const ed = VISAGE_EDITION.listing;
  const f = useFilterParams();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sort = (f.sp.get("sort") ?? "featured") as string;

  return (
    <>
      {/* The dock — count, order, refine. It sticks to the header's hem. */}
      <div
        className={cn(
          "sticky top-14 z-30 border-y border-cine-line bg-cine-noir/88 backdrop-blur-xl transition-opacity duration-300 lg:top-16",
          f.pending && "opacity-60",
        )}
      >
        <div className="container-wide flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3.5">
          <p className="flex items-baseline gap-2.5">
            <span className="font-display text-[20px] italic leading-none text-cine-ivory">{total}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cine-faint">
              {total > 1 ? ed.results : ed.result}
            </span>
          </p>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5">
              <SortIcon size={14} className="text-cine-faint" />
              <span className="sr-only">{ed.sortLabel}</span>
              <select
                value={sort}
                onChange={(e) => f.set("sort", e.target.value === "featured" ? null : e.target.value)}
                aria-label={ed.sortLabel}
                className="min-h-10 cursor-pointer appearance-none bg-transparent pr-1 text-[12px] uppercase tracking-[0.12em] text-cine-mist transition-colors hover:text-cine-ivory focus:outline-none [&>option]:bg-cine-noir [&>option]:text-cine-ivory"
              >
                {SORTS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "flex min-h-11 items-center gap-2.5 border px-4 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-all duration-300",
                f.activeCount > 0
                  ? "border-cine-gold/70 text-cine-gold hover:border-cine-gold"
                  : "border-cine-line text-cine-ivory hover:border-cine-gold/70 hover:text-cine-gold",
              )}
            >
              <FilterIcon size={13} />
              {ed.refine}
              {f.activeCount > 0 && (
                <span className="flex h-[17px] min-w-[17px] items-center justify-center bg-cine-gold px-1 text-[9px] tabular-nums text-cine-noir">
                  {f.activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* The choices already made — removable words, never hidden. */}
        {f.chips.length > 0 && (
          <div className="border-t border-cine-line/70">
            <div className="container-wide flex flex-wrap items-center gap-2 py-2.5">
              {f.chips.map((c) => (
                <button
                  key={`${c.key}-${c.value}`}
                  onClick={() =>
                    c.key === "price"
                      ? f.update((p) => {
                          p.delete("min");
                          p.delete("max");
                        })
                      : f.toggleMulti(c.key, c.value)
                  }
                  className="group inline-flex min-h-9 items-center gap-2 border border-cine-line px-3 text-[11px] capitalize text-cine-mist transition-colors duration-300 hover:border-cine-gold/60 hover:text-cine-ivory"
                >
                  {c.label}
                  <CloseIcon size={11} className="text-cine-faint transition-colors group-hover:text-cine-gold" />
                </button>
              ))}
              <button
                onClick={f.clearAll}
                className="ml-1 text-[11px] text-cine-faint underline decoration-cine-line underline-offset-4 transition-colors hover:text-cine-ivory"
              >
                Tout effacer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* The lit study — the house's own panel, behind a door of light. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="scrim"
              aria-label="Fermer les filtres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-cine-noir/65 backdrop-blur-sm"
            />
            <motion.div
              key="study"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Affiner la sélection"
              initial={reduce ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: 0.55, ease: EASE_LUXE }}
              className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[420px] flex-col bg-paper text-ink shadow-[0_0_90px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center justify-between border-b border-stone/60 px-6 py-4">
                <span className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-ink">
                  {ed.refine}
                  {f.activeCount > 0 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center bg-ink px-1 text-[9px] tabular-nums text-paper">
                      {f.activeCount}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
                >
                  <CloseIcon size={19} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4">
                <FilterPanel facets={facets} />
              </div>
              <div
                className="border-t border-stone/60 bg-cream/85 px-6 py-4 backdrop-blur-xl"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <button onClick={() => setOpen(false)} className="btn-primary w-full">
                  {ed.see.replace("{n}", String(total))}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
