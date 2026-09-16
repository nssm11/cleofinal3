"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";
import { ArrowRightIcon } from "@/components/icons";

/**
 * THE CHAPTER HEAD — the title sequence of Visage.
 *
 * The word "Visage" is set up and to the left — the inscription of a room,
 * not a campaign billboard — on the house's near-black, with the room's our
 * story to its right and, above, a narrow literal window of the chapter's
 * own footage. The frame is proof, never the point; the point is that the
 * visitor has walked into a specific room, and can see its whole plan at a
 * glance: its place among the seven rooms, its concerns, and the honest
 * count of what it holds.
 */

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };
const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_LUXE } },
};
const maskRise = {
  hidden: { y: "108%" },
  show: { y: "0%", transition: { duration: 1.25, ease: EASE_LUXE } },
};
const veilIn = {
  hidden: { opacity: 0, scale: 1.015 },
  show: { opacity: 1, scale: 1, transition: { duration: 1.5, ease: EASE_LUXE } },
};

export function VisageHeader({
  name,
  kicker,
  index,
  total,
  story,
  description,
  capture,
  prisms,
  totalRef,
}: {
  name: string;
  kicker: string;
  index: string;
  total: string;
  story: string;
  description: string | null;
  capture: string;
  prisms: { slug: string; name: string }[];
  totalRef: number;
}) {
  const reduce = useReducedMotion();
  const refNum = totalRef <= 0 ? "—" : String(totalRef);
  const concernHref = (slug: string) => `/univers/visage?concerns=${slug}&all=1#shelf`;
  const statement = story || (description ?? "");
  const caption = description || story;

  return (
    <div className="relative overflow-hidden border-b border-cine-line bg-noir text-cine-ivory">
      {/* A faint warm light from the east, and the room's grain. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 48% at 84% -8%, rgba(201,168,106,0.16), rgba(201,168,106,0.05) 46%, transparent 74%)",
          }}
        />
        <div className="grain absolute inset-0 opacity-60" />
      </div>

      <div className="relative container-wide pb-14 pt-[7.4rem] lg:pb-24 lg:pt-40">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          {/* ── Inscription ───────────────────────────────────────────── */}
          <motion.div
            variants={reduce ? undefined : container}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="lg:col-span-6"
          >
            <motion.p variants={reduce ? undefined : rise} className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="font-display text-[clamp(1.35rem,2.4vw,1.9rem)] italic leading-none text-cine-gold">
                {index}
                <span className="text-[0.5em] text-cine-faint"> / {total}</span>
              </span>
              <span className="cine-kicker">{kicker}</span>
            </motion.p>

            <div className="mt-7 overflow-hidden pb-[0.1em]">
              <motion.h1
                variants={reduce ? undefined : maskRise}
                className="font-display text-[clamp(3.2rem,9.4vw,8rem)] font-light leading-[0.92] tracking-[-0.024em] text-cine-ivory"
              >
                {name}
              </motion.h1>
            </div>

            <motion.p
              variants={reduce ? undefined : rise}
              className="mt-7 max-w-[46ch] font-display text-[clamp(1.3rem,2.3vw,1.8rem)] font-light italic leading-[1.42] text-cine-mist"
            >
              «&thinsp;{statement}&thinsp;»
            </motion.p>

            <motion.div
              variants={reduce ? undefined : rise}
              className="mt-11 flex flex-wrap items-center gap-x-9 gap-y-5 border-t border-cine-line pt-7"
            >
              <Link
                href="/univers/visage?all=1"
                className="group inline-flex items-center gap-3 font-display text-[clamp(1.2rem,2vw,1.55rem)] italic leading-none text-cine-ivory transition-colors duration-500 hover:text-cine-gold"
              >
                {refNum} références
                <span className="h-px w-10 bg-cine-line transition-all duration-500 group-hover:w-14 group-hover:bg-cine-gold" />
              </Link>
              <span className="hidden text-cine-faint sm:inline" aria-hidden>
                ·
              </span>
              <Link href="/diagnostic" className="group inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-cine-mist transition-colors duration-300 hover:text-cine-ivory">
                Un diagnostic pour vous guider
                <ArrowRightIcon size={12} strokeWidth={1.5} className="rtl-mirror transition-transform duration-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* ── The frame and the concerns ─────────────────────────────── */}
          <motion.div variants={reduce ? undefined : container} initial={reduce ? false : "hidden"} animate="show" className="lg:col-span-6">
            <motion.div variants={reduce ? undefined : veilIn} className="relative overflow-hidden bg-noir-2">
              <div className="aspect-[16/10] w-full">
                <Image src={capture} alt={`Visage — ${name}`} fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
              </div>
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(13,11,8,0.1), transparent 34%), linear-gradient(0deg, rgba(13,11,8,0.5), transparent 36%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.3em] text-cine-faint">Le chapitre</span>
                <span className="max-w-[70%] text-right font-display text-[15px] italic leading-snug text-cine-ivory/90">{caption}</span>
              </div>
            </motion.div>

            {/* The concerns — printed straight on the film, not boxed. */}
            <motion.div variants={reduce ? undefined : rise} className="mt-4 grid grid-cols-2 gap-px bg-cine-line/60">
              {prisms.map((c) => (
                <Link
                  key={c.slug}
                  href={concernHref(c.slug)}
                  className="group flex items-center justify-between gap-2 bg-noir px-3 py-3 transition-colors duration-300 hover:bg-noir-2"
                >
                  <span className="truncate font-display text-[14px] italic text-cine-mist transition-colors group-hover:text-cine-ivory">{c.name}</span>
                  <ArrowRightIcon
                    size={12}
                    strokeWidth={1.5}
                    className="rtl-mirror shrink-0 text-cine-faint transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-cine-gold rtl:group-hover:-translate-x-0.5"
                  />
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
