"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE, D } from "@/lib/motion";
import { useLocale } from "@/lib/i18n/client";

/**
 * LE FIL — the four facts of the house, read as one continuous line.
 *
 * At rest it is a full-width editorial band on the ivory ground. Once the
 * visitor starts reading downwards it withdraws entirely, because a returning
 * customer does not need to be told the delivery terms twice.
 */
export function AnnouncementStrip({ collapsed }: { collapsed: boolean }) {
  const reduce = useReducedMotion();
  const { copy } = useLocale();
  const FACTS = copy.facts;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (collapsed || reduce) return;
    // Only the small viewports rotate: on desktop all four facts fit at once.
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % FACTS.length), 4200);
    return () => clearInterval(id);
  }, [collapsed, reduce, FACTS.length]);

  return (
    <motion.div
      aria-hidden={collapsed || undefined}
      initial={false}
      animate={{ height: collapsed ? 0 : undefined, opacity: collapsed ? 0 : 1 }}
      transition={{ duration: D.base, ease: EASE_LUXE }}
      className="relative overflow-hidden border-b border-stone/60 bg-cream/70"
    >
      <div className="container-lux hidden items-center justify-between gap-6 py-2.5 lg:flex">
        {FACTS.map((f, i) => (
          <span key={f} className="eyebrow flex items-center gap-3 text-muted">
            <span className="inline-block h-px w-4 bg-champagne/60" aria-hidden />
            {f}
            {i === FACTS.length - 1 ? null : <span className="sr-only">·</span>}
          </span>
        ))}
      </div>
      <div className="relative flex h-9 items-center justify-center lg:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={index}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.42, ease: EASE_LUXE }}
            className="eyebrow absolute text-muted"
          >
            {FACTS[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** The wordmark, used at three sizes: entrance, floating bar, footer. */
export function Wordmark({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const scale = size === "lg" ? "text-[27px] lg:text-[32px]" : size === "md" ? "text-[22px] lg:text-[24px]" : "text-[18px]";
  return (
    <Link
      href="/"
      aria-label="Cléopâtre"
      className={`group inline-flex items-baseline gap-2.5 ${light ? "text-paper" : "text-ink"}`}
    >
      <span
        aria-hidden
        className={`font-display font-light leading-none ${scale} tracking-[0.01em] transition-colors duration-500 group-hover:text-champagne-2`}
      >
        Cléopâtre
      </span>
      <span
        className={`hidden text-[8px] font-bold uppercase tracking-[0.34em] transition-colors sm:inline ${
          light ? "text-paper/45" : "text-muted-2"
        }`}
      >
        Espace Santé Beauté
      </span>
    </Link>
  );
}
