"use client";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { pageTransition } from "@/lib/admin/motion";

/**
 * Page change.
 *
 * No white flash, no zoom, no blur: the canvas stays, the work slides in by a
 * few pixels and the eye never loses the spine. Reduced-motion renders the
 * page plainly, still instant.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div key={pathname} {...pageTransition} className="min-w-0">
      {children}
    </motion.div>
  );
}
