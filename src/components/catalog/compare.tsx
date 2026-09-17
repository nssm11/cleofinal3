"use client";
import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CompareIcon, CloseIcon } from "@/components/icons";
import { clearCompare, EMPTY_COMPARE, getCompare, removeCompare, subscribe, toggleCompare, type CompareItem } from "@/lib/compare";
import { useLocale } from "@/lib/i18n/client";
import {D} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { cn } from "@/lib/utils";

/**
 * THE COMPARATOR UI (P01) — a quiet toggle under each name, a tray that
 * gathers up to three, one page where they face each other. Everything lives
 * in localStorage: comparing is a thought, not an event.
 */
export function useCompare(): { items: CompareItem[]; toggle: (i: CompareItem) => void; clear: () => void; remove: (id: number) => void } {
  // getCompare is cached by the raw storage string, so the reference stays
  // stable between renders whenever nothing changed — exactly what
  // useSyncExternalStore demands.
  const items = useSyncExternalStore(subscribe, getCompare, () => EMPTY_COMPARE);
  const toggle = useCallback((i: CompareItem) => toggleCompare(i), []);
  const clear = useCallback(() => clearCompare(), []);
  const remove = useCallback((id: number) => removeCompare(id), []);
  return { items, toggle, clear, remove };
}

/** The small “Comparer” line under a product’s name. */
export function CompareToggle({ item, className, compact = false }: { item: CompareItem; className?: string; compact?: boolean }) {
  const { items, toggle } = useCompare();
  const { copy } = useLocale();
  const m = copy.merch;
  const on = items.some((x) => x.id === item.id);
  const atCap = items.length >= 3;
  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={on}
      disabled={!on && atCap}
      title={!on && atCap ? m.compareFull : undefined}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300",
        on ? "text-iodine" : "text-faint hover:text-carbon",
        !on && atCap && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <CompareIcon size={13} />
      {compact ? null : on ? m.compareAdded : m.compare}
    </button>
  );
}

/** The floating tray — bottom-centre, on every page, only when loaded. */
export function CompareTray() {
  const { items, clear } = useCompare();
  const { copy } = useLocale();
  const m = copy.merch;
  const reduce = useReducedMotion();
  const q = items.map((i) => i.id).join(",");
  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={reduce ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0, transition: { duration: D.fast, ease: EASE } }}
          transition={{ duration: D.base, ease: EASE }}
          className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-4"
        >
          <div className="flex items-center gap-2 border border-line-strong/60 bg-canvas/95 py-2 pl-4 pr-2 shadow-[0_18px_44px_-24px_rgba(33,28,18,0.45)] backdrop-blur-sm">
            <ul className="hidden max-w-[46vw] items-center gap-3 sm:flex" aria-label={m.compareTitle}>
              {items.map((i) => (
                <li key={i.id} className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-steel">
                  <span className="max-w-[16ch] truncate">{i.name}</span>
                  <button onClick={() => removeCompare(i.id)} aria-label={`${m.compareRemove} — ${i.name}`} className="text-faint transition-colors hover:text-carbon">
                    <CloseIcon size={11} />
                  </button>
                </li>
              ))}
            </ul>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-carbon sm:ml-1">
              {m.compareTray.replace("{n}", String(items.length))}
            </span>
            <Link href={`/comparer?p=${q}`} className={cn("min-h-10 bg-carbon px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-chalk transition-colors hover:bg-iodine", items.length < 2 && "pointer-events-none opacity-40")}>
              {m.compareGo}
            </Link>
            <button onClick={clear} className="min-h-10 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-carbon">
              {m.compareClear}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
