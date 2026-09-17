"use client";

import { ArrowDownIcon } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.3 } },
};

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE_LUXE } },
};

const maskRise = {
  hidden: { y: "115%" },
  show: { y: "0%", transition: { duration: 1.4, ease: EASE_LUXE } },
};

export function CinematicHero() {
  const reduce = useReducedMotion();

  const scrollToManifesto = () => {
    const el = document.getElementById("manifeste");
    if (el) {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <section
      id="hero"
      data-header-theme="dark"
      className="cine-scene flex items-center justify-center"
      aria-label="Cléopâtre — Beauty in Ritual"
    >
      {/* ── Viewport Video ────────────────────────────────────────── */}
      <CinematicVideo
        eager
        sources={{ desktop: "/videos/hero-main.mp4", mobile: "/videos/hero-main-mobile.mp4" }}
        poster="/videos/posters/hero.jpg"
        alt="Cléopâtre — Le film de la maison"
      />
      <SectionOverlay deep />

      {/* ── Editorial Typographic Composition ──────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center">
        <motion.div
          variants={reduce ? undefined : container}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Eyebrow */}
          <motion.div
            variants={reduce ? undefined : rise}
            className="cine-kicker flex items-center gap-3 text-[10px] tracking-[0.38em] text-cine-mist sm:gap-5 sm:text-[11px]"
          >
            <span aria-hidden className="h-px w-6 bg-cine-line sm:w-12" />
            MAISON DE BEAUTÉ DERMO-COSMÉTIQUE
            <span aria-hidden className="h-px w-6 bg-cine-line sm:w-12" />
          </motion.div>

          {/* Monumental House Wordmark */}
          <div className="overflow-hidden pb-1 pt-3 sm:pb-2 sm:pt-4">
            <motion.h1
              variants={reduce ? undefined : maskRise}
              className="cine-wordmark select-none text-[clamp(2.6rem,8.2vw,7.5rem)] font-light leading-[1.02]"
              aria-label="Cléopâtre"
            >
              CLÉOPÂTRE
            </motion.h1>
          </div>

          {/* Supporting Statement */}
          <motion.p
            variants={reduce ? undefined : rise}
            className="font-film mt-3 text-[clamp(1.15rem,2.4vw,1.65rem)] font-light italic tracking-[0.04em] text-cine-ivory"
          >
            L&apos;Art du Rituel Pharmaceutique
          </motion.p>

          <motion.p
            variants={reduce ? undefined : rise}
            className="mt-5 max-w-xl text-[13px] font-normal leading-relaxed tracking-[0.02em] text-cine-mist/85 sm:text-[14.5px]"
          >
            Deux comptoirs au bord du golfe de Tunis. Une sélection pharmaceutique
            pure, formulée pour la lumière méditerranéenne et auditée par nos docteurs.
          </motion.p>

          {/* Minimalist Luxury CTA */}
          <motion.div variants={reduce ? undefined : rise} className="mt-10 sm:mt-12">
            <button
              onClick={scrollToManifesto}
              className="group relative inline-flex items-center gap-3 border border-cine-line/40 bg-cine-noir/30 px-7 py-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-cine-ivory backdrop-blur-md transition-all duration-500 hover:border-cine-gold/60 hover:bg-cine-noir/60 hover:text-cine-gold"
              aria-label="Découvrir la Maison — explorer la philosophie"
            >
              <span>Découvrir la Maison</span>
              <ArrowDownIcon
                size={13}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:translate-y-1"
                aria-hidden
              />
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll Cue Indicator ──────────────────────────────────── */}
      <div
        className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 select-none sm:bottom-8"
        aria-hidden
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.32em] text-cine-faint/80">
          DÉFILER
        </span>
        <div className="cine-scroll-cue h-10 w-px sm:h-12" />
      </div>
    </section>
  );
}
