"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_LUXE, D } from "@/lib/motion";

/**
 * ARRIVE — the default entrance for anything that is not display typography.
 *
 * Reveals are scroll-driven and one-shot: once the visitor has seen a block it
 * never moves again, which keeps scrolling calm and the main thread free.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 20,
  once = true,
  as = "div",
  amount = 0.25,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "li" | "span" | "p" | "h1" | "h2" | "article" | "header";
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: D.slow, ease: EASE_LUXE, delay }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </M>
  );
}

/** Container that hands each child one beat of the choreography. */
export function Stagger({
  children,
  className,
  step = 0.07,
  first = 0.04,
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  first?: number;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: first } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 18 }: { children: ReactNode; className?: string; y?: number }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: D.slow, ease: EASE_LUXE } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * MASK-LINE — display typography wiping up from behind its own baseline.
 *
 * This is the house signature for headlines. Each line is wrapped in an
 * overflow-hidden shell so the type appears to be *printed* onto the page.
 */
export function MaskLine({
  children,
  delay = 0,
  className,
  lineClassName,
  immediate = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  lineClassName?: string;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={`block overflow-hidden pb-[0.08em] ${lineClassName ?? ""}`}>
      <motion.span
        className={`block ${className ?? ""}`}
        initial={reduce ? false : { y: "112%", opacity: 0.4 }}
        {...(immediate
          ? { animate: { y: "0%", opacity: 1 } }
          : { whileInView: { y: "0%", opacity: 1 }, viewport: { once: true, amount: 0.6 } })}
        transition={{ duration: D.grand, ease: EASE_LUXE, delay }}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * REVEAL CURTAIN — an image or plate that unveils itself as it enters.
 * The inner element travels while the frame stays put, so the photograph
 * appears to develop rather than to slide.
 */
export function Curtain({
  children,
  className,
  delay = 0,
  from = "bottom",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const reduce = useReducedMotion();
  const hidden = from === "left" ? "inset(0 100% 0 0)" : from === "right" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: hidden, opacity: 0.6 }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: D.grand, ease: EASE_LUXE, delay }}
      style={{ willChange: "clip-path, opacity" }}
    >
      {children}
    </motion.div>
  );
}
