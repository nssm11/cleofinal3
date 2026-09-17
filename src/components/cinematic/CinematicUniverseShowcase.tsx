"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";
import { cn } from "@/lib/utils";

export type UniverseData = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  children: Array<{ id: number; name: string; slug: string }>;
};

const CINEMA_CONFIG: Record<
  string,
  { video?: string; poster?: string; kicker: string; promise: string }
> = {
  visage: {
    video: "category-skin",
    poster: "skin",
    kicker: "RITUEL CUTANÉ",
    promise: "Un teint tenu, saison après saison, par des formules dosées avec justesse.",
  },
  corps: {
    video: "category-body",
    poster: "body",
    kicker: "ENVELOPPE CORPORELLE",
    promise: "Des textures fondantes et des gestes simples, pour une peau du Sud qui demande de l'eau.",
  },
  cheveux: {
    video: "category-hair",
    poster: "hair",
    kicker: "MATIÈRE CAPILLAIRE",
    promise: "Tout commence par un cuir chevelu apaisé — le reste suit.",
  },
  solaire: {
    video: "category-sun",
    poster: "sun",
    kicker: "HAUTE PROTECTION",
    promise: "Sous nos latitudes, se protéger n'est pas une option : c'est un réflexe quotidien.",
  },
  "bebe-maman": {
    video: "category-baby",
    poster: "baby",
    kicker: "DOUCEUR & MATERNITÉ",
    promise: "La douceur comme seule exigence, pour les premières années et pour la maternité.",
  },
  complements: {
    kicker: "BEAUTÉ DE L'INTÉRIEUR",
    promise: "Compléter sans excès : des actifs d'origine contrôlée, aux dosages utiles.",
  },
  hygiene: {
    kicker: "ESSENTIELS DU QUOTIDIEN",
    promise: "Les essentiels du quotidien, retenus pour leur tolérance — jamais pour leur emballage.",
  },
};

export function CinematicUniverseShowcase({ universes }: { universes: UniverseData[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeUniverse = universes[selectedIndex] ?? universes[0];
  const reduce = useReducedMotion();

  if (!activeUniverse) return null;

  const cfg = CINEMA_CONFIG[activeUniverse.slug] ?? {
    kicker: activeUniverse.name.toUpperCase(),
    promise: activeUniverse.description ?? "Une sélection courte conseillée par nos pharmaciens.",
  };

  const hasVideo = !!cfg.video;
  const pad = (n: number) => String(n + 1).padStart(2, "0");

  return (
    <section
      id="univers"
      data-header-theme="dark"
      className="cine-scene flex min-h-[100svh] flex-col justify-between"
      aria-label="Les Univers de la Maison Cléopâtre"
    >
      {/* ── Background Media Layer (Video or Atmospheric Photography) ─ */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {hasVideo ? (
            <motion.div
              key={`video-${activeUniverse.slug}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <CinematicVideo
                sources={{
                  desktop: `/videos/${cfg.video}.mp4`,
                  mobile: `/videos/${cfg.video}-mobile.mp4`,
                }}
                poster={`/videos/posters/${cfg.poster}.jpg`}
                alt={activeUniverse.name}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`img-${activeUniverse.slug}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <Image
                src={activeUniverse.image || "/images/hero.jpg"}
                alt={activeUniverse.name}
                fill
                sizes="100vw"
                className="h-full w-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SectionOverlay deep />

      {/* ── Top Header of the Showcase ─────────────────────────────── */}
      <div className="relative z-10 w-full px-6 pt-20 sm:px-10 sm:pt-24 lg:px-16 lg:pt-28">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-b border-cine-line/40 pb-4 sm:flex-row sm:items-center sm:pb-6">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-cine-mist sm:text-[11px]">
            <span className="cine-index text-cine-gold">03 / 04</span>
            <span className="h-px w-8 bg-cine-line" />
            <span>LES SEPT RAYONS DE LA MAISON</span>
          </div>
          <span className="hidden text-[10px] font-medium tracking-[0.2em] text-cine-faint sm:inline sm:text-[11px]">
            SÉLECTION OFFICIELLE EN OFFICINE
          </span>
        </div>
      </div>

      {/* ── Center Content Frame ───────────────────────────────────── */}
      <div className="relative z-10 my-auto w-full px-6 py-6 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeUniverse.slug}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease: EASE_LUXE }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-cine-gold">
                <span>RAYON {pad(selectedIndex)}</span>
                <span className="h-px w-6 bg-cine-gold/60" />
                <span>{cfg.kicker}</span>
              </div>

              <h2 className="cine-wordmark mt-3 text-[clamp(2.1rem,5vw,4.4rem)] font-light leading-[1.04] tracking-[-0.015em] text-cine-ivory sm:mt-4">
                {activeUniverse.name}
              </h2>

              <p className="font-film mt-3 text-[clamp(1.05rem,2vw,1.35rem)] font-light italic leading-relaxed text-cine-ivory/95 sm:mt-4">
                « {cfg.promise} »
              </p>

              {activeUniverse.description && (
                <p className="mt-3 text-[13px] leading-relaxed text-cine-mist/85 sm:mt-4 sm:text-[14.5px]">
                  {activeUniverse.description}
                </p>
              )}

              {/* Dynamic subcategories from live DB children */}
              {activeUniverse.children && activeUniverse.children.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2" aria-label="Sous-catégories">
                  {activeUniverse.children.slice(0, 5).map((child) => (
                    <Link
                      key={child.slug}
                      href={`/categorie/${child.slug}`}
                      className="border border-cine-line/40 bg-cine-noir/50 px-3 py-1 text-[10.5px] font-medium tracking-[0.05em] text-cine-ivory/80 backdrop-blur-sm transition-colors hover:border-cine-gold hover:text-cine-gold sm:text-[11px]"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-7 flex flex-wrap items-center gap-5 sm:mt-9 sm:gap-8">
                <Link
                  href={`/univers/${activeUniverse.slug}`}
                  className="group relative inline-flex items-center gap-3 border border-cine-line/50 bg-cine-noir/40 px-7 py-3 text-[10.5px] font-bold uppercase tracking-[0.26em] text-cine-ivory backdrop-blur-md transition-all duration-300 hover:border-cine-gold hover:bg-cine-noir/70 hover:text-cine-gold sm:px-8 sm:py-3.5 sm:text-[11px]"
                >
                  <span>Entrer dans l&apos;Univers {activeUniverse.name}</span>
                  <ArrowRightIcon
                    size={14}
                    strokeWidth={1.5}
                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                    aria-hidden
                  />
                </Link>

                <Link
                  href="/boutique"
                  className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-cine-mist transition-colors hover:text-cine-ivory sm:text-[11px]"
                >
                  Toute la Boutique →
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Interactive Universe Rail ───────────────────────── */}
      <div className="relative z-10 w-full border-t border-cine-line/40 bg-cine-noir/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 py-3 no-scrollbar sm:px-10 sm:py-4 lg:px-16">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {universes.map((u, i) => {
              const isActive = i === selectedIndex;
              return (
                <button
                  key={u.slug}
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2.5 px-4 py-2.5 transition-all duration-300",
                    isActive
                      ? "bg-cine-gold/15 text-cine-ivory"
                      : "text-cine-mist/70 hover:text-cine-ivory",
                  )}
                  aria-pressed={isActive}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold tabular-nums tracking-wider",
                      isActive ? "text-cine-gold" : "text-cine-faint group-hover:text-cine-mist",
                    )}
                  >
                    {pad(i)}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                    {u.name}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-universe-bar"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-cine-gold"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
