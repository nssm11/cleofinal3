"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   THE MOTION KIT
   One grammar, five verbs, and a hard rule: animate transform and opacity
   only, reveal once, and never make anyone wait for an animation.

   · MASK     — a block uncovers itself, clipping upward like a printed sheet
   · STAGGER  — a list arrives in sequence, 60 ms apart, never longer
   · MARQUEE  — a continuous index of names or references
   · COUNTER  — a figure counts up once, when it is first seen
   · DRIFT    — a slow scroll-linked offset for layered compositions
   ══════════════════════════════════════════════════════════════════════════ */

/** Shared easing: fast out of the gate, long settle. */
export const EASE = [0.16, 1, 0.3, 1] as const;

function useOnce(amount = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    // Fail open: geometry is checked alongside the observer, so a block can
    // never be left invisible by a trigger that does not fire. Where no
    // IntersectionObserver exists at all, the geometry alone carries it.
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setShown(true);
            io?.disconnect();
          }
        },
        { threshold: [0, amount], rootMargin: "0px 0px -4% 0px" },
      );
      io.observe(el);
    }

    const check = () => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 0) * 0.96 && r.bottom > 0) setShown(true);
    };

    /**
     * One frame of grace before the first geometry read.
     *
     * The effect never sets state synchronously: doing so forces a second
     * render pass before the browser has painted the first one, which is what
     * made the reveals stutter on a slow handset. A block that is on screen is
     * revealed on the very next frame — the guarantee is unchanged.
     */
    let raf = requestAnimationFrame(check);
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", schedule);
    };
  }, [amount, shown]);

  return { ref, shown };
}

/**
 * MASK — the house's principal entrance. The block is clipped at the bottom
 * and opens upward; a small rise rides along with the clip.
 */
export function Mask({
  children,
  className,
  delay = 0,
  duration = 0.9,
  y = 22,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  /** Vertical travel of the content inside the mask. */
  y?: number;
  as?: "div" | "span";
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useOnce();
  const Tag = as === "span" ? motion.span : motion.div;
  return (
    <Tag
      ref={ref as never}
      data-reveal
      initial={false}
      animate={
        shown || reduce
          ? { clipPath: "inset(0 0 0 0)", opacity: 1, y: 0 }
          : { clipPath: "inset(0 0 100% 0)", opacity: 0, y }
      }
      transition={{ duration: reduce ? 0 : duration, ease: EASE, delay: reduce ? 0 : delay }}
      className={cn("will-change-[clip-path,opacity]", className)}
    >
      {children}
    </Tag>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: EASE } },
};

/** STAGGER — for a set of siblings that should read as one arrival. */
export function Stagger({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  const reduce = useReducedMotion();
  const { ref, shown } = useOnce(0.08);
  return (
    <motion.div
      id={id}
      ref={ref}
      data-reveal
      variants={staggerParent}
      initial={reduce ? false : "hidden"}
      animate={shown || reduce ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag data-reveal variants={staggerChild} className={className}>
      {children}
    </Tag>
  );
}

/**
 * MARQUEE — a continuous index. Used for laboratories, for references, for the
 * single line of house promises under a chapter title. Decorative by design:
 * the duplicate track is hidden from assistive technology.
 */
export function Marquee({
  items,
  className,
  slow = false,
  separator = "·",
}: {
  items: ReactNode[];
  className?: string;
  slow?: boolean;
  separator?: string;
}) {
  const track = (
    <div className={cn("marquee-track", slow && "marquee-slow")}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-12 whitespace-nowrap">
          {item}
          <span aria-hidden className="text-iodine">
            {separator}
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("marquee", className)}>
      {track}
      <div aria-hidden>{track}</div>
    </div>
  );
}

/** COUNTER — a figure that counts once. Purely additive: the final value is
 *  what is in the DOM when motion is reduced or scripting is off. */
export function Counter({
  value,
  className,
  suffix = "",
  duration = 1.1,
}: {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useOnce(0.3);
  const [n, setN] = useState(0);

  useEffect(() => {
    // Nothing to animate until the figure is on screen — and nothing at all
    // under reduced motion, where the final value is simply printed.
    if (!shown || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      // ease-out cubic: fast to the figure, then it settles
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, reduce, value, duration]);

  /**
   * What the DOM carries: the final figure until the count begins. A figure
   * that is never revealed — no script, no observer, or simply scrolled past
   * — still reads as its real value instead of a zero nobody asked for.
   */
  const figure = shown && !reduce ? n : value;

  return (
    <span ref={ref as never} data-reveal className={cn("data", className)}>
      {figure}
      {suffix}
    </span>
  );
}

/**
 * DRIFT — a scroll-linked offset for layered compositions. Small by default:
 * this is depth, not parallax theatre.
 */
export function Drift({
  children,
  className,
  distance = 40,
  start = "top bottom",
  end = "bottom top",
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  start?: string;
  end?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: [start as never, end as never] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 });
  const y = useTransform(smooth, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={reduce ? undefined : { y }} className="h-full">
        {children}
      </motion.div>
    </div>
  );
}

/** A horizontal rail that can be dragged on touch and stepped on desktop. */
export function RailScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={cn("scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2", className)}
    >
      {children}
    </div>
  );
}
