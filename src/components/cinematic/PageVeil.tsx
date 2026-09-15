"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * PageVeil — the change of scene.
 *
 * Pages never cut: the frame that leaves falls away a half-second earlier
 * than the one that arrives, so navigation reads as a dissolve — the same
 * grammar as the film itself. Reduced motion gets an instant cut.
 */
function Veil({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // Note: this wrapper is deliberately NOT inside a Suspense boundary — a
  // redirect thrown by a child layout (the account pages) must bubble out as
  // a real 307, not be absorbed into a client-side flight redirect.

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function PageVeil({ children }: { children: ReactNode }) {
  return <Veil>{children}</Veil>;
}
