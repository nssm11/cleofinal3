"use client";

import { ArrowDownIcon } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import {} from "@/lib/motion";
import { EASE } from "@/components/kit/motion";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";

/**
 * CinematicUniverseHero — the opening frame of a universe.
 *
 * A true fullscreen background video, edge to edge and top to bottom:
 * `cine-scene` gives the frame `100svh` and `overflow: hidden`, and the
 * video underneath is `object-cover` so the footage always fills without a
 * bar, a gap or a stretch. It inherits the homepage's exact language — the
 * same video loader, the same scrims, the same masked type rising out of
 * its own baseline — so entering a universe reads as the next scene of the
 * film, never a different website.
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

export function CinematicUniverseHero({
  video,
  poster,
  alt,
  kicker,
  title,
  subtitle,
  ctaLabel,
  ctaHref = "#univers",
}: {
  /** Base video name without extension; the mobile source is derived. */
  video: string;
  /** Poster base name, from /videos/posters. */
  poster: string;
  alt: string;
  kicker: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref?: string;
}) {
  const reduce = useReducedMotion();

  const scrollToContent = () => {
    const el = document.getElementById("univers");
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const onCta = (e: React.MouseEvent) => {
    if (ctaHref.startsWith("#")) {
      e.preventDefault();
      scrollToContent();
    }
  };

  return (
    <section className="bg-petrol text-chalk" aria-label={`${kicker} — Cléopâtre`}>
      {/* The film — a true fullscreen background, edge to edge. */}
      <CinematicVideo
        eager
        sources={{ desktop: `/videos/${video}.mp4`, mobile: `/videos/${video}-mobile.mp4` }}
        poster={`/videos/posters/${poster}.jpg`}
        alt={alt}
      />
      <SectionOverlay deep />

      {/* The title card — three lines, no card. */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          variants={reduce ? undefined : container}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.p
            variants={reduce ? undefined : rise}
            className="cine-type kicker mb-6 flex items-center gap-5"
          >
            <span aria-hidden className="h-px w-8 bg-night-line sm:w-14" />
            {kicker}
            <span aria-hidden className="h-px w-8 bg-night-line sm:w-14" />
          </motion.p>

          <div className="overflow-hidden pb-[0.12em]">
            <motion.h1
              variants={reduce ? undefined : maskRise}
              className="cine-type font-ant text-mega uppercase max-w-[16ch] select-none"
            >
              {title}
            </motion.h1>
          </div>

          {subtitle && (
            <motion.p
              variants={reduce ? undefined : rise}
              className="cine-type mt-6 max-w-[34ch] text-[13.5px] leading-[1.9] text-chalk"
            >
              {subtitle}
            </motion.p>
          )}

          <motion.a
            variants={reduce ? undefined : rise}
            href={ctaHref}
            onClick={onCta}
            className="btn-night cine-type mt-12"
            aria-label={ctaLabel}
          >
            {ctaLabel}
            <ArrowDownIcon size={13} strokeWidth={1.5} aria-hidden />
          </motion.a>
        </motion.div>
      </div>

      {/* The cue — a hairline of light, drawn down, then resting. */}
      <div className="absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-3" aria-hidden>
        <div className="kicker-xs" />
      </div>
    </section>
  );
}
