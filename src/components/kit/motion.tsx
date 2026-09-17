"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const EASE = [0.16, 1, 0.3, 1] as const;

function useOnce(amount = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); } }, { threshold: [0, amount] });
    io.observe(el);
    return () => io.disconnect();
  }, [amount, shown]);
  return { ref, shown };
}

export function Mask({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; duration?: number; y?: number; as?: "div" | "span" }) {
  const reduce = useReducedMotion();
  const { ref, shown } = useOnce();
  const Tag = as === "span" ? motion.span : motion.div;
  return (
    <Tag ref={ref as never} initial={false} animate={shown || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }} transition={{ duration: reduce ? 0 : 0.6, ease: EASE, delay: reduce ? 0 : delay }} className={cn(className)}>
      {children}
    </Tag>
  );
}

const staggerParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const staggerChild: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } };

export function Stagger({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  const reduce = useReducedMotion();
  const { ref, shown } = useOnce(0.08);
  return (
    <motion.div id={id} ref={ref} variants={staggerParent} initial={reduce ? false : "hidden"} animate={shown || reduce ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Tag = as === "li" ? motion.li : motion.div;
  return <Tag variants={staggerChild} className={className}>{children}</Tag>;
}

export function Marquee({ items, className, slow = false, separator = "·" }: { items: ReactNode[]; className?: string; slow?: boolean; separator?: string }) {
  const track = (
    <div className={cn("flex items-center gap-12 shrink-0 pr-12 min-w-full", slow ? "animate-[marquee_80s_linear_infinite]" : "animate-[marquee_60s_linear_infinite]")}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-12 whitespace-nowrap">
          {item}
          <span aria-hidden className="text-text-muted">{separator}</span>
        </span>
      ))}
    </div>
  );
  return <div className={cn("flex overflow-hidden", className)}>{track}<div aria-hidden>{track}</div></div>;
}

export function Counter({ value, className, suffix = "" }: { value: number; className?: string; suffix?: string; duration?: number }) {
  return <span className={cn("font-mono tabular-nums", className)}>{value}{suffix}</span>;
}

export function Drift({ children, className }: { children: ReactNode; className?: string; distance?: number; start?: string; end?: string }) {
  return <div className={cn("relative", className)}>{children}</div>;
}

export function RailScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex gap-4 overflow-x-auto scrollbar-none", className)}>{children}</div>;
}
