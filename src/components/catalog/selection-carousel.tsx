"use client";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProductCard } from "./product-card";
import type { ProductCard as PC } from "@/lib/catalog";
import { ArrowRightIcon } from "@/components/icons";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * LA SÉLECTION TOURNANTE — the counter advice, one group at a time.
 *
 * Twelve references arrive from the server and are dealt into groups of four.
 * One group holds the stage for a minute, then yields to the next with a calm
 * lateral slide — the same gesture as turning a page. The house tempo governs
 * everything: EASE_LUXE, D.base, hairline indicators rather than chrome.
 *
 * Etiquette:
 *   • rotation pauses while the pointer or the keyboard is inside the section;
 *   • `prefers-reduced-motion` disables both the auto-rotation and the travel
 *     — the groups remain reachable by hand;
 *   • dots and arrows are real buttons, announced for screen readers.
 */

const PER_SLIDE = 4;
const ROTATE_MS = 60_000;

/* Function variants keyed on `custom` (the direction of travel), so an
   exiting group always leaves the way the incoming one arrived from. */
const slideVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -36 }),
};

export function SelectionCarousel({ items, isAuthed = false }: { items: PC[]; isAuthed?: boolean }) {
  const slides: PC[][] = [];
  for (let i = 0; i < items.length; i += PER_SLIDE) slides.push(items.slice(i, i + PER_SLIDE));
  const n = slides.length;

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const go = useCallback(
    (next: number, d: number) => {
      setDir(d);
      setIndex(((next % n) + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (paused || reduce || n < 2) return;
    const t = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % n);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, reduce, n]);

  if (!n) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-x-clip">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={index}
            custom={dir}
            variants={reduce ? undefined : slideVariants}
            initial={reduce ? false : "enter"}
            animate="center"
            exit={reduce ? undefined : "exit"}
            transition={{ duration: reduce ? 0 : D.base, ease: EASE_LUXE }}
            className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7"
          >
            {slides[index].map((p, i) => (
              <ProductCard key={p.id} p={p} isAuthed={isAuthed} priority={index === 0 && i < 2} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {n > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 lg:mt-12">
          <div className="flex items-center gap-2.5" role="tablist" aria-label="Groupes de la sélection">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Groupe ${i + 1} sur ${n}`}
                onClick={() => go(i, i > index ? 1 : -1)}
                className={`relative flex h-6 w-10 items-center transition-colors duration-500 ${
                  i === index ? "text-ink" : "text-ink/20 hover:text-ink/50"
                }`}
              >
                <span aria-hidden className="absolute inset-x-0 h-px bg-current" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <span className="font-display text-[12px] italic tabular-nums text-muted">
              {String(index + 1).padStart(2, "0")} <span className="text-muted-2">/ {String(n).padStart(2, "0")}</span>
            </span>
            <span className="flex">
              <button
                type="button"
                aria-label="Groupe précédent"
                onClick={() => go(index - 1, -1)}
                className="flex h-10 w-10 items-center justify-center border border-stone-2/50 text-charcoal transition-colors duration-300 hover:border-ink hover:text-ink"
              >
                <ArrowRightIcon size={14} className="rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Groupe suivant"
                onClick={() => go(index + 1, 1)}
                className="-ml-px flex h-10 w-10 items-center justify-center border border-stone-2/50 text-charcoal transition-colors duration-300 hover:border-ink hover:text-ink"
              >
                <ArrowRightIcon size={14} />
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
