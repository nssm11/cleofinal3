"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { ArrowUpRightIcon } from "@/components/icons";
import { EASE, Stagger, StaggerItem } from "@/components/kit/motion";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LE FILM — the five chapters of the house.

   Each chapter is a full-bleed scene: the reel fills the whole frame, edge to
   edge, and the words stand on it — the numeral and kicker in the rail, the
   title, the promise and the houses over a flat band at the foot. Chapters
   alternate the side of the type, so scrolling the film has a rhythm.

   The image is the ground here, never an illustration inside a card.
   ══════════════════════════════════════════════════════════════════════════ */

export type Chapter = {
  id: string;
  index: number;
  total: number;
  video: string;
  poster: string;
  kicker: string;
  title: string;
  href: string;
  promise: string;
  count: number;
  labs: string[];
};

export function FilmChapter({ chapter, side }: { chapter: Chapter; side: "left" | "right" }) {
  const plateFirst = side === "left";

  return (
    <section
      id={chapter.id}
      aria-label={chapter.kicker}
      className="relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden bg-petrol text-chalk lg:min-h-[96svh]"
    >
      {/* ── The reel, as the whole ground ─────────────────────────────── */}
      <div aria-hidden className="absolute inset-0">
        <CinematicVideo
          sources={{
            desktop: `/videos/${chapter.video}.mp4`,
            mobile: `/videos/${chapter.video}-mobile.mp4`,
          }}
          poster={`/videos/posters/${chapter.poster}.jpg`}
          alt={`${chapter.kicker} — ${chapter.title}`}
        />
        {/* No wash across the frame — the chapter is the picture, and a 58 %
            film of ink over it was the difference between watching a film and
            watching a film through a curtain. What is left is the gradient the
            words stand on, fading out before the image ends. */}
        <div className="cine-scrim-band absolute inset-x-0 bottom-0 h-[62%] lg:h-[52%]" />
      </div>

      <div className="cine-type relative shell-wide pb-9 pt-28 lg:pb-12 lg:pt-32">
        <div className={cn("grid gap-x-8 gap-y-7 lg:grid-cols-12", !plateFirst && "lg:text-end")}>
          {/* The rail: numeral, chapter, count */}
          <div className={cn("lg:col-span-3", !plateFirst && "lg:order-3")}>
            <div className={cn("flex items-baseline gap-5", !plateFirst && "lg:justify-end")}>
              <p className="font-ant text-[clamp(2.6rem,5vw,4.4rem)] leading-[0.8] text-chalk-faint">
                {String(chapter.index).padStart(2, "0")}
              </p>
              <div>
                <p className="kicker text-chalk">{chapter.kicker}</p>
                <p className="kicker-xs mt-1.5 text-chalk-faint">
                  Chapitre {String(chapter.index).padStart(2, "0")} / {String(chapter.total).padStart(2, "0")}
                </p>
              </div>
            </div>
            <div
              aria-hidden
              className={cn("mt-5 h-px w-16 bg-iodine", !plateFirst && "lg:ms-auto")}
            />
            <p className="data mt-5 text-[0.7rem] text-chalk-muted">
              {String(chapter.count).padStart(2, "0")} réf.
            </p>
          </div>

          {/* The words */}
          <div className={cn("lg:col-span-7 lg:col-start-5", !plateFirst && "lg:order-1 lg:col-start-2")}>
            <Stagger>
              <StaggerItem>
                <h2 className="font-ant text-[clamp(2.1rem,5.4vw,4.6rem)] uppercase leading-[0.9] text-chalk">
                  {chapter.title}
                </h2>
              </StaggerItem>
              <StaggerItem>
                <p className={cn("mt-5 max-w-[52ch] text-lead text-chalk-muted", !plateFirst && "lg:ms-auto")}>
                  {chapter.promise}
                </p>
              </StaggerItem>
              <StaggerItem>
                <ul className={cn("mt-7 flex flex-wrap gap-x-2 gap-y-2", !plateFirst && "lg:justify-end")}>
                  {chapter.labs.slice(0, 4).map((l) => (
                    <li key={l} className="chip-on-dark">
                      {l}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
              <StaggerItem>
                <Link
                  href={chapter.href}
                  className={cn("btn-night-solid mt-8 group inline-flex", !plateFirst && "lg:ms-auto")}
                >
                  Ouvrir le rayon
                  <ArrowUpRightIcon
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl-mirror"
                  />
                </Link>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * LE BANDEAU — a statement that crosses the page.
 *
 * The one scroll-linked gesture of the homepage: a line of poster type moving
 * horizontally against the direction of the scroll, on the petrol ground.
 * Small travel (a tenth of the viewport), eased by a spring, and still under
 * reduced motion.
 */
export function StatementBand({
  words,
  href,
  cta,
}: {
  words: string;
  href: string;
  cta: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["4%", "-14%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-petrol py-16 text-chalk lg:py-20">
      <div aria-hidden className="blueprint absolute inset-0 opacity-[0.08]" />
      <div aria-hidden className="grain absolute inset-0 opacity-40" />
      <div className="relative">
        <motion.p
          style={reduce ? undefined : { x }}
          className="whitespace-nowrap font-ant text-[clamp(3rem,11vw,10rem)] uppercase leading-[0.86] text-chalk"
        >
          {words}
        </motion.p>
      </div>
      <div className="shell-wide relative mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-night-line pt-6">
        <p className="kicker max-w-[46ch] text-chalk-muted">
          Chaque référence est retenue par un pharmacien, expliquée au comptoir, livrée en 48 h partout en Tunisie.
        </p>
        <Link href={href} className="btn-night group">
          {cta}
          <ArrowUpRightIcon size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </section>
  );
}

export { EASE };
