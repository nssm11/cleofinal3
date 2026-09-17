"use client";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * THE GROUND — the printed sheet the house writes on.
 *
 * Three layers, all decorative, none of them in the accessibility tree, none
 * of them coloured:
 *   1. The dispensary grid — hairline rule work at 3 rem, like graph paper.
 *   2. A printed frame and a pair of registration corners.
 *   3. Fine grain, so the surface reads as paper rather than as a screen.
 *
 * There is deliberately no wash, no bloom and no light that follows the
 * pointer: a préparatoire sheet, not a screen saver.
 */
export function Atmosphere({
  rules = true,
  ground = true,
  grain = true,
  className = "",
  tone = "ivory",
}: {
  rules?: boolean;
  ground?: boolean;
  grain?: boolean;
  className?: string;
  tone?: "ivory" | "noir";
}) {
  const dark = tone === "noir";
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {ground && <div className="dispensary absolute inset-0" />}
      {rules && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, ${
              dark
                ? "color-mix(in oklab, var(--color-chalk) 8%, transparent)"
                : "color-mix(in oklab, var(--color-line-strong) 42%, transparent)"
            } 0 1px, transparent 1px 25%)`,
          }}
        />
      )}
      {grain && <div className="grain absolute inset-0" />}
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
