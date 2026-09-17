"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * THE INTERLUDE — the film breathes.
 *
 * A full-bleed editorial frame between commerce and counsel: the universe's
 * own photograph, slowly developing as it arrives, the story set over it in
 * the display face, and one quiet door to the diagnostic.
 */
export function VisageEditorial({
  image,
  name,
  story,
  copy,
}: {
  image: string | null;
  name: string;
  story: string;
  copy: Copy;
}) {
  const reduce = useReducedMotion();
  return (
    <section aria-label={name} className="relative overflow-hidden bg-night">
      <div className="relative flex min-h-[82svh] items-center justify-center overflow-hidden">
        {image && (
          <motion.div
            aria-hidden
            initial={reduce ? false : { scale: 1.08, opacity: 0.6 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-night/55" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-transparent to-night" />
        <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-60" />
        <motion.figure
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="container-wide relative z-10 flex flex-col items-center py-24 text-center"
        >
          <span className="cine-kicker" aria-hidden>
            {name}
          </span>
          <blockquote className="cine-title mt-7 max-w-[24ch] text-balance">
            «&nbsp;{story}&nbsp;»
          </blockquote>
          <Link href="/diagnostic" className="cine-cta mt-10">
            {copy.footer.links.diagnostic}
            <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
          </Link>
        </motion.figure>
      </div>
    </section>
  );
}
