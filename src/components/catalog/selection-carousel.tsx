"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
 * lateral slide — the same gesture as turning a page. A hairline under the
 * plates draws itself across the minute, so the rotation is something the
 * visitor can see coming rather than something that happens to them.
 *
 * Etiquette:
 *   • the clock is a wall-clock deadline, so hovering or tabbing in freezes the
 *     countdown exactly where the hairline froze, and leaving resumes it there;
 *   • `prefers-reduced-motion` disables both the rotation and the travel — the
 *     groups remain reachable by hand;
 *   • dots, arrows, arrow keys and a swipe all turn the page;
 *   • the current group is announced politely, never shouted.
 */

const PER_SLIDE = 4;
const ROTATE_MS = 60_000;
/** The clock is polled, not fired: a poll can be frozen and resumed cleanly. */
const TICK_MS = 250;
/** A swipe shorter than this is a tap, not a request to turn the page. */
const SWIPE_PX = 44;

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
  /* Bumped on every turn of the page: it remounts the hairline, which is what
     restarts its sweep from the left. */
  const [cycle, setCycle] = useState(0);
  const reduce = useReducedMotion();
  const touchX = useRef<number | null>(null);

  /* The minute, kept as an instant rather than as a counter, so that pausing
     costs nothing and resuming needs no correction. */
  const deadline = useRef(0);
  const left = useRef(ROTATE_MS);

  const go = useCallback(
    (next: number, d: number) => {
      setDir(d);
      setIndex(((next % n) + n) % n);
      left.current = ROTATE_MS;
      deadline.current = Date.now() + ROTATE_MS;
      setCycle((c) => c + 1);
    },
    [n],
  );

  useEffect(() => {
    if (paused || reduce || n < 2) return;
    deadline.current = Date.now() + left.current;
    const t = setInterval(() => {
      if (Date.now() < deadline.current) return;
      left.current = ROTATE_MS;
      deadline.current = Date.now() + ROTATE_MS;
      setDir(1);
      setIndex((i) => (i + 1) % n);
      setCycle((c) => c + 1);
    }, TICK_MS);
    return () => {
      left.current = Math.max(0, deadline.current - Date.now());
      clearInterval(t);
    };
  }, [paused, reduce, n]);

  if (!n) return null;

  const rotating = n > 1 && !reduce;

  return (
    <div
      role="group"
      aria-roledescription="carrousel"
      aria-label="La sélection du comptoir"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const from = touchX.current;
        touchX.current = null;
        if (from == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? from) - from;
        if (Math.abs(dx) < SWIPE_PX) return;
        go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }}
      onKeyDown={(e) => {
        if (n < 2) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1, 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1, -1);
        }
      }}
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
            className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7"
          >
            {slides[index].map((p, i) => (
              <ProductCard key={p.id} p={p} isAuthed={isAuthed} priority={index === 0 && i < 2} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {n > 1 && (
        <div className="mt-9 lg:mt-10">
          {/* The minute, drawn as a hairline that fills itself. */}
          <span aria-hidden className="relative mb-6 block h-px w-full bg-stone-2/40">
            {rotating && (
              <span
                key={cycle}
                className="absolute inset-y-0 left-0 w-full origin-left bg-champagne-2"
                style={{
                  animation: `selection-sweep ${ROTATE_MS}ms linear forwards`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            )}
          </span>

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex items-center gap-2.5" role="group" aria-label="Groupes de la sélection">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={i === index ? "true" : undefined}
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
                Groupe {String(index + 1).padStart(2, "0")}{" "}
                <span className="text-muted-2">/ {String(n).padStart(2, "0")}</span>
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

          <p role="status" aria-live="polite" className="sr-only">
            Groupe {index + 1} sur {n} — {slides[index].map((p) => p.name).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
