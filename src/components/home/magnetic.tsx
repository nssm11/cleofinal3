"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";

/**
 * HM · MAGNETIC — a tactile whisper for major CTAs.
 *
 * The child drifts 2–6 px toward the pointer and settles back on leave.
 * Touch hardware and `prefers-reduced-motion` get the plain child: stillness
 * is also a luxury.
 */
export function Magnetic({
  children,
  strength = 5,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [o, setO] = useState({ x: 0, y: 0 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      animate={{ x: o.x, y: o.y }}
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.6 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        setO({ x: x * strength, y: y * strength });
      }}
      onMouseLeave={() => setO({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  );
}
