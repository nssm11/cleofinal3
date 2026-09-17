"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";

const HIGHLIGHTS = [
  "Très haute protection SPF50+",
  "Fini invisible sans traces blanches",
  "Tolérance peaux intolérantes & enfants",
  "Après-soleil dermo-réparateur",
];

export function CinematicSunSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="chapitre-solaire"
      data-header-theme="dark"
      className="cine-scene flex items-end justify-start"
      aria-label="Chapitre Solaire — La haute défense"
    >
      {/* ── Viewport Video ────────────────────────────────────────── */}
      <CinematicVideo
        sources={{ desktop: "/videos/category-sun.mp4", mobile: "/videos/category-sun-mobile.mp4" }}
        poster="/videos/posters/sun.jpg"
        alt="Univers Solaire — Cléopâtre"
      />
      <SectionOverlay />

      {/* ── Asymmetric Editorial Layout ───────────────────────────── */}
      <div className="relative z-10 w-full px-6 pb-20 sm:px-10 sm:pb-28 lg:px-16 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: EASE_LUXE }}
            className="max-w-2xl"
          >
            {/* Chapter Header */}
            <div
              className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-cine-mist sm:text-[11px]"
              aria-hidden
            >
              <span className="cine-index text-cine-gold">04 / 04</span>
              <span className="h-px w-10 bg-cine-line" />
              <span>SOLAIRE · LA HAUTE DÉFENSE</span>
            </div>

            {/* Display Title */}
            <h2 className="cine-title mt-6 text-[clamp(2.1rem,4.6vw,4rem)] font-light leading-[1.05] tracking-[-0.015em] text-cine-ivory">
              La lumière apprivoisée.
            </h2>

            {/* Supporting Narrative */}
            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-cine-mist/90 sm:text-[15.5px]">
              Sous le soleil intense de Tunisie, la photoprotection est l&apos;ultime rempart de longévité cellulaire. Des filtres d&apos;avant-garde haute stabilité, formulés pour résister à la baignade et protéger la peau sans compromis sur la sensualité de l&apos;application.
            </p>

            {/* Benefit Pills */}
            <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3" aria-label="Points forts solaires">
              {HIGHLIGHTS.map((h) => (
                <span
                  key={h}
                  className="border border-cine-line/40 bg-cine-noir/40 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.06em] text-cine-ivory/80 backdrop-blur-sm"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 sm:mt-12">
              <Link
                href="/univers/solaire"
                className="group relative inline-flex items-center gap-3 border border-cine-line/50 bg-cine-noir/40 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.26em] text-cine-ivory backdrop-blur-md transition-all duration-300 hover:border-cine-gold hover:bg-cine-noir/70 hover:text-cine-gold"
              >
                <span>Découvrir la Protection Solaire</span>
                <ArrowRightIcon
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                  aria-hidden
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
