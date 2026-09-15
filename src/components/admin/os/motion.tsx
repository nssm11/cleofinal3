"use client";
import { animate, motion, useInView, useReducedMotion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { listStagger, osFast, osMicro, osStandard, rowIn } from "@/lib/admin/motion";
import { makeFormat, type FormatSpec } from "./format";

/* ══════════════════════════════════════════════════════════════════════════
   MOUVEMENT — animated figures and lists
   ──────────────────────────────────────────────────────────────────────────
   Three rules the whole instrument obeys:
     1 · a figure that changes is *tweened*, never swapped;
     2 · a list enters with one small stagger, never a cascade;
     3 · `prefers-reduced-motion` keeps the meaning, drops the travel.
   ══════════════════════════════════════════════════════════════════════════ */

export function AnimatedNumber({
  value, format, spec, duration = 0.6, className, locale = "fr-TN",
}: { value: number; format?: (v: number) => string; spec?: FormatSpec; duration?: number; className?: string; locale?: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [prev, setPrev] = useState({ value, reduce });
  const fromRef = useRef(value);
  if (value !== prev.value || reduce !== prev.reduce) {
    setPrev({ value, reduce });
    if (reduce) setDisplay(value);
  }
  useEffect(() => {
    if (reduce) { fromRef.current = value; return; }
    const from = fromRef.current;
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => { fromRef.current = value; },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);
  const text = format ? format(display) : spec ? makeFormat(spec)(display) : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(display));
  return <span className={cn("os-num", className)} aria-live="off">{text}</span>;
}

/** A figure that settles into place when it scrolls into view. */
export function CountOnView({ value, format, spec, className, fallback = "0" }: { value: number; format?: (v: number) => string; spec?: FormatSpec; className?: string; fallback?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  return (
    <span ref={ref} className={cn("os-num", className)}>
      {inView ? <AnimatedNumber value={value} format={format} spec={spec} duration={reduce ? 0 : 0.75} /> : <span className="opacity-0">{fallback}</span>}
    </span>
  );
}

export function Reveal({ children, delay = 0, y = 10, className, once = true }: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once, margin: "-8% 0px" }}
      transition={{ ...osStandard, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, step = 0.03, as = "div" }: { children: ReactNode; className?: string; step?: number; as?: "div" | "ul" }) {
  const reduce = useReducedMotion();
  const Comp = as === "ul" ? motion.ul : motion.div;
  return (
    <Comp className={className} variants={reduce ? undefined : listStagger(step)} initial={reduce ? undefined : "hidden"} animate={reduce ? undefined : "show"}>
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const reduce = useReducedMotion();
  if (reduce) return as === "li" ? <li className={className}>{children}</li> : <div className={className}>{children}</div>;
  const Comp = as === "li" ? motion.li : motion.div;
  return <Comp className={className} variants={rowIn}>{children}</Comp>;
}

/** Rows of a list that can disappear: presence animation with layout. */
export function AnimatedRows({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "tbody" }) {
  const reduce = useReducedMotion();
  const Comp = as === "ul" ? motion.ul : as === "tbody" ? motion.tbody : motion.div;
  return <Comp layout={!reduce} className={className}>{children}</Comp>;
}

export function Presence({ show, children }: { show: boolean; children: ReactNode }) {
  return <AnimatePresence initial={false}>{show ? children : null}</AnimatePresence>;
}

/** Delta chip that pulses once when the figure changes — causality, not party. */
export function LiveValue({ value, className, format }: { value: number; className?: string; format?: (v: number) => string }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 900);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span className={cn("relative", className)}>
      <AnimatedNumber value={value} format={format} />
      <AnimatePresence>
        {pulse && (
          <motion.span
            className="pointer-events-none absolute -inset-x-2 -inset-y-1 bg-os-gold/15"
            initial={{ opacity: 0.9, scaleX: 0.6 }}
            animate={{ opacity: 0, scaleX: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

export function SpringCounter({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 220, damping: 30 });
  const text = useTransform(spring, (v) => new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(Math.round(v)));
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span className="os-num">{text}</motion.span>;
}

export { motion, AnimatePresence, osFast, osMicro, osStandard };
