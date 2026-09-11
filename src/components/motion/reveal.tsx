"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { EASE_LUXE, D } from "@/lib/motion";
import { isOnScreen } from "@/lib/visible";

/* ══════════════════════════════════════════════════════════════════════════
   ARRIVÉE — the house's entrance system, built to fail open.

   Every block on this site starts life invisible and is brought in by script.
   That is the intended theatre, and it is also a liability: a reveal that does
   not fire leaves a hole in the page. So the entrance is now driven by two
   independent triggers, and the *first* one to fire wins.

     1 · INTERSECTION — an observer watching the block, primed to start a
         little before the block actually reaches the viewport, so a fast
         scroll never catches the page empty.
     2 · GEOMETRY — a shared, rAF-throttled check of the block's own rectangle
         against the viewport. No observer, no thresholds, no library code:
         if the block is on screen, it is shown.

   Reveals are still one-shot and still transform/opacity only. What changed is
   that "hidden" is now a state the page can always leave, never a state it can
   get stuck in. `@media (scripting: none)` in globals.css covers the case where
   no script runs at all.
   ══════════════════════════════════════════════════════════════════════════ */

/** `rootMargin`, in the four-value shape the observer expects. */
type ViewMargin = string;

/** Start a touch before the block arrives, so scrolling never outruns it. */
const PRE_TRIGGER: ViewMargin = "0px 0px 6% 0px";

type Check = () => void;
const watchers = new Set<Check>();
let frame = 0;
let bound = false;

function sweep() {
  frame = 0;
  for (const check of Array.from(watchers)) check();
}

function schedule() {
  if (!frame && typeof window !== "undefined") frame = window.requestAnimationFrame(sweep);
}

function subscribe(check: Check): () => void {
  if (typeof window === "undefined") return () => {};
  if (!bound) {
    bound = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
  }
  watchers.add(check);
  return () => {
    watchers.delete(check);
  };
}

/**
 * Trigger 1 — intersection, observed and owned by us.
 *
 * Written by hand so that a missing IntersectionObserver is a non-event rather
 * than an exception: `useInView` from the animation library throws when the
 * constructor is undefined, and a throw inside render takes the whole page
 * with it. Here the observer simply is not created, and the geometric check
 * below carries the reveal on its own.
 */
function useIntersection(
  ref: RefObject<HTMLElement | null>,
  amount: number | "some",
  margin: ViewMargin,
  active: boolean,
): boolean {
  const [hit, setHit] = useState(false);

  useEffect(() => {
    if (!active || hit) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const need = typeof amount === "number" ? amount : 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= need) {
            setHit(true);
            break;
          }
        }
      },
      { rootMargin: margin, threshold: typeof amount === "number" ? [0, amount] : 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, amount, hit, margin, ref]);

  return hit;
}

function useArrival(
  amount: number | "some",
  margin: ViewMargin,
  active: boolean,
): { ref: RefObject<HTMLDivElement | null>; shown: boolean } {
  const ref = useRef<HTMLDivElement | null>(null);
  const observed = useIntersection(ref, amount, margin, active);
  const [measured, setMeasured] = useState(false);
  const shown = observed || measured;

  useEffect(() => {
    if (!active || shown) return;
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (isOnScreen(el.getBoundingClientRect(), vh)) setMeasured(true);
    };
    const unsubscribe = subscribe(check);
    check();

    // A block that is on screen is never allowed to stay hidden, whatever the
    // observers think. This is the last word.
    const deadline = window.setTimeout(check, 1500);
    return () => {
      unsubscribe();
      window.clearTimeout(deadline);
    };
  }, [active, shown]);

  return { ref, shown };
}

/* ── ARRIVE ─────────────────────────────────────────────────────────────── */

/** The default entrance for anything that is not display typography. */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 20,
  as = "div",
  amount = 0.18,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  as?: "div" | "section" | "li" | "span" | "p" | "h1" | "h2" | "article" | "header";
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useArrival(amount, PRE_TRIGGER, !reduce);
  const M = motion[as] as typeof motion.div;
  const hidden = { opacity: 0, y };
  const visible = { opacity: 1, y: 0 };

  return (
    <M
      ref={ref}
      data-reveal=""
      initial={reduce ? false : hidden}
      animate={reduce ? undefined : shown ? visible : hidden}
      transition={{ duration: D.slow, ease: EASE_LUXE, delay }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </M>
  );
}

/* ── THE CHOREOGRAPHY ───────────────────────────────────────────────────── */

/** Container that hands each child one beat of the choreography. */
export function Stagger({
  children,
  className,
  step = 0.07,
  first = 0.04,
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  first?: number;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useArrival(amount, PRE_TRIGGER, !reduce);

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      initial={reduce ? false : "hidden"}
      animate={reduce ? undefined : shown ? "show" : "hidden"}
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: first } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 18 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      data-reveal=""
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: D.slow, ease: EASE_LUXE } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── MASK-LINE ──────────────────────────────────────────────────────────── */

/**
 * Display typography wiping up from behind its own baseline.
 *
 * This is the house signature for headlines. Each line is wrapped in an
 * overflow-hidden shell so the type appears to be *printed* onto the page.
 */
export function MaskLine({
  children,
  delay = 0,
  className,
  lineClassName,
  immediate = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  lineClassName?: string;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useArrival(0.3, PRE_TRIGGER, !reduce && !immediate);
  const hidden = { y: "112%", opacity: 0.4 };
  const visible = { y: "0%", opacity: 1 };

  return (
    <span className={`block overflow-hidden pb-[0.08em] ${lineClassName ?? ""}`}>
      <motion.span
        data-reveal=""
        ref={immediate ? undefined : ref}
        className={`block ${className ?? ""}`}
        initial={reduce ? false : hidden}
        animate={reduce ? undefined : immediate ? visible : shown ? visible : hidden}
        transition={{ duration: D.grand, ease: EASE_LUXE, delay }}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ── REVEAL CURTAIN ─────────────────────────────────────────────────────── */

/**
 * An image or plate that unveils itself as it enters. The inner element travels
 * while the frame stays put, so the photograph appears to develop rather than
 * to slide.
 */
export function Curtain({
  children,
  className,
  delay = 0,
  from = "bottom",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const reduce = useReducedMotion();
  // Any intersection will do: a plate taller than the viewport can never be
  // "30% visible" on a short screen, and a reveal that cannot fire is a hole.
  const { ref, shown } = useArrival("some", PRE_TRIGGER, !reduce);
  const hidden = from === "left" ? "inset(0 100% 0 0)" : from === "right" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
  const visible = "inset(0% 0% 0% 0%)";

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      className={className}
      initial={reduce ? false : { clipPath: hidden, opacity: 0.6 }}
      animate={reduce ? undefined : shown ? { clipPath: visible, opacity: 1 } : { clipPath: hidden, opacity: 0.6 }}
      transition={{ duration: D.grand, ease: EASE_LUXE, delay }}
      style={{ willChange: "clip-path, opacity" }}
    >
      {children}
    </motion.div>
  );
}
