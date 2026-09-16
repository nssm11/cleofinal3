"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownIcon } from "@/components/icons";
import { EASE_LUXE } from "@/lib/motion";
import { Breadcrumbs } from "@/components/ui/primitives";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { SectionOverlay } from "@/components/cinematic/SectionOverlay";
import { VISAGE_EDITION } from "./edition";

/**
 * L'OUVERTURE — the Visage nocturne begins.
 *
 * One full frame of film, but nothing sits where the old opening sat: the
 * breadcrumb keeps watch at the top with the chapter index, the statement is
 * anchored low and to the left like a film credit, and a thin rail of light
 * at the bottom carries the page's own table of contents. No centred card,
 * no paragraph-and-stats — the scene itself is the introduction.
 */

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } };
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE_LUXE } },
};
const maskRise = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 1.5, ease: EASE_LUXE } },
};

export function VisageOpening({
  video,
  poster,
  alt,
  note,
  index,
  total,
  breadcrumb,
  universeName,
  chapters,
}: {
  video: string;
  poster: string;
  alt: string;
  /** The sentence the room whispers — the universe's own promise. */
  note: string;
  index: string;
  total: string;
  breadcrumb: string;
  universeName: string;
  chapters: readonly { readonly id: string; readonly label: string }[];
}) {
  const reduce = useReducedMotion();
  const ed = VISAGE_EDITION.opening;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <section className="cine-scene" aria-label={`${universeName} — Cléopâtre`}>
        <CinematicVideo
          eager
          sources={{ desktop: `/videos/${video}.mp4`, mobile: `/videos/${video}-mobile.mp4` }}
          poster={`/videos/posters/${poster}.jpg`}
          alt={alt}
        />
        <SectionOverlay deep />

        {/* The watch — breadcrumb and chapter index, high on the frame. */}
        <div className="absolute inset-x-0 top-0 z-10">
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="container-wide flex items-center justify-between gap-6 pt-24 lg:pt-28"
          >
            <Breadcrumbs light items={[{ label: breadcrumb }, { label: universeName }]} />
            <p className="cine-index hidden shrink-0 sm:block">
              {index} / {total}
            </p>
          </motion.div>
        </div>

        {/* The statement — anchored low, set like a credit. */}
        <div className="absolute inset-x-0 bottom-0 z-10 pb-10 lg:pb-14">
          <motion.div
            variants={reduce ? undefined : container}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="container-wide"
          >
            <motion.p variants={reduce ? undefined : rise} className="cine-kicker mb-7 flex items-center gap-5">
              <span aria-hidden className="h-px w-10 bg-cine-gold/70 sm:w-16" />
              {ed.kicker}
            </motion.p>

            <h1 className="select-none font-display font-light leading-[0.96] tracking-[-0.02em] text-cine-ivory">
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  variants={reduce ? undefined : maskRise}
                  className="block text-[clamp(2.7rem,8.4vw,6.8rem)]"
                >
                  {ed.lines[0]}
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.09em]">
                <motion.span
                  variants={reduce ? undefined : maskRise}
                  className="block text-[clamp(2.7rem,8.4vw,6.8rem)] italic text-cine-gold"
                >
                  {ed.lines[1]}
                </motion.span>
              </span>
            </h1>

            <div className="mt-9 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <motion.p variants={reduce ? undefined : rise} className="max-w-md text-[13.5px] leading-[1.9] text-cine-mist">
                {note}
              </motion.p>
              <motion.button
                variants={reduce ? undefined : rise}
                type="button"
                onClick={() => scrollTo("rituel")}
                className="cine-cta self-start md:self-auto"
              >
                {ed.cta}
                <ArrowDownIcon size={13} strokeWidth={1.5} aria-hidden />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Le sommaire — the page's own table of contents, a rail of light. */}
      <nav aria-label={VISAGE_EDITION.sommaire.label} className="border-b border-cine-line bg-cine-noir">
        <div className="container-wide flex items-center gap-8 overflow-x-auto py-4 scrollbar-none lg:py-5">
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.3em] text-cine-faint">
            {VISAGE_EDITION.sommaire.label}
          </span>
          <span aria-hidden className="h-4 w-px shrink-0 bg-cine-line" />
          <ul className="flex items-center gap-7 lg:gap-10">
            {chapters.map((c, i) => (
              <li key={c.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => scrollTo(c.id)}
                  className="group flex items-baseline gap-2.5 whitespace-nowrap"
                >
                  <span className="font-display text-[11px] italic text-cine-gold/70 transition-colors duration-300 group-hover:text-cine-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-cine-mist transition-colors duration-300 group-hover:text-cine-ivory">
                    {c.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
