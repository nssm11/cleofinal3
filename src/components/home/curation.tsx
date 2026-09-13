"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import type { ProductCard as PC } from "@/lib/catalog";
import { AtelierPetit } from "./product-atelier";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * HM · L'ÉTALAGE — the season on one shelf, behind two tabs.
 *
 * The pinned journey is gone: the calendar's vitrine and the fortnight's
 * arrivals share a single compact grid, four references at a time, and a
 * sliding rule says which side of the counter you're on. Small, sharp,
 * and over in one screen.
 */

export type Shelf = {
  id: number;
  title: string;
  subtitle: string | null;
  items: PC[];
} | null;

type Copy = {
  shelfEyebrow: string;
  newEyebrow: string;
  newTitle: string;
  newDesc: string;
  viewAll: string;
  newestHref: string;
};

const TAKE = 4;

export function Curation({
  shelf, novelties, copy, isAuthed = false,
}: {
  shelf: Shelf;
  novelties: PC[];
  copy: Copy;
  isAuthed?: boolean;
}) {
  const reduce = useReducedMotion();
  const shelfItems = (shelf?.items ?? []).slice(0, TAKE);
  const fresh = novelties.slice(0, TAKE);
  const hasShelf = shelf !== null && shelfItems.length > 0;
  const hasFresh = fresh.length > 0;
  const [tab, setTab] = useState<"shelf" | "fresh">(hasShelf ? "shelf" : "fresh");

  if (!hasShelf && !hasFresh) return null;
  const active = tab === "shelf" && hasShelf ? "shelf" : "fresh";
  const list = active === "shelf" ? shelfItems : fresh;
  const title = active === "shelf" ? (shelf?.title ?? "") : copy.newTitle;
  const text = active === "shelf" ? shelf?.subtitle : copy.newDesc;
  const tabs = hasShelf && hasFresh;

  return (
    <section aria-label={hasShelf ? copy.shelfEyebrow : copy.newTitle} className="relative">
      <div className="container-wide py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            {tabs ? (
              <div role="tablist" aria-label={copy.newTitle} className="flex items-baseline gap-8 border-b border-stone/60 sm:gap-12">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active === "shelf"}
                  onClick={() => setTab("shelf")}
                  className={`relative pb-4 font-display text-[clamp(1.35rem,2.6vw,1.9rem)] transition-colors duration-300 ${active === "shelf" ? "text-ink" : "text-muted-2 hover:text-muted"}`}
                >
                  {copy.shelfEyebrow}
                  <span className="ml-2 align-super text-[11px] font-bold tabular-nums tracking-[0.1em] text-champagne-2">{shelfItems.length}</span>
                  {active === "shelf" && (
                    <motion.span layoutId="hm-etalage-rule" transition={reduce ? { duration: 0 } : { duration: D.base, ease: EASE_LUXE }} className="absolute inset-x-0 -bottom-px h-[2px] bg-champagne-2" />
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active === "fresh"}
                  onClick={() => setTab("fresh")}
                  className={`relative pb-4 font-display text-[clamp(1.35rem,2.6vw,1.9rem)] transition-colors duration-300 ${active === "fresh" ? "text-ink" : "text-muted-2 hover:text-muted"}`}
                >
                  {copy.newEyebrow}
                  <span className="ml-2 align-super text-[11px] font-bold tabular-nums tracking-[0.1em] text-champagne-2">{fresh.length}</span>
                  {active === "fresh" && (
                    <motion.span layoutId="hm-etalage-rule" transition={reduce ? { duration: 0 } : { duration: D.base, ease: EASE_LUXE }} className="absolute inset-x-0 -bottom-px h-[2px] bg-champagne-2" />
                  )}
                </button>
              </div>
            ) : (
              <div className="border-b border-stone/60 pb-4">
                <p className="hm-kicker text-muted">{hasShelf ? copy.shelfEyebrow : copy.newEyebrow}</p>
              </div>
            )}
          </Reveal>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              data-reveal=""
              role="tabpanel"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: reduce ? 0 : D.fast, ease: EASE_LUXE }}
            >
              <div className="mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                <div className="min-w-0">
                  <h3 className="hm-display text-[clamp(1.5rem,2.8vw,2.1rem)] text-ink">{title}</h3>
                  {text && <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-muted">{text}</p>}
                </div>
                {active === "fresh" && (
                  <Link href={copy.newestHref} className="btn-ghost !min-h-11 shrink-0">
                    {copy.viewAll} <ArrowRightIcon size={13} className="rtl-mirror" />
                  </Link>
                )}
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                {list.map((p) => (
                  <AtelierPetit key={p.id} p={p} isAuthed={isAuthed} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
