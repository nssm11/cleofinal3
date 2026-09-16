"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_LUXE, D } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * VISAGE REVEAL — the chapter's own arrival verbs.
 *
 * The house grammar (transform + opacity only, calm on approach) is kept
 * verbatim; what Visage adds is a *slower, mask-drawn* register so the
 * chapter reads as a measured sequence rather than a list of fades. Two
 * verbs, both fail-open: without script, or under reduced motion, everything
 * is simply its finished self.
 */

function useOnScreen<T extends HTMLElement>(amount = 0.14): { ref: React.RefObject<T | null>; hit: boolean } {
  const ref = useRef<T | null>(null);
  const [hit, setHit] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || hit) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setHit(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHit(true);
          io.disconnect();
        }
      },
      { threshold: amount, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount, hit]);
  return { ref, hit };
}

/** A whole block quieting upward — the chamber's default entrance. */
export function Rise({
  children,
  delay = 0,
  className,
  y = 18,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  as?: "div" | "section" | "p" | "li" | "span" | "header";
}) {
  const reduce = useReducedMotion();
  const { ref, hit } = useOnScreen<HTMLDivElement>();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      ref={ref}
      data-reveal=""
      initial={reduce ? false : { opacity: 0, y }}
      animate={reduce ? undefined : hit ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: D.slow, ease: EASE_LUXE, delay }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </M>
  );
}

/** Display type drawn up from behind a hairline of its own baseline. */
export function Drop({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { ref, hit } = useOnScreen<HTMLSpanElement>(0.25);
  return (
    <span className={cn("block overflow-hidden pb-[0.1em]", className)}>
      <motion.span
        ref={ref}
        data-reveal=""
        className="block"
        initial={reduce ? false : { y: "110%" }}
        animate={reduce ? undefined : hit ? { y: "0%" } : { y: "110%" }}
        transition={{ duration: D.grand, ease: EASE_LUXE, delay }}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** A gentle fade-and-settle for full compositions (the scene's second canvas). */
export function Settle({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { ref, hit } = useOnScreen<HTMLDivElement>(0.05);
  return (
    <motion.div
      ref={ref}
      data-reveal=""
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? undefined : hit ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: D.base, ease: EASE_LUXE, delay }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
