/* ══════════════════════════════════════════════════════════════════════════
   MOUVEMENT DE L'INSTRUMENT
   ──────────────────────────────────────────────────────────────────────────
   The shop's motion language is a ceremony (`lib/motion.ts`); this one is a
   tool. Same discipline — only opacity and transform — but faster tempos and
   tighter distances, because an operator reading a table should never wait for
   the interface to finish being beautiful.

   Tokens (mirrored in CSS as --os-tempo-*):
     instant 90 ms · micro 160 · fast 240 · standard 380 · deliberate 620
   ══════════════════════════════════════════════════════════════════════════ */
import type { Transition, Variants } from "framer-motion";

export const OS_EASE = [0.16, 1, 0.3, 1] as const;
export const OS_EASE_IN = [0.7, 0, 0.84, 0] as const;

export const T = {
  instant: 0.09,
  micro: 0.16,
  fast: 0.24,
  standard: 0.38,
  deliberate: 0.62,
} as const;

export const osInstant: Transition = { duration: T.instant, ease: OS_EASE };
export const osMicro: Transition = { duration: T.micro, ease: OS_EASE };
export const osFast: Transition = { duration: T.fast, ease: OS_EASE };
export const osStandard: Transition = { duration: T.standard, ease: OS_EASE };
export const osDeliberate: Transition = { duration: T.deliberate, ease: OS_EASE };

/* Objects, not floaters: a spring for anything that occupies space. */
export const osPanelSpring: Transition = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 };
export const osSnapSpring: Transition = { type: "spring", stiffness: 520, damping: 40, mass: 0.7 };
export const osSoftSpring: Transition = { type: "spring", stiffness: 200, damping: 28, mass: 1 };

/* ── Presence ────────────────────────────────────────────────────────── */
export const sheetIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: osStandard },
};

export const rowIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: osFast },
};

export const rowCollapse: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: "auto", transition: osFast },
  exit: { opacity: 0, height: 0, transition: osMicro },
};

export const listStagger = (step = 0.025, first = 0.02): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: first } },
});

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: osMicro },
};

/* A drawer enters as a physical panel, not a fade. */
export const drawerRight = {
  initial: { x: "100%" },
  animate: { x: 0, transition: osPanelSpring },
  exit: { x: "100%", transition: { duration: T.fast, ease: OS_EASE_IN } },
};

export const drawerLeft = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: osPanelSpring },
  exit: { x: "-100%", transition: { duration: T.fast, ease: OS_EASE_IN } },
};

export const paletteIn = {
  initial: { opacity: 0, scale: 0.985, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: osPanelSpring },
  exit: { opacity: 0, scale: 0.99, y: -6, transition: { duration: T.micro, ease: OS_EASE_IN } },
};

export const backdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: osFast },
  exit: { opacity: 0, transition: osMicro },
};

/** Page-level transition: the workspace slides in from where the eye was. */
export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: osStandard },
  exit: { opacity: 0, y: -4, transition: osMicro },
};
