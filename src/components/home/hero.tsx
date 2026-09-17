"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDownIcon, ArrowRightIcon } from "@/components/icons";
import { EASE_LUXE } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════════════════
   LE SEUIL — the opening frame of the house.
   ──────────────────────────────────────────────────────────────────────────
   Not a centred title over a video. The composition is a *drawing*: the
   statement occupies the left seven columns and wipes up from its own
   baselines, one line at a time; the right five columns carry the index of
   the five rayons with the real number of references each one holds, read
   from the catalogue; a rail of measured facts runs along the bottom edge.

   Three movements, three seconds:
     · the film fades in from black and breathes (scale 1.06 → 1 over 8 s);
     · the lines of the statement rise out of their masks, 90 ms apart;
     · the index settles a beat later, row by row.

   The pointer light and the parallax are progressive enhancement: both are
   dropped entirely for touch input and for `prefers-reduced-motion`.
   ══════════════════════════════════════════════════════════════════════════ */

export type HeroRayon = { slug: string; name: string; count: number };

export function Hero({
  kicker,
  lines,
  lead,
  primary,
  secondary,
  rayons,
  facts,
}: {
  kicker: string;
  /** Three lines of statement; the last is set in the italic of the Didone. */
  lines: [string, string, string];
  lead: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  rayons: HeroRayon[];
  facts: string[];
}) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const [filmReady, setFilmReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const filmY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const filmScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // The pointer light — one rAF, one custom property, no re-render.
  useEffect(() => {
    if (reduce) return;
    const el = lightRef.current;
    const section = sectionRef.current;
    if (!el || !section) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    let x = 0.5;
    let y = 0.4;
    let cx = 0.5;
    let cy = 0.4;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width;
      y = (e.clientY - r.top) / r.height;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const tick = () => {
      cx += (x - cx) * 0.09;
      cy += (y - cy) * 0.09;
      el.style.setProperty("--px", `${(cx * 100).toFixed(2)}%`);
      el.style.setProperty("--py", `${(cy * 100).toFixed(2)}%`);
      frame = cx === x && cy === y ? 0 : requestAnimationFrame(tick);
    };
    section.addEventListener("pointermove", onMove);
    return () => {
      section.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduce]);

  return (
    <section ref={sectionRef} className="relative flex min-h-[100svh] flex-col overflow-hidden bg-obsidian">
      {/* ── The film ─────────────────────────────────────────────────────── */}
      <motion.div style={reduce ? undefined : { y: filmY, scale: filmScale }} className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/posters/hero.jpg"
          onLoadedData={() => setFilmReady(true)}
          className={`h-full w-full object-cover transition-opacity duration-[1800ms] ease-[var(--ease-luxe)] ${filmReady ? "opacity-100" : "opacity-0"}`}
        >
          <source src="/videos/hero-main-mobile.mp4" media="(max-width: 640px)" type="video/mp4" />
          <source src="/videos/hero-main.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* ── The light of the room ────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.78)_0%,rgba(10,10,12,0.42)_34%,rgba(10,10,12,0.55)_68%,rgba(10,10,12,0.94)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,10,12,0.72)_0%,rgba(10,10,12,0.12)_46%,transparent_72%)]" />
        <div
          ref={lightRef}
          className="absolute inset-0 opacity-70 mix-blend-soft-light transition-opacity"
          style={{
            background:
              "radial-gradient(38% 44% at var(--px, 50%) var(--py, 40%), rgba(244,243,240,0.34), transparent 68%)",
          }}
        />
        <div className="absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgba(244,243,240,0.055)_0_1px,transparent_1px_8.3333%)]" />
        <div className="grain absolute inset-0 opacity-60" />
      </div>

      {/* ── The composition ──────────────────────────────────────────────── */}
      <motion.div
        style={reduce ? undefined : { y: textY, opacity: fade }}
        className="relative z-10 flex flex-1 flex-col px-5 pb-8 pt-28 sm:px-8 lg:px-[clamp(1.75rem,5vw,4.5rem)] lg:pt-32"
      >
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUXE, delay: 0.15 }}
          className="flex items-center gap-3 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-alabaster/55"
        >
          <span aria-hidden className="h-px w-8 bg-cinabre-3" />
          {kicker}
        </motion.p>

        <div className="mt-10 grid flex-1 items-center gap-12 lg:mt-0 lg:grid-cols-12 lg:gap-10">
          {/* Statement */}
          <div className="lg:col-span-7">
            <h1 className="font-display text-[clamp(2.9rem,10.4vw,8.6rem)] leading-[0.88] tracking-[-0.045em] text-alabaster">
              {lines.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <motion.span
                    className="block"
                    initial={reduce ? false : { y: "108%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.15, ease: EASE_LUXE, delay: 0.25 + i * 0.09 }}
                  >
                    {i === lines.length - 1 ? <em className="italic text-cinabre-3">{line}</em> : line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_LUXE, delay: 0.62 }}
              className="mt-8 max-w-[34rem] text-[1.0625rem] leading-[1.7] text-alabaster/70"
            >
              {lead}
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_LUXE, delay: 0.74 }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              <Link href={primary.href} className="btn-pale">
                {primary.label} <ArrowRightIcon size={13} className="rtl:rotate-180" />
              </Link>
              <Link href={secondary.href} className="cine-cta">
                {secondary.label}
              </Link>
            </motion.div>
          </div>

          {/* Index of the rayons — the instrument's readout. */}
          <motion.aside
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_LUXE, delay: 0.55 }}
            className="lg:col-span-5 lg:justify-self-end lg:pb-4"
          >
            <div className="glass-night w-full max-w-[26rem] border border-film-line p-5 backdrop-blur-md lg:p-6">
              <p className="flex items-center justify-between font-mono text-[0.5625rem] uppercase tracking-[0.22em] text-alabaster/50">
                <span>Les rayons</span>
                <span className="num">{rayons.reduce((n, r) => n + r.count, 0)} réf.</span>
              </p>
              <ul className="mt-4">
                {rayons.map((r, i) => (
                  <li key={r.slug}>
                    <Link
                      href={`/univers/${r.slug}`}
                      className="group flex items-baseline gap-4 border-t border-film-line py-3 transition-colors"
                    >
                      <span className="num text-[0.625rem] text-cinabre-3">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-display text-[1.05rem] text-alabaster/90 transition-colors group-hover:text-alabaster">
                        {r.name}
                      </span>
                      <span className="num text-[0.625rem] text-alabaster/40 transition-colors group-hover:text-alabaster/80">
                        {r.count}
                      </span>
                      <ArrowRightIcon
                        size={12}
                        className="-translate-x-1 text-cinabre-3 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-2 font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-alabaster/40">
                <span aria-hidden className="alive-dot" />
                Conseil de pharmacien inclus
              </p>
            </div>
          </motion.aside>
        </div>

        {/* The rail of measured facts. */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: EASE_LUXE, delay: 0.95 }}
          className="mt-12 grid gap-px border-t border-film-line pt-5 sm:grid-cols-3"
        >
          {facts.map((f) => (
            <p key={f} className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-alabaster/45">
              {f}
            </p>
          ))}
        </motion.div>
      </motion.div>

      {/* The cue. */}
      <div aria-hidden className="absolute bottom-5 end-6 z-10 hidden items-end gap-3 lg:flex">
        <span className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-alabaster/40">Défiler</span>
        <ArrowDownIcon size={14} className="text-cinabre-3" />
      </div>
    </section>
  );
}
