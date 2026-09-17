"use client";

import { ArrowDownIcon } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import {} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";

/**
 * VideoHero — the opening frame.
 *
 * Full viewport, no card, no box: the film, the name of the house set wide
 * across it, and a single invitation. The wordmark rises out of a mask; the
 * rest of the frame settles a beat later. Everything else on the page is
 * measured from this moment of stillness.
 */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.35 } },
};
const rise = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};
const maskRise = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 1.5, ease: EASE } },
};

export function VideoHero() {
  const reduce = useReducedMotion();

  const scrollToFirstChapter = () => {
    document.getElementById("chapter-skin")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="ouverture" className="bg-petrol text-chalk" aria-label="Cléopâtre — Beauty in Ritual">
      <CinematicVideo
        eager
        sources={{ desktop: "/videos/hero-main.mp4", mobile: "/videos/hero-main-mobile.mp4" }}
        poster="/videos/posters/hero.jpg"
        alt="Cléopâtre — rituel de beauté"
      />
      <SectionOverlay deep />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          variants={reduce ? undefined : container}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="flex flex-col items-center"
        >
          <div className="overflow-hidden pb-[0.12em]">
            <motion.h1
              variants={reduce ? undefined : maskRise}
              className="font-ant uppercase select-none"
              aria-label="Cléopâtre"
            >
              CLÉOPÂTRE
            </motion.h1>
          </div>

          <motion.p variants={reduce ? undefined : rise} className="kicker mt-7 flex items-center gap-5">
            <span aria-hidden className="h-px w-8 bg-night-line sm:w-14" />
            Beauty in Ritual
            <span aria-hidden className="h-px w-8 bg-night-line sm:w-14" />
          </motion.p>

          <motion.button
            variants={reduce ? undefined : rise}
            onClick={scrollToFirstChapter}
            className="btn-night mt-14"
            aria-label="Explorer — premier chapitre"
          >
            Explore
            <ArrowDownIcon size={13} strokeWidth={1.5} aria-hidden />
          </motion.button>
        </motion.div>
      </div>

      {/* The cue — a hairline of light, drawn down, then resting. */}
      <div className="absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-3" aria-hidden>
        <div className="kicker-xs" />
      </div>
    </section>
  );
}
