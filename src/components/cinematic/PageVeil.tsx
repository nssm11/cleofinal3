"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   LE RIDEAU — the house never blanks the screen, it changes scene.
   ──────────────────────────────────────────────────────────────────────────
   Every route change raises an obsidian panel from the bottom edge of the
   viewport with the house mark on it, and drops it away again the moment the
   new page has painted. Two movements, one wordmark, no white flash.

   The veil is decorative and non-blocking: it never traps focus, sits below
   every overlay, and disappears entirely under `prefers-reduced-motion`.
   ══════════════════════════════════════════════════════════════════════════ */

const HOLD_MS = 620;

export function PageVeil({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [veiled, setVeiled] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    setVeiled(true);
    const done = window.setTimeout(() => setVeiled(false), HOLD_MS);
    return () => window.clearTimeout(done);
  }, [pathname, reduce]);

  return (
    <>
      {children}
      <AnimatePresence>
        {veiled && (
          <motion.div
            key={pathname}
            aria-hidden
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-obsidian"
          >
            <div className="night-field opacity-70" />
            <motion.span
              initial={{ opacity: 0, letterSpacing: "0.6em" }}
              animate={{ opacity: 1, letterSpacing: "0.06em" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="relative font-display text-[clamp(1.4rem,4vw,2.6rem)] text-alabaster"
            >
              Cléopâtre
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
