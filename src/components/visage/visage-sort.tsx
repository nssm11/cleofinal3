"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, SortIcon } from "@/components/icons";
import { useFilterParams } from "@/components/catalog/filters";
import { EASE_LUXE, D } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * VisageSort — the order of the shelf, chosen like a word not a widget.
 *
 * The house hides sorting inside a bare <select> in the sort bar. Here the
 * current order is spelled out in the toolbar — "Notre sélection" — and the
 * click opens a small ledger of orders, each with its one-line explanation.
 * Same query contract as the rest of the page: ?sort=…, no page reset.
 */

export type SortOption = { v: string; l: string; d: string };

export function VisageSort({ options }: { options: SortOption[] }) {
  const f = useFilterParams();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const active = f.sp.get("sort") ?? "featured";
  const current = options.find((o) => o.v === active) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-sort]") ?? []);
        if (!items.length) return;
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        const n = e.key === "ArrowDown" ? (i + 1 + items.length) % items.length : (i - 1 + items.length) % items.length;
        items[Math.max(0, i) === -1 ? 0 : n]?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const pick = (v: string) => {
    f.set("sort", v === "featured" ? null : v);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex min-h-11 items-center gap-2 px-1 text-left text-[11px] transition-colors duration-300",
          open ? "text-ink" : "text-charcoal hover:text-ink",
        )}
      >
        <SortIcon size={13} className="shrink-0 text-muted-2 transition-colors group-hover:text-champagne-2" />
        <span className="min-w-0 whitespace-nowrap">
          <span className="uppercase tracking-[0.16em] text-muted-2">Tri</span>
          <span className="font-bold uppercase tracking-[0.08em]">
            <span aria-hidden className="hidden sm:inline"> — {current.l}</span>
            <span className="sr-only sm:hidden">{current.l}</span>
          </span>
        </span>
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: D.fast, ease: EASE_LUXE }}
          className="text-[9px] text-muted-2"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-label="Ordre du rayon"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: D.fast, ease: EASE_LUXE }}
            className="absolute right-0 z-40 mt-2 w-[min(21rem,calc(100vw-2rem))] border border-stone-2/50 bg-paper py-1.5 shadow-float"
          >
            {options.map((o) => {
              const on = o.v === active;
              return (
                <li key={o.v}>
                  <button
                    data-sort
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(o.v)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3.5 py-2 text-left transition-colors",
                      on ? "bg-champagne-soft/70" : "hover:bg-cream",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center border",
                        on ? "border-ink bg-ink text-paper" : "border-stone-2/80 text-transparent",
                      )}
                    >
                      <CheckIcon size={10} strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-[12.5px]", on ? "text-ink" : "text-charcoal")}>{o.l}</span>
                      <span className="block text-[11px] leading-snug text-muted-2">{o.d}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
