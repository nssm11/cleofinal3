"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";
import { cn } from "@/lib/utils";

const CHAPTERS = {
  cheveux: {
    key: "cheveux",
    label: "Cheveux",
    kicker: "CHEVEUX · MATIÈRE & CUIR CHEVELU",
    title: "Force, éclat et respect du cheveu.",
    description:
      "Soins dermo-cosmétiques anti-chute, shampooings physiologiques sans sulfates agressifs et masques nutritifs profonds pour restaurer la vitalité de la fibre.",
    href: "/univers/cheveux",
    video: "category-hair",
    poster: "hair",
    alt: "Univers Cheveux — Cléopâtre",
    tags: ["Cuir chevelu sensible", "Anti-chute ciblée", "Nutrition intense", "Brillance naturelle"],
  },
  corps: {
    key: "corps",
    label: "Corps",
    kicker: "CORPS · ENVELOPPE & NUTRITION",
    title: "La volupté d'une peau profondément nourrie.",
    description:
      "Baumes relipidants anti-grattage, huiles lavantes satinées et exfoliations douces pour préserver l'élasticité cutanée face au soleil et à l'eau calcaire.",
    href: "/univers/corps",
    video: "category-body",
    poster: "body",
    alt: "Univers Corps — Cléopâtre",
    tags: ["Sécheresse sévère", "Hydratation quotidienne", "Douche surgras", "Soins des mains"],
  },
} as const;

export function CinematicHairBody() {
  const [activeTab, setActiveTab] = useState<"cheveux" | "corps">("cheveux");
  const current = CHAPTERS[activeTab];
  const reduce = useReducedMotion();

  return (
    <section
      id="chapitre-matiere"
      data-header-theme="dark"
      className="cine-scene flex items-end justify-start"
      aria-label="Chapitre Cheveux et Corps — Cléopâtre"
    >
      {/* ── Background Video with crossfade ────────────────────────── */}
      <div className="absolute inset-0">
        <CinematicVideo
          key={current.video}
          sources={{ desktop: `/videos/${current.video}.mp4`, mobile: `/videos/${current.video}-mobile.mp4` }}
          poster={`/videos/posters/${current.poster}.jpg`}
          alt={current.alt}
        />
      </div>
      <SectionOverlay />

      {/* ── Asymmetric Editorial Layout ───────────────────────────── */}
      <div className="relative z-10 w-full px-6 pb-20 sm:px-10 sm:pb-28 lg:px-16 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            {/* Chapter Header + Tab Switcher */}
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-cine-mist sm:text-[11px]">
              <span className="cine-index text-cine-gold">02 / 04</span>
              <span className="h-px w-8 bg-cine-line sm:w-10" />
              <div className="flex items-center gap-2 border border-cine-line/40 bg-cine-noir/60 p-1 backdrop-blur-md">
                {(["cheveux", "corps"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] transition-all duration-300",
                      activeTab === tab
                        ? "bg-cine-gold text-cine-noir shadow-sm"
                        : "text-cine-mist hover:text-cine-ivory",
                    )}
                  >
                    {CHAPTERS[tab].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Content Frame */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.key}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.6, ease: EASE_LUXE }}
                className="mt-6"
              >
                <p className="cine-kicker text-[10px] tracking-[0.34em] text-cine-mist sm:text-[11px]">
                  {current.kicker}
                </p>

                <h2 className="cine-title mt-4 text-[clamp(2.1rem,4.4vw,3.9rem)] font-light leading-[1.06] tracking-[-0.015em] text-cine-ivory">
                  {current.title}
                </h2>

                <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-cine-mist/90 sm:text-[15.5px]">
                  {current.description}
                </p>

                {/* Concern / Benefit Pills */}
                <div className="mt-7 flex flex-wrap gap-2.5 sm:gap-3" aria-label="Besoins traités">
                  {current.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-cine-line/40 bg-cine-noir/40 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.06em] text-cine-ivory/80 backdrop-blur-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Direct Entrance CTA */}
                <div className="mt-10 sm:mt-12">
                  <Link
                    href={current.href}
                    className="group relative inline-flex items-center gap-3 border border-cine-line/50 bg-cine-noir/40 px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.26em] text-cine-ivory backdrop-blur-md transition-all duration-300 hover:border-cine-gold hover:bg-cine-noir/70 hover:text-cine-gold"
                  >
                    <span>Explorer l&apos;Univers {current.label}</span>
                    <ArrowRightIcon
                      size={14}
                      strokeWidth={1.5}
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden
                    />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
