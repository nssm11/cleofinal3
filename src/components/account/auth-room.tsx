"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MaskLine, Reveal } from "@/components/motion/reveal";

/* ══════════════════════════════════════════════════════════════════════════
   LE SEUIL — the door of the house.
   ──────────────────────────────────────────────────────────────────────────
   Every private page is built the same way: a film on one side, a ledger on the
   other. The film carries the atmosphere (the counter, the mirror, the street
   of Ez Zahra) with the statement of the page written across it; the ledger
   carries the work — the fields, the buttons, the truth — on porcelain, ruled
   like a register, never boxed into a centred white card.

   On phones the door becomes a masthead: 46svh of film, then the ledger under
   it, so the form is never pushed below a fold of decoration.
   ══════════════════════════════════════════════════════════════════════════ */

export type AuthLine = { t: string; em?: boolean };

export function AuthRoom({
  film,
  filmMobile,
  poster,
  kicker,
  lines,
  caption,
  facts,
  flip,
  rail = "ESPACE PRIVÉ — ACCÈS SÉCURISÉ",
  children,
}: {
  film?: string;
  filmMobile?: string;
  poster?: string;
  kicker: string;
  lines: AuthLine[];
  caption: string;
  facts: readonly (readonly string[])[];
  flip?: boolean;
  rail?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduce) {
      v.pause();
      v.removeAttribute("autoplay");
      return;
    }
    v.play().catch(() => {});
  }, [reduce]);

  return (
    <div className="relative bg-obsidian lg:grid lg:grid-cols-12">
      {/* ── THE FILM ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative min-h-[52svh] overflow-hidden lg:col-span-7 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:self-start",
          flip && "lg:order-2",
        )}
      >
        {poster && <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${poster})` }} />}
        {!film && (
          <div
            aria-hidden
            className="night-field absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(120% 90% at 8% 0%, rgba(217,58,16,0.30), transparent 58%), radial-gradient(80% 60% at 90% 100%, rgba(255,122,74,0.14), transparent 60%)",
            }}
          />
        )}
        {film && (
          <video
            ref={ref}
            aria-hidden
            autoPlay={!reduce}
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            onPlaying={() => setLive(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ease-[var(--ease-calm)]",
              live && !reduce ? "opacity-100" : "opacity-0",
            )}
          >
            {filmMobile && <source src={filmMobile} media="(max-width: 640px)" type="video/mp4" />}
            <source src={film} type="video/mp4" />
          </video>
        )}

        {/* Atmosphere: two veils, a warm halo, grain, the ruling. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top, rgba(8,8,10,0.97) 0%, rgba(8,8,10,0.86) 22%, rgba(9,9,11,0.62) 52%, rgba(9,9,11,0.72) 78%, rgba(9,9,11,0.9) 100%)",
          }}
        />
        <div aria-hidden className="absolute inset-0 bg-night/20" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(70% 55% at 6% 4%, rgba(217,58,16,0.20), transparent 66%)" }}
        />
        <div aria-hidden className="grain absolute inset-0" />
        <div aria-hidden className="hairlines absolute inset-0 hidden opacity-40 lg:block" />
        {/* The seam: one hairline of cinabre where the film meets the register. */}
        <span
          aria-hidden
          className={cn("absolute inset-y-0 hidden w-px bg-cinabre/45 lg:block", flip ? "left-0" : "right-0")}
        />

        <div className="relative flex h-full min-h-[52svh] flex-col justify-between gap-10 p-6 sm:p-10 lg:p-14">
          <Reveal y={0} amount={0.01}>
            <p className="flex items-center gap-3 font-mono text-[0.5625rem] uppercase tracking-[0.26em] text-haze-2">
              <span aria-hidden className="h-px w-8 bg-cinabre-3" />
              Maison de dermo-cosmétique
            </p>
          </Reveal>

          <div className="max-w-[34rem]">
            <Reveal y={0} amount={0.01} delay={0.08}>
              <p className="flex items-center gap-3 font-mono text-[0.5625rem] uppercase tracking-[0.26em] text-haze-2">
                <span aria-hidden className="h-px w-8 bg-cinabre-3" />
                {kicker}
              </p>
            </Reveal>
            <h2 className="mt-6 font-display text-[clamp(2.1rem,5.6vw,3.9rem)] leading-[0.98] tracking-[-0.032em] text-alabaster">
              {lines.map((l, i) => (
                <span key={l.t} className="block overflow-hidden pb-[0.06em]">
                  <MaskLine delay={0.16 + i * 0.1}>
                    {l.em ? <em className="text-cinabre-3">{l.t}</em> : l.t}
                  </MaskLine>
                </span>
              ))}
            </h2>
            <Reveal y={12} delay={0.3} amount={0.01}>
              <p className="mt-6 max-w-[46ch] text-[0.9375rem] leading-relaxed text-haze">{caption}</p>
            </Reveal>
          </div>

          <dl className="hidden grid-cols-4 gap-x-6 border-t border-white/12 pt-5 lg:grid">
            {facts.map(([n, l], i) => (
              <div key={`${l}-${i}`}>
                <dt className="num text-[0.9375rem] text-alabaster">{n}</dt>
                <dd className="mt-1 font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.16em] text-haze-2">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p
          aria-hidden
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 font-mono text-[0.5625rem] uppercase tracking-[0.4em] text-haze-3 lg:block"
          style={{ writingMode: "vertical-rl" }}
        >
          {rail}
        </p>
      </div>

      {/* ── THE LEDGER ───────────────────────────────────────────────────── */}
      <div className={cn("relative flex flex-col bg-porcelain lg:col-span-5", flip && "lg:order-1")}>
        <div aria-hidden className="graticule pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="relative flex flex-1 flex-col px-6 pb-28 pt-10 sm:px-10 lg:justify-center lg:px-14 lg:py-20">
          <div className="w-full max-w-[27rem]">
            <div className="mb-10 flex items-center justify-between gap-4 border-b border-rule pb-4 font-mono text-[0.5625rem] uppercase tracking-[0.22em]">
              <span className="text-ink">Le seuil</span>
              <Link href="/aide" className="link-underline text-graphite transition-colors hover:text-ink">
                Besoin d&apos;aide ?
              </Link>
            </div>
            {children}
          </div>
        </div>
        <div className="relative border-t border-rule px-6 py-5 sm:px-10 lg:px-14">
          <p className="font-mono text-[0.5625rem] uppercase leading-relaxed tracking-[0.16em] text-ash">
            Une hésitation ? 71 450 220 — nos pharmaciens répondent du lundi au samedi, 8 h 30 → 20 h 30.
          </p>
        </div>
      </div>
    </div>
  );
}

/** The heading of a ledger page: a kicker, a display line, an optional lead. */
export function LedgerHead({ kicker, title, em, lead }: { kicker: string; title: string; em?: string; lead?: string }) {
  return (
    <header>
      <p className="rule-label">{kicker}</p>
      <h1 className="mt-5 font-display text-[clamp(1.9rem,3.6vw,2.65rem)] leading-[1.04] tracking-[-0.028em] text-ink">
        {title}
        {em ? (
          <>
            {" "}
            <em className="text-cinabre-2">{em}</em>
          </>
        ) : null}
      </h1>
      {lead && <p className="mt-4 max-w-[42ch] text-[0.9375rem] leading-relaxed text-graphite">{lead}</p>}
    </header>
  );
}

/** The small print under a form: a switch to the other door. */
export function LedgerSwitch({ label, cta, href }: { label: string; cta: string; href: string }) {
  return (
    <p className="mt-8 border-t border-rule pt-6 text-[0.8125rem] text-graphite">
      {label}{" "}
      <Link href={href} className="link-underline font-medium text-ink transition-colors hover:text-cinabre-2">
        {cta}
      </Link>
    </p>
  );
}
