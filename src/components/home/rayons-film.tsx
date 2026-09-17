"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { EASE_LUXE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   LA TABLE DES RAYONS — the centrepiece.
   ──────────────────────────────────────────────────────────────────────────
   One sticky frame, five chapters. Scrolling does not move the composition;
   it *changes the shot*. Each rayon brings its own film, its own statement,
   its own measurement, and the index on the left stays put so the visitor
   always knows where they are in the house.

   It is the one section on the site that is allowed to be purely cinematic —
   everything else earns its place with information. The counterweight is the
   index: never a mystery, always a number.

   Reduced motion: the section becomes a plain stack of five plates, each
   fully readable, with none of the scroll choreography.
   ══════════════════════════════════════════════════════════════════════════ */

export type RayonChapter = {
  slug: string;
  name: string;
  description: string | null;
  count: number;
  video: string;
  poster: string;
  kicker: string;
  title: string;
};

export function RayonsFilm({ items }: { items: RayonChapter[] }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length + 0.0001)));
    setActive((prev) => (prev === i ? prev : i));
  });

  if (reduce) {
    return (
      <section className="bg-obsidian">
        {items.map((r, i) => (
          <div key={r.slug} className="relative flex min-h-[70svh] items-end overflow-hidden border-b border-film-line">
            <video autoPlay muted loop playsInline preload="metadata" poster={`/videos/posters/${r.poster}.jpg`} className="absolute inset-0 h-full w-full object-cover opacity-60">
              <source src={`/videos/${r.video}-mobile.mp4`} media="(max-width: 640px)" type="video/mp4" />
              <source src={`/videos/${r.video}.mp4`} type="video/mp4" />
            </video>
            <div className="relative z-10 w-full px-5 pb-12 pt-24">
              <p className="num text-[0.625rem] text-cinabre-3">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 font-display text-[clamp(2rem,6vw,4rem)] leading-none text-alabaster">{r.name}</h2>
              <Link href={`/univers/${r.slug}`} className="cine-cta mt-6 inline-flex">
                Entrer dans {r.name}
              </Link>
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={ref} className="relative bg-obsidian" style={{ height: `${items.length * 100}svh` }} aria-label="Les rayons de la maison">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ── The films ─────────────────────────────────────────────────── */}
        {items.map((r, i) => (
          <motion.div
            key={r.slug}
            aria-hidden={i !== active}
            initial={false}
            animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.04 }}
            transition={{ duration: 0.9, ease: EASE_LUXE }}
            className="absolute inset-0"
          >
            <VideoPlate chapter={r} playing={i === active} />
          </motion.div>
        ))}

        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.86)_0%,rgba(10,10,12,0.28)_32%,rgba(10,10,12,0.55)_72%,rgba(10,10,12,0.95)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(10,10,12,0.86)_0%,rgba(10,10,12,0.3)_44%,transparent_70%)]" />
          <div className="absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgba(244,243,240,0.05)_0_1px,transparent_1px_8.3333%)]" />
        </div>

        {/* ── The composition ───────────────────────────────────────────── */}
        <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-8 lg:px-[clamp(1.75rem,5vw,4.5rem)] lg:pt-28">
          <div className="flex items-center gap-3 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-alabaster/50">
            <span aria-hidden className="h-px w-8 bg-cinabre-3" />
            Les rayons — {items.length} chapitres
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-12">
            {/* The index — always visible, always measured. */}
            <nav aria-label="Index des rayons" className="order-2 lg:order-1 lg:col-span-4">
              <ul>
                {items.map((r, i) => {
                  const on = i === active;
                  return (
                    <li key={r.slug}>
                      <Link
                        href={`/univers/${r.slug}`}
                        className="group flex items-center gap-4 border-t border-film-line py-3.5"
                      >
                        <span className={`num text-[0.625rem] transition-colors ${on ? "text-cinabre-3" : "text-alabaster/30"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`flex-1 font-display text-[1.05rem] transition-all duration-500 ${
                            on ? "translate-x-1 text-alabaster" : "text-alabaster/45 group-hover:text-alabaster/80"
                          }`}
                        >
                          {r.name}
                        </span>
                        <span className={`num text-[0.625rem] transition-colors ${on ? "text-alabaster/70" : "text-alabaster/25"}`}>
                          {r.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* The chapter's statement. */}
            <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={items[active].slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.55, ease: EASE_LUXE }}
                >
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-cinabre-3">
                    {items[active].kicker}
                  </p>
                  <h2 className="mt-5 font-display text-[clamp(2.4rem,7vw,5.6rem)] leading-[0.92] tracking-[-0.04em] text-alabaster">
                    {items[active].title}
                  </h2>
                  <p className="mt-5 max-w-[34rem] text-[0.9375rem] leading-[1.7] text-alabaster/65">
                    {items[active].description ?? "Une sélection mesurée, référence par référence, pour ce rayon de la maison."}
                  </p>
                  <Link href={`/univers/${items[active].slug}`} className="btn-pale mt-8">
                    Entrer dans {items[active].name} <ArrowRightIcon size={13} className="rtl:rotate-180" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* The progress rail. */}
          <div className="mt-10 flex items-center gap-4">
            <span className="num text-[0.625rem] text-alabaster/40">
              {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <span aria-hidden className="relative h-px flex-1 bg-film-line">
              <motion.span
                className="absolute inset-y-0 start-0 origin-left bg-cinabre-3"
                style={{ width: "100%", scaleX: scrollYProgress }}
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** One film plate — mounted once, playing only while it is the shot. */
function VideoPlate({ chapter, playing }: { chapter: RayonChapter; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      v.pause();
    }
  }, [playing]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="metadata"
      poster={`/videos/posters/${chapter.poster}.jpg`}
      className="h-full w-full object-cover"
    >
      <source src={`/videos/${chapter.video}-mobile.mp4`} media="(max-width: 640px)" type="video/mp4" />
      <source src={`/videos/${chapter.video}.mp4`} type="video/mp4" />
    </video>
  );
}
