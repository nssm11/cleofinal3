"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { D, EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   THE SETTLED NUMBER & THE QUIET METER — the account's two client motions.

   Both are one-shot, transform/opacity only, and honour reduced motion by
   simply landing on the final value. Nothing here loops.
   ══════════════════════════════════════════════════════════════════════════ */

/** A number that settles from zero when it arrives. Fraunces keeps it elegant. */
export function CountUp({
  value,
  className,
  duration = 0.9,
  locale = "fr-FR",
}: {
  value: number;
  className?: string;
  duration?: number;
  locale?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (reduce || started.current || !inView) return;
    started.current = true;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic, calm landing
      setN(value * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {Math.round(reduce ? value : n).toLocaleString(locale)}
    </span>
  );
}

/**
 * A meter of champagne — the fill grows from zero on arrival, then holds.
 * Used for the loyalty road to the next reward and similar quiet progress.
 */
export function MeterBar({
  value,
  max,
  className,
  trackClassName,
  delay = 0.2,
}: {
  value: number;
  max: number;
  className?: string;
  trackClassName?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  return (
    <div
      ref={ref}
      className={cn("relative h-[3px] w-full overflow-hidden rounded-full bg-rule-strong/40", trackClassName)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <motion.span
        initial={reduce ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: pct } : reduce ? { scaleX: pct } : { scaleX: 0 }}
        transition={{ duration: D.grand, ease: EASE_LUXE, delay: reduce ? 0 : delay }}
        className={cn(
          "absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-cinabre to-cinabre-2 ltr:origin-left rtl:origin-right",
          className,
        )}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
