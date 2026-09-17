"use client";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   LA PIÈCE — la lumière de la maison.
   ──────────────────────────────────────────────────────────────────────────
   The background of every room, in four decorative layers:

     1. the field — a mesh of porcelain, bone and one warm cinabre breath;
     2. the ruling — vertical hairlines at 8.3333 %, the house's graticule;
     3. the light — a soft halo that follows the pointer, heavily damped,
        mounted only on hardware that actually has a pointer;
     4. the grain — four percent of noise, so the surface reads as material
        rather than as a screen.

   Nothing here is interactive, nothing is in the accessibility tree, and with
   reduced motion the halo is not mounted at all.
   ══════════════════════════════════════════════════════════════════════════ */

export function Room({
  ribs = true,
  halo = true,
  field = true,
  className = "",
  tone = "light",
}: {
  ribs?: boolean;
  halo?: boolean;
  field?: boolean;
  className?: string;
  tone?: "light" | "night";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.42);
  const my = useMotionValue(0.28);
  const x = useSpring(mx, { stiffness: 42, damping: 22, mass: 1.1 });
  const y = useSpring(my, { stiffness: 42, damping: 22, mass: 1.1 });

  useEffect(() => {
    if (reduce || !halo) return;
    if (typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        mx.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
        my.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce, halo, mx, my]);

  const left = useTransform(x, (v) => `${(v * 100).toFixed(2)}%`);
  const top = useTransform(y, (v) => `${(v * 100).toFixed(2)}%`);
  const night = tone === "night";
  const shown = reduce ? 0.5 : 1;

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {field && (
        <div
          className={night ? "night-field" : "light-field"}
          style={{
            backgroundImage: night
              ? "radial-gradient(80% 60% at 82% 4%, rgba(217,58,16,0.16), transparent 62%), radial-gradient(70% 70% at 6% 96%, rgba(255,122,74,0.09), transparent 60%)"
              : "radial-gradient(70% 55% at 88% 2%, rgba(217,58,16,0.075), transparent 62%), radial-gradient(60% 60% at 4% 92%, rgba(31,79,143,0.05), transparent 60%)",
          }}
        />
      )}
      {ribs && <div className="graticule absolute inset-0" />}
      {halo && !reduce && (
        <motion.div
          className="absolute"
          style={{
            left,
            top,
            width: "min(74vw, 900px)",
            height: "min(74vw, 900px)",
            x: "-50%",
            y: "-50%",
            background: night
              ? "radial-gradient(circle, rgba(217,58,16,0.20), rgba(217,58,16,0.06) 42%, transparent 70%)"
              : "radial-gradient(circle, rgba(217,58,16,0.10), rgba(232,230,225,0.30) 44%, transparent 72%)",
            filter: "blur(56px)",
            willChange: "transform",
            opacity: shown,
          }}
        />
      )}
      <div className="grain absolute inset-0" />
    </div>
  );
}
