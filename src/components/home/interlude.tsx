"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";

/**
 * HM - INTERLUDE - a pinned breath between chapters.
 *
 * The photograph holds the screen for a scroll while the statement arrives
 * line by line, then the invitation. Scroll is the shutter. Stillness on
 * reduced motion: the full frame, composed, at rest.
 */

export function Interlude({
  statement,
  caption,
  cta,
  image,
}: {
  statement: string;
  caption: string;
  cta: { href: string; label: string };
  image?: { src: string; alt: string };
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const lines = statement.split("\n").map((l) => l.trim()).filter(Boolean);

  const bgScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);
  const veil = useTransform(scrollYProgress, [0, 0.6], [0.34, 0.58]);

  // Each line owns a third of the pin; the invitation owns the last.
  const segs = [
    { o: useTransform(scrollYProgress, [0.02, 0.2], [0, 1]), y: useTransform(scrollYProgress, [0.02, 0.2], [46, 0]) },
    { o: useTransform(scrollYProgress, [0.26, 0.46], [0, 1]), y: useTransform(scrollYProgress, [0.26, 0.46], [46, 0]) },
    { o: useTransform(scrollYProgress, [0.52, 0.74], [0, 1]), y: useTransform(scrollYProgress, [0.52, 0.74], [46, 0]) },
  ];
  const ctaO = useTransform(scrollYProgress, [0.66, 0.88], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.66, 0.88], [34, 0]);

  if (reduce) {
    return (
      <section aria-label={caption} className="relative overflow-hidden bg-ink">
        <div className="relative mx-auto max-w-[110rem]">
          {image && (
            <div className="absolute inset-0" aria-hidden>
              <Image src={image.src} alt="" fill sizes="100vw" className="object-cover opacity-55" />
            </div>
          )}
          <div className="relative px-5 py-28 text-center sm:px-10 lg:py-40">
            {lines.map((l, i) => (
              <p key={i} className="hm-display font-light leading-[1.08] text-paper" style={{ fontSize: "clamp(2rem, 5.5vw, 4.6rem)" }}>
                {l}
              </p>
            ))}
            <p className="hm-kicker mt-8 justify-center text-paper/60">{caption}</p>
            <Link
              href={cta.href}
              className="group mt-8 inline-flex items-center gap-3 border border-paper/35 px-9 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-paper transition-colors duration-500 hover:border-champagne-3 hover:text-champagne-3"
            >
              {cta.label}
              <ArrowRightIcon size={14} className="rtl-mirror transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} aria-label={caption} className="relative h-[240vh] bg-ink">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {image && (
          <motion.div style={{ scale: bgScale }} data-reveal="" className="absolute inset-0" aria-hidden>
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" priority={false} />
          </motion.div>
        )}
        <motion.span aria-hidden style={{ opacity: veil }} className="absolute inset-0 bg-ink" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink/60" />

        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center sm:px-10">
          {lines.map((l, i) => {
            const s = segs[Math.min(i, segs.length - 1)];
            return (
              <motion.p
                key={i}
                data-reveal=""
                style={{ opacity: s.o, y: s.y, fontSize: "clamp(2.1rem, 6vw, 5.2rem)" }}
                className="hm-display font-light leading-[1.1] text-paper"
              >
                {l}
              </motion.p>
            );
          })}
          <motion.div data-reveal="" style={{ opacity: ctaO, y: ctaY }} className="mt-10 flex flex-col items-center">
            <p className="hm-kicker justify-center text-paper/60">{caption}</p>
            <Link
              href={cta.href}
              className="group mt-7 inline-flex items-center gap-3 border border-paper/35 px-9 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-paper backdrop-blur-sm transition-all duration-500 hover:border-champagne-3 hover:text-champagne-3"
            >
              {cta.label}
              <ArrowRightIcon size={14} className="rtl-mirror transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
