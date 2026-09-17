import type { Transition, Variants } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════════
   CLÉOPÂTRE — LANGAGE DU MOUVEMENT
   ──────────────────────────────────────────────────────────────────────────
   One grammar, eight verbs. Nothing in the interface invents its own timing;
   every animated element names one of these tokens, so the whole house moves
   at the same tempo — calm on approach, decisive on contact.

   RULES
   1. Only `transform` and `opacity` are animated. Never layout properties.
   2. Distances are small (6–24 px). The house never throws things around.
   3. Entrance is slower than exit: arriving is a pleasure, leaving is a fact.
   4. Every verb has a `prefers-reduced-motion` fallback that keeps the
      meaning (a state change) but drops the travel.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Curves ──────────────────────────────────────────────────────────── */
export const EASE = [0.22, 1, 0.36, 1] as const; // arrive: fast out, long settle
export const EASE_EXIT = [0.55, 0, 1, 0.45] as const; // leave: accelerate away
export const EASE_VEIL = [0.65, 0, 0.35, 1] as const; // symmetric: veils, curtains

/* ── Durations (seconds) ─────────────────────────────────────────────── */
export const D = {
  instant: 0.18,
  fast: 0.34,
  base: 0.6,
  slow: 0.9,
  grand: 1.15,
} as const;

/* ── Verbs ───────────────────────────────────────────────────────────── */

/** 01 · ARRIVE — content settles into place. Scroll reveals, page content. */
export const arrive: Transition = { duration: D.slow, ease: EASE };

/** 02 · LEAVE — content withdraws. Exits, dismissals, closing sheets. */
export const leave: Transition = { duration: D.fast, ease: EASE_EXIT };

/** 03 · TOUCH — hover and press feedback. Immediate, never showy. */
export const touch: Transition = { duration: D.fast, ease: EASE };

/** 04 · VEIL — overlays, scrims and backgrounds. Symmetric, filmic. */
export const veil: Transition = { duration: D.base, ease: EASE_VEIL };

/** 05 · SPRING — physical objects: sheets, drawers, the cart tray. */
export const springPanel: Transition = { type: "spring", stiffness: 168, damping: 30, mass: 1 };
export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 26, mass: 1 };
export const springSnap: Transition = { type: "spring", stiffness: 320, damping: 34, mass: 0.8 };

/* ── Legacy aliases kept for the few call-sites that name them directly ── */
export const springSlow: Transition = springSoft;
export const springCalm: Transition = springPanel;
export const tweenSlow: Transition = arrive;
export const tweenBase: Transition = { duration: D.base, ease: EASE };
export const tweenFast: Transition = touch;
export const tweenExit: Transition = leave;

/* ── Choreography ────────────────────────────────────────────────────── */

/** A single element rising into the composition. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: arrive },
};
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: tweenBase },
};

/** A line of display type wiping up from behind a mask. */
export const wipe: Variants = {
  hidden: { y: "108%" },
  show: { y: "0%", transition: { duration: D.grand, ease: EASE } },
};

/** The whole composition entering, one beat after another. */
export const choreograph = (step = 0.07, first = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: first } },
});

/** The old `stagger` helper — same behaviour, kept for compatibility. */
export const stagger = choreograph;

/* ── Interaction states ──────────────────────────────────────────────── */
export const hoverLift = { y: -3, transition: touch };

/* ── Page-level transition: the house never blanks the screen ────────── */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: D.base, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: leave },
};

/* ── Surfaces ────────────────────────────────────────────────────────── */

/** A sheet rising from the bottom edge (mobile filters, mobile menu). */
export const sheetUp = {
  initial: { y: "100%" },
  animate: { y: 0, transition: springPanel },
  exit: { y: "100%", transition: { duration: D.fast, ease: EASE_EXIT } },
};

/** A panel sliding from the right edge (cart tray, filters on desktop). */
export const panelRight = {
  initial: { x: "100%" },
  animate: { x: 0, transition: springPanel },
  exit: { x: "100%", transition: { duration: D.fast, ease: EASE_EXIT } },
};

/** An immersive surface descending from the top (search, mega navigation). */
export const veilDown = {
  initial: { opacity: 0, y: -14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: leave },
};

/**
 * Staggered list entrance for rows rendered inside a container that is
 * already animating — the container owns the choreography, rows own travel.
 */
export const rowIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: D.base, ease: EASE } },
};
