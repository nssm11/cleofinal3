"use client";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * THE ROOM — the living background of the house.
 *
 * Four layers, all decorative, all pointer-free on touch devices:
 *   1. A marble veil of champagne and cream (very slow CSS drift).
 *   2. Architectural ribs — vertical hairlines at 25 % intervals.
 *   3. A radial light that follows the pointer at a heavily damped rate.
 *   4. Fine grain, so the surface reads as material rather than as a screen.
 *
 * Nothing here is interactive and nothing is in the accessibility tree.
 */
export function Atmosphere({
  ribs = true,
  halo = true,
  veil = true,
  className = "",
  tone = "ivory",
}: {
  ribs?: boolean;
  halo?: boolean;
  veil?: boolean;
  className?: string;
  tone?: "ivory" | "noir";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.35);
  const x = useSpring(mx, { stiffness: 42, damping: 22, mass: 1.1 });
  const y = useSpring(my, { stiffness: 42, damping: 22, mass: 1.1 });

  useEffect(() => {
    if (reduce || !halo) return;
    // Pointer lights are meaningless on touch hardware and cost a listener.
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
  const dark = tone === "noir";

  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {veil && (
        <div
          className="marble-veil"
          style={{
            animation: reduce ? undefined : "veil-drift 96s ease-in-out infinite",
            opacity: dark ? 0.3 : 0.62,
          }}
        />
      )}
      {ribs && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, ${
              dark ? "rgba(203,176,120,0.075)" : "rgba(150,135,94,0.11)"
            } 0 1px, transparent 1px 25%)`,
          }}
        />
      )}
      {halo && !reduce && (
        <motion.div
          className="absolute"
          style={{
            left,
            top,
            width: "min(78vw, 980px)",
            height: "min(78vw, 980px)",
            x: "-50%",
            y: "-50%",
            background: dark
              ? "radial-gradient(circle, rgba(203,176,120,0.16), rgba(203,176,120,0.05) 42%, transparent 70%)"
              : "radial-gradient(circle, rgba(203,176,120,0.22), rgba(238,226,201,0.14) 40%, transparent 70%)",
            filter: "blur(48px)",
            willChange: "transform",
          }}
        />
      )}
      <div className="grain absolute inset-0" />
    </div>
  );
}

/**
 * PARALLAX — depth for a composition.
 *
 * Two independent drivers:
 *   · `pointer` — a few pixels of counter-movement, damped heavily.
 *   · `scroll`  — a fraction of the page travel, applied on enter and exit
 *                 so layers separate without ever hijacking the scrollbar.
 *
 * Only `transform` is written, and only inside a rAF tick.
 */
export function Parallax({
  children,
  className,
  depth = 12,
  scroll = 0,
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  /** Pointer travel in px. 0 disables pointer response. */
  depth?: number;
  /** Scroll travel as a fraction of viewport height. 0 disables. */
  scroll?: number;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useMotionValue(0);
  const sy = useMotionValue(0);
  const dx = useSpring(px, { stiffness: 48, damping: 20, mass: 1 });
  const dy = useSpring(py, { stiffness: 48, damping: 20, mass: 1 });
  const dsx = useSpring(sx, { stiffness: 90, damping: 26, mass: 1 });
  const dsy = useSpring(sy, { stiffness: 90, damping: 26, mass: 1 });

  useEffect(() => {
    if (reduce || disabled) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let frame = 0;

    const readScroll = () => {
      const el = ref.current;
      if (!el || !scroll) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // −1 → element fully below the fold, +1 → fully above it.
      const progress = ((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2));
      sy.set(-progress * scroll * vh * 0.5);
    };

    const onMove = (e: PointerEvent) => {
      if (!depth || !fine || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        px.set(nx * depth * 2);
        py.set(ny * depth * 2);
      });
    };

    // A scroll handler that only writes a motion value never re-renders React.
    let scrollFrame = 0;
    const onScroll = () => {
      if (!scroll || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        readScroll();
      });
    };

    readScroll();
    if (depth && fine) window.addEventListener("pointermove", onMove, { passive: true });
    if (scroll) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
    };
  }, [reduce, disabled, depth, scroll, px, py, sy]);

  const tx = useTransform<number, string>([dx, dsx], ([a, b]) => `${(a as number) + (b as number)}px`);
  const ty = useTransform<number, string>([dy, dsy], ([a, b]) => `${(a as number) + (b as number)}px`);

  if (reduce || disabled) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ x: tx, y: ty, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}
