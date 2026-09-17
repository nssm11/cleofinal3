"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";

const PILLARS = [
  {
    num: "01",
    tag: "LA RIGUEUR DE L'OFFICINE",
    title: "Science & Innocuité",
    description:
      "Chaque référence est minutieusement auditée par nos docteurs en pharmacie. Nous analysons la biodisponibilité réelle des actifs, leur stabilité clinique et leur innocuité absolue sur les peaux les plus réactives.",
  },
  {
    num: "02",
    tag: "LE CLIMAT MÉDITERRANÉEN",
    title: "Lumière, Sel & Chaleur",
    description:
      "Des protocoles pensés pour les exigences de notre littoral : boucliers antioxydants protecteurs face aux UV, textures fluides respirantes et hydratation osmotique face au vent marin.",
  },
  {
    num: "03",
    tag: "LE CONSEIL INDIVIDUEL",
    title: "Diagnostic & Écoute",
    description:
      "Parce qu'une peau est unique, nous bâtissons des routines sur-mesure. Du bilan dermo-cosmétique en ligne jusqu'à la consultation attentive à nos comptoirs d'Ezzahra et d'Hammam-Lif.",
  },
] as const;

export function CinematicManifesto() {
  const reduce = useReducedMotion();

  return (
    <section
      id="manifeste"
      data-header-theme="light"
      className="relative overflow-hidden bg-[#FAF7F0] py-24 text-[#211B12] sm:py-32 lg:py-40"
      aria-label="Manifeste de la Maison Cléopâtre"
    >
      {/* Subtle organic light gradient & texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(203,176,120,0.12),transparent_70%)]"
      />

      <div className="mx-auto max-w-[88rem] px-6 sm:px-8 lg:px-12">
        {/* ── Top Index Bar ────────────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#211B12]/10 pb-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8C7C5C]">
            <span>01 / PHILOSOPHIE</span>
            <span className="h-px w-8 bg-[#8C7C5C]/40" />
            <span>LA VISION DE LA MAISON</span>
          </div>
          <span className="text-[11px] font-medium tracking-[0.16em] text-[#8C7C5C]/80">
            EZZAHRA · HAMMAM-LIF · DEPUIS NOS COMPTOIRS
          </span>
        </div>

        {/* ── Grand Editorial Statement ────────────────────────────── */}
        <div className="mt-16 max-w-4xl lg:mt-24">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.32em] text-[#A3803F]">
            L&apos;ENGAGEMENT CLÉOPÂTRE
          </p>
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: EASE_LUXE }}
            className="font-film mt-6 text-[clamp(2rem,4.4vw,3.75rem)] font-light leading-[1.12] tracking-[-0.015em] text-[#211B12]"
          >
            « Nous concevons le soin de beauté non comme un artifice passager, mais comme la santé visible, vivante et durable de votre peau. »
          </motion.h2>
          <p className="mt-8 max-w-2xl text-[15px] font-normal leading-relaxed text-[#5A5142] sm:text-[16px]">
            Au carrefour de l&apos;officine pharmaceutique et du rituel d&apos;exception, nous sélectionnons les formules dermo-cosmétiques les plus avancées pour répondre aux défis réels de votre épiderme.
          </p>
        </div>

        {/* ── 3 Architectural Pillars ──────────────────────────────── */}
        <div className="mt-20 grid gap-10 border-t border-[#211B12]/10 pt-16 md:grid-cols-3 lg:mt-28 lg:gap-14">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.num}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: EASE_LUXE }}
              className="group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#211B12]/10 pb-4">
                  <span className="font-film text-[18px] font-light text-[#A3803F]">
                    {p.num}
                  </span>
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#8C7C5C]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-film mt-6 text-[22px] font-normal leading-snug text-[#211B12]">
                  {p.title}
                </h3>
                <p className="mt-4 text-[13.5px] leading-relaxed text-[#5A5142]">
                  {p.description}
                </p>
              </div>

              <div className="mt-8 pt-4">
                <span className="h-px w-8 bg-[#A3803F]/40 transition-all duration-500 group-hover:w-16 group-hover:bg-[#A3803F]" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Editorial Action Band ─────────────────────────────────── */}
        <div className="mt-20 flex flex-col items-start justify-between gap-8 border-t border-[#211B12]/10 pt-12 sm:flex-row sm:items-center lg:mt-28">
          <div className="max-w-md">
            <p className="font-film text-[16px] italic text-[#3A3327]">
              « La dermo-cosmétique est une science d&apos;équilibre. Donner à la barrière cutanée ce dont elle a besoin, exactement quand elle le réclame. »
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C7C5C]">
              Dr. Pharmacien Cléopâtre · Ezzahra
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 sm:gap-8">
            <Link
              href="/diagnostic"
              className="group inline-flex items-center gap-3 border border-[#211B12]/20 bg-[#FAF7F0] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#211B12] transition-all duration-300 hover:border-[#A3803F] hover:bg-[#F2ECDF] hover:text-[#A3803F]"
            >
              <span>Diagnostic de Peau</span>
              <ArrowRightIcon
                size={13}
                strokeWidth={1.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>

            <Link
              href="/boutiques"
              className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#71664F] transition-colors duration-300 hover:text-[#211B12]"
            >
              Nos Deux Boutiques →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
