import type { Transition, Variants } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════════
   CLÉOPÂTRE — LE MOUVEMENT
   ──────────────────────────────────────────────────────────────────────────
   One grammar. Every animated element names a token from this file, so the
   whole house moves at the same tempo: quick to arrive, unhurried to settle,
   decisive on contact.

   THE TEMPO
   The old world moved like a film — slow, warm, ceremonial. The instrument
   moves faster and tighter: arrivals land in about half a second, staggers
   are short (40–70 ms), and nothing overshoots. Luxury here is precision,
   not languor.

   RULES
   1. Only `transform`, `opacity`, `clip-path` and `filter` animate. Never
      layout properties.
   2. Distances are small (6–28 px). The house never throws things around.
   3. Entrances ease out hard (they arrive), exits accelerate away (they go).
   4. Every verb has a `prefers-reduced-motion` story that keeps the meaning
      and drops the travel.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Curves ──────────────────────────────────────────────────────────── */
export const EASE_LUXE = [0.16, 1, 0.3, 1] as const; // arrive: fast out, long settle
export const EASE_EXIT = [0.7, 0, 0.84, 0] as const; // leave: accelerate away
export const EASE_VEIL = [0.65, 0, 0.35, 1] as const; // symmetric: veils, curtains
export const EASE_SNAP = [0.2, 0.9, 0.24, 1] as const; // contact: presses, toggles

/* ── Durations (seconds) ─────────────────────────────────────────────── */
export const D = {
  instant: 0.15,
  fast: 0.3,
  base: 0.62,
  slow: 0.9,
  grand: 1.1,
} as const;

/* ── Verbs ───────────────────────────────────────────────────────────── */

/** 01 · ARRIVE — content settles into place. Scroll reveals, page content. */
export const arrive: Transition = { duration: D.slow, ease: EASE_LUXE };

/** 02 · LEAVE — content withdraws. Exits, dismissals, closing sheets. */
export const leave: Transition = { duration: D.fast, ease: EASE_EXIT };

/** 03 · TOUCH — hover and press feedback. Immediate, never showy. */
export const touch: Transition = { duration: D.fast, ease: EASE_LUXE };

/** 04 · VEIL — overlays, scrims and grounds. Symmetric, filmic. */
export const veil: Transition = { duration: D.base, ease: EASE_VEIL };

/** 05 · SPRING — physical objects: sheets, drawers, the bag. */
export const springPanel: Transition = { type: "spring", stiffness: 260, damping: 32, mass: 0.9 };
export const springSoft: Transition = { type: "spring", stiffness: 180, damping: 28, mass: 1 };
export const springSnap: Transition = { type: "spring", stiffness: 420, damping: 36, mass: 0.7 };

/* ── Legacy aliases kept for the call-sites that name them directly ───── */
export const springSlow: Transition = springSoft;
export const springCalm: Transition = springPanel;
export const tweenSlow: Transition = arrive;
export const tweenBase: Transition = { duration: D.base, ease: EASE_LUXE };
export const tweenFast: Transition = touch;
export const tweenExit: Transition = leave;

/* ── Choreography ────────────────────────────────────────────────────── */

/** A single element rising into the composition. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: arrive },
};
export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: tweenBase },
};

/** A line of display type wiping up from behind a mask. */
export const wipe: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: D.grand, ease: EASE_LUXE } },
};

/** The whole composition entering, one beat after another. */
export const choreograph = (step = 0.055, first = 0.02): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: first } },
});

export const stagger = choreograph;

/* ── Interaction states ──────────────────────────────────────────────── */
export const hoverLift = { y: -3, transition: touch };

/* ── Page-level transition: the house never blanks the screen ────────── */
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: D.base, ease: EASE_LUXE } },
  exit: { opacity: 0, y: -8, transition: leave },
};

/* ── Surfaces ────────────────────────────────────────────────────────── */

/** A sheet rising from the bottom edge (mobile filters, mobile menu). */
export const sheetUp = {
  initial: { y: "100%" },
  animate: { y: 0, transition: springPanel },
  exit: { y: "100%", transition: { duration: D.fast, ease: EASE_EXIT } },
};

/** A panel sliding from the inline end (the bag, desktop filters). */
export const panelRight = {
  initial: { x: "100%" },
  animate: { x: 0, transition: springPanel },
  exit: { x: "100%", transition: { duration: D.fast, ease: EASE_EXIT } },
};

/** An immersive surface descending from the top (search, navigation). */
export const veilDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.46, ease: EASE_LUXE } },
  exit: { opacity: 0, y: -12, transition: leave },
};

/** The curtain — the page change of scene. Two panels, one wordmark. */
export const curtain = {
  initial: { y: "100%" },
  animate: { y: "0%", transition: { duration: D.base, ease: EASE_LUXE } },
  exit: { y: "-100%", transition: { duration: D.base, ease: EASE_LUXE } },
};

/**
 * Staggered list entrance for rows rendered inside a container that is
 * already animating — the container owns the choreography, rows own travel.
 */
export const rowIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: D.base, ease: EASE_LUXE } },
};

/** The scrim behind every overlay — one definition, used everywhere. */
export const scrimIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: D.fast, ease: EASE_VEIL } },
  exit: { opacity: 0, transition: { duration: D.fast, ease: EASE_VEIL } },
};
