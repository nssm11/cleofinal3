"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";

/**
 * HM · LE PROPOS — the manifesto.
 *
 * The house statement inks itself word by word as the visitor reads down —
 * scroll is the pen. Then the four promises stand as a quiet hairline ledger:
 * no boxes, no icons, only numerals and sentences.
 */

function Word({
  children,
  progress,
  range,
  accent = false,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  accent?: boolean;
}) {
  const opacity = useTransform(progress, range, [0.13, 1]);
  return (
    <motion.span data-reveal="" style={{ opacity }} className={`hm-word ${accent ? "italic text-champagne-2" : ""}`}>
      {children}
    </motion.span>
  );
}

export function Manifesto({
  eyebrow,
  lines,
  accentLine,
  text,
  promises,
}: {
  eyebrow: string;
  lines: [string, string];
  accentLine: string;
  text: string;
  promises: { n: string; t: string; d: string }[];
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88", "end 0.42"] });

  const words = [...lines[0].split(" "), ...lines[1].split(" ")];
  const accentWords = accentLine.split(" ");
  const total = words.length + accentWords.length;
  const at = (i: number): [number, number] => [i / total, Math.min(1, (i + 1.6) / total)];
  const mainRanges = words.map((_, i) => at(i));
  const accentRanges = accentWords.map((_, j) => at(words.length + j));

  return (
    <section aria-label={eyebrow} className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(50% 60% at 50% 0%, rgba(238,226,201,0.55), transparent 70%)" }}
        />
        <div className="grain absolute inset-0" />
      </div>

      <div className="relative container-wide pb-16 pt-20 sm:pt-24 lg:pb-24 lg:pt-32">
        <Reveal>
          <p className="hm-kicker text-muted">{eyebrow}</p>
        </Reveal>

        <div ref={ref} className="mt-8 max-w-5xl lg:mt-10">
          <p className="hm-display text-[clamp(2.2rem,6vw,4.6rem)] text-ink" aria-label={`${lines[0]} ${lines[1]} ${accentLine}`}>
            {reduce ? (
              <span aria-hidden>
                {lines[0]} {lines[1]} <span className="italic text-champagne-2">{accentLine}</span>
              </span>
            ) : (
              <span aria-hidden>
                {words.map((w, i) => (
                  <Word key={`w${i}`} progress={scrollYProgress} range={mainRanges[i]}>
                    {w}
                  </Word>
                ))}
                {accentWords.map((w, i) => (
                  <Word key={`a${i}`} progress={scrollYProgress} range={accentRanges[i]} accent>
                    {w}
                  </Word>
                ))}
              </span>
            )}
          </p>
          <Reveal delay={0.1}>
            <span aria-hidden className="mt-8 block h-px w-24 bg-champagne-3" />
            <p className="mt-6 max-w-xl text-[15.5px] leading-[1.9] text-muted">{text}</p>
          </Reveal>
        </div>

        {/* The ledger of promises */}
        <ul className="mt-14 grid gap-x-10 gap-y-8 border-t border-stone/60 pt-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {promises.map((x, i) => (
            <Reveal as="li" key={x.n} y={14} delay={i * 0.07}>
              <p className="font-display text-[13px] italic text-champagne-2">{x.n}</p>
              <p className="mt-2.5 font-display text-[21px] leading-tight text-ink">{x.t}</p>
              <p className="mt-2.5 text-[13px] leading-[1.75] text-muted">{x.d}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
