"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_LUXE, D } from "@/lib/motion";

/**
 * VISAGE REVEAL — the chapter's own arrival verb.
 *
 * The house grammar (transform + opacity only, calm on approach) is kept
 * verbatim; what Visage adds is a slightly slower, lower travel so the room
 * settles rather than slides. Fail-open by design: without script, or under
 * reduced motion, everything is simply its finished self.
 */

function useArrived<T extends HTMLElement>(amount = 0.12): { ref: React.RefObject<T | null>; hit: boolean } {
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

/** A whole block quieting upward — the chapter's default entrance. */
export function Rise({
  children,
  delay = 0,
  className,
  y = 18,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const { ref, hit } = useArrived<HTMLDivElement>();
  return (
    <motion.div
      ref={ref}
      data-reveal=""
      initial={reduce ? false : { opacity: 0, y }}
      animate={reduce ? undefined : hit ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: D.slow, ease: EASE_LUXE, delay }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
