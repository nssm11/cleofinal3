"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { EASE } from "@/components/kit/motion";

/* ══════════════════════════════════════════════════════════════════════════
   LE CHANGEMENT DE SCÈNE — navigation as a wipe.

   Pages do not dissolve in this house; they are changed like sheets. A ruled
   bar of ink crosses the top of the viewport while the new page installs
   itself with a short clip from below. Half a second, no longer, and never
   under reduced motion — where the page simply is.
   ══════════════════════════════════════════════════════════════════════════ */

export function PageVeil({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [key, setKey] = useState(pathname);

  // A new sheet: reset the key so the wipe replays, and bring the page to the
  // top unless the navigation was an in-page anchor.
  useEffect(() => {
    setKey(pathname);
  }, [pathname]);

  if (reduce) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        <motion.span
          key={key}
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0], x: ["0%", "0%", "100%"] }}
          transition={{ duration: 0.72, ease: EASE, times: [0, 0.42, 1] }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[45] block h-[3px] origin-left bg-iodine"
        />
      </AnimatePresence>
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {children}
      </motion.div>
    </>
  );
}
