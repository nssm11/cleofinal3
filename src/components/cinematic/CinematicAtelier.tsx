"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_LUXE } from "@/lib/motion";

const FEATURED_BRANDS = [
  { name: "La Roche-Posay", slug: "la-roche-posay" },
  { name: "Caudalie", slug: "caudalie" },
  { name: "Bioderma", slug: "bioderma" },
  { name: "Filorga", slug: "filorga" },
  { name: "Avène", slug: "avene" },
  { name: "SVR", slug: "svr" },
  { name: "Vichy", slug: "vichy" },
  { name: "Nuxe", slug: "nuxe" },
  { name: "Isdin", slug: "isdin" },
  { name: "Eucerin", slug: "eucerin" },
  { name: "Mustela", slug: "mustela" },
  { name: "Klorane", slug: "klorane" },
] as const;

export function CinematicAtelier() {
  const reduce = useReducedMotion();

  return (
    <section
      id="atelier"
      data-header-theme="light"
      className="relative overflow-hidden bg-[#F6EFE6] py-24 text-[#211B12] sm:py-32 lg:py-40"
      aria-label="L'Atelier dermatologique et les Maisons"
    >
      <div className="mx-auto max-w-[88rem] px-6 sm:px-8 lg:px-12">
        {/* ── Section Index Header ─────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#211B12]/10 pb-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8C7C5C]">
            <span>02 / FORMULATION</span>
            <span className="h-px w-8 bg-[#8C7C5C]/40" />
            <span>L&apos;ATELIER DERMO-COSMÉTIQUE</span>
          </div>
          <span className="text-[11px] font-medium tracking-[0.16em] text-[#8C7C5C]/80">
            COMPTOIR PHARMACEUTIQUE · HAMMAM-LIF & EZZAHRA
          </span>
        </div>

        {/* ── Asymmetric Architectural Grid ────────────────────────── */}
        <div className="mt-16 grid items-center gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-16">
          {/* Left Photographic Frame */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, ease: EASE_LUXE }}
            className="group relative aspect-[4/5] w-full overflow-hidden bg-[#ECE4D3] lg:col-span-5"
          >
            <Image
              src="/images/atelier.jpg"
              alt="L'Atelier de consultation Cléopâtre"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#211B12]/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#ECD9A4]">
                LIEU DE PRATIQUE
              </span>
              <p className="font-film mt-1.5 text-[18px] font-light text-[#FAF7F0]">
                L&apos;Atelier de consultation — Comptoir d&apos;Hammam-Lif
              </p>
            </div>
          </motion.div>

          {/* Right Editorial Narrative */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.32em] text-[#A3803F]">
              LES MAISONS DE FORMULATION
            </span>

            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: EASE_LUXE }}
              className="font-film mt-5 text-[clamp(1.9rem,3.8vw,3.25rem)] font-light leading-[1.12] tracking-[-0.015em] text-[#211B12]"
            >
              L&apos;alliance des plus grands laboratoires de la dermo-cosmétique mondiale.
            </motion.h2>

            <p className="mt-6 text-[15px] leading-relaxed text-[#5A5142] sm:text-[16px]">
              Nous réunissons les maisons qui ont inventé la dermo-cosmétique contemporaine. Des formules brevetées, testées sous contrôle dermatologique et pédiatrique, réputées pour la pureté de leurs molécules actives et leur innocuité cutanée.
            </p>

            {/* Typographic Brand Wall */}
            <div className="mt-10 border-y border-[#211B12]/10 py-6 sm:mt-12 sm:py-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#8C7C5C]">
                SÉLECTION OFFICIELLE EN OFFICINE
              </p>
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-4">
                {FEATURED_BRANDS.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/marque/${b.slug}`}
                    className="group flex items-center justify-between text-[13px] font-medium tracking-[0.04em] text-[#38322A] transition-colors duration-200 hover:text-[#A3803F]"
                  >
                    <span>{b.name}</span>
                    <span className="text-[11px] text-[#A3803F] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Pharmacist Quote */}
            <div className="mt-8 flex items-start gap-4">
              <span className="font-film text-[32px] leading-none text-[#A3803F]/60">«</span>
              <p className="font-film text-[15px] italic leading-relaxed text-[#3A3327]">
                À l&apos;officine, nous n&apos;écoutons pas les effets de mode éphémères. Nous exigeons des études cliniques en double aveugle et des formules qui respectent l&apos;écologie vivante de la peau.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-wrap items-center gap-6 sm:gap-8">
              <Link
                href="/marques"
                className="group inline-flex items-center gap-3 border border-[#211B12]/20 bg-[#F6EFE6] px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#211B12] transition-all duration-300 hover:border-[#A3803F] hover:bg-[#EBE1CB] hover:text-[#A3803F]"
              >
                <span>Toutes les Maisons</span>
                <ArrowRightIcon
                  size={13}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>

              <Link
                href="/aide"
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#71664F] transition-colors duration-300 hover:text-[#211B12]"
              >
                Demander un Conseil →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
