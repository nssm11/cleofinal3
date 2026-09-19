"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownIcon, PlayIcon } from "@/components/icons";
import { Counter, EASE, Mask, Stagger, StaggerItem } from "@/components/kit/motion";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LE PROJECTEUR — the opening frame.

   The house film is not shown in a box: it IS the ground of the first screen,
   edge to edge and full height, with the type standing on it. Five reels run
   behind the same frame — the house film, then the five rayons — and the strip
   along the foot of the page is the changeover: passing over a reel, with the
   pointer or with the keyboard, swaps the film behind the words, and choosing
   one opens its rayon.

   Legibility is bought flat: one wash across the whole frame, one heavier band
   under the type. No fades, no veils, no gradients.
   ══════════════════════════════════════════════════════════════════════════ */

export type Reel = {
  id: string;
  video: string;
  poster: string;
  kicker: string;
  title: string;
  href: string;
  count?: number;
};

export function Projector({
  reels,
  facts,
}: {
  reels: Reel[];
  facts: { value: number; suffix?: string; label: string }[];
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = reels[active];

  // The film follows the reel. Source and poster are swapped together, and the
  // still underneath covers the swap so the frame is never empty.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduce) return;
    v.load();
    v.play().catch(() => {
      /* autoplay refused — the still frame is the fallback, no error shown */
    });
  }, [active, reduce]);

  const scrollToChapters = () => {
    document.getElementById("film")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-petrol text-chalk">
      {/* ── The film, as the whole ground ──────────────────────────────── */}
      <div aria-hidden className="absolute inset-0">
        {reels.map((reel, i) => (
          <div
            key={reel.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              i === active ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={`/videos/posters/${reel.poster}.jpg`}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}

        {!reduce && (
          <video
            ref={videoRef}
            key={current.id}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            poster={`/videos/posters/${current.poster}.jpg`}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={`/videos/${current.video}-mobile.mp4`} media="(max-width: 768px)" />
            <source src={`/videos/${current.video}.mp4`} />
          </video>
        )}

        {/* The frame stays the frame. One gradient, under the words, and
            nothing over the picture itself. */}
        <div className="cine-scrim-band absolute inset-x-0 bottom-0 h-[62%] lg:h-[54%]" />
      </div>

      {/* ── The words, standing on the film ───────────────────────────── */}
      <div className="cine-type relative flex flex-1 flex-col justify-end shell-wide pb-6 pt-32 lg:pb-8 lg:pt-40">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span aria-hidden className="marker bg-iodine" />
          <span className="kicker text-chalk-muted">Officine dermo-cosmétique</span>
          <span className="kicker text-chalk-faint">Ezzahra · Hammam-Lif</span>
          <span className="kicker-xs text-chalk-faint">
            Bobine {String(active + 1).padStart(2, "0")} / {String(reels.length).padStart(2, "0")}
          </span>
        </div>

        <Mask delay={0.05}>
          <h1 className="mt-6 max-w-[16ch] font-ant text-[clamp(3rem,10.4vw,9.5rem)] uppercase leading-[0.84] tracking-[-0.02em] text-chalk">
            La beauté
            <br />
            se conseille.
          </h1>
        </Mask>

        <div className="mt-9 grid gap-8 border-t border-night-line pt-7 lg:grid-cols-12 lg:gap-10">
          <Mask delay={0.16} className="lg:col-span-6">
            <p className="max-w-[52ch] text-lead text-chalk-muted">
              Peau, cheveu, corps, soleil, bébé — cinq rayons, quatre-vingts références retenues une à une,
              et le conseil d&apos;un pharmacien sur chacune.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/boutique" className="btn-signal">
                Entrer dans la boutique
              </Link>
              <button onClick={scrollToChapters} className="btn-night">
                <PlayIcon size={13} aria-hidden />
                Voir le film
              </button>
            </div>
          </Mask>

          <Stagger className="grid grid-cols-3 gap-4 lg:col-span-6 lg:col-start-7 lg:border-s lg:border-night-line lg:ps-10">
            {facts.map((f) => (
              <StaggerItem key={f.label}>
                <p className="font-ant text-[clamp(1.6rem,3vw,2.4rem)] leading-none text-chalk">
                  <Counter value={f.value} suffix={f.suffix} />
                </p>
                <p className="kicker-xs mt-2 text-chalk-faint">{f.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>

      {/* ── The changeover strip — edge to edge ────────────────────────── */}
      <ul className="relative grid grid-cols-2 gap-px border-t border-night-line bg-night-line sm:grid-cols-3 lg:grid-cols-5">
        {reels.map((reel, i) => (
          <li key={reel.id} className="bg-petrol/85 backdrop-blur-sm">
            <Link
              href={reel.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              aria-current={i === active ? "true" : undefined}
              className={cn(
                "group flex min-h-[74px] flex-col justify-between gap-3 p-4 transition-colors",
                i === active ? "bg-petrol-2" : "hover:bg-petrol-2",
              )}
            >
              <span className="flex items-center justify-between">
                <span className={cn("data text-[0.625rem]", i === active ? "text-iodine" : "text-chalk-faint")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "marker transition-colors",
                    i === active ? "bg-iodine" : "bg-night-line-strong group-hover:bg-chalk-faint",
                  )}
                />
              </span>
              <span className="flex items-end justify-between gap-3">
                <span className={cn("kicker-xs", i === active ? "text-chalk" : "text-chalk-muted")}>{reel.kicker}</span>
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, x: i === active ? 0 : -4 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="hidden shrink-0 text-[0.625rem] uppercase tracking-[0.18em] text-iodine lg:block"
                >
                  À l&apos;écran
                </motion.span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative shell-wide flex items-center justify-between gap-6 border-t border-night-line py-4">
        <button
          onClick={scrollToChapters}
          className="kicker flex items-center gap-2 text-chalk-faint transition-colors hover:text-chalk"
        >
          Défiler
          <ArrowDownIcon size={13} aria-hidden />
        </button>
        <p className="kicker-xs hidden text-chalk-faint sm:block">Paiement à la livraison · Livraison 48 h</p>
      </div>
    </section>
  );
}
