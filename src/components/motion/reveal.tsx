"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, className, y = 12, delay = 0, as = "div", amount, once, ...rest }: { children: ReactNode; className?: string; y?: number; delay?: number; as?: any; amount?: number; once?: boolean; [key: string]: any }) {
  const reduce = useReducedMotion();
  const M = (motion as any)[as] ?? motion.div;
  return (
    <M initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: once ?? true, amount: amount ?? 0.15 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }} className={className} {...rest}>
      {children}
    </M>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string; step?: number; first?: number; amount?: number }) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string; y?: number }) {
  return <div className={className}>{children}</div>;
}

export function MaskLine({ children, className }: { children: ReactNode; delay?: number; className?: string; lineClassName?: string; immediate?: boolean }) {
  return <span className={className}>{children}</span>;
}

export function Curtain({ children, className }: { children: ReactNode; className?: string; delay?: number; from?: "bottom" | "left" | "right" }) {
  return <div className={className}>{children}</div>;
}
