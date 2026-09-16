import Link from "next/link";
import { Fragment } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/reveal";
import { getCopy } from "@/lib/i18n/server";

/**
 * THE APPENDICES — the last film-strip of the chapter.
 *
 * A single measured band restates the offer far from the opening (what the
 * house recommends this instant, the two promises that make it a pharmacy
 * and not a warehouse), then a directory rail sends the visitor to the
 * neighbouring chapters without another grid of boxes.
 */

export async function VisageAppendixStrip() {
  const copy = await getCopy();
  const mm = copy.merch;
  return (
    <section aria-label="La signature Visage" className="border-b border-stone/60 bg-paper">
      <div className="container-wide py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="rule-label mb-6">{mm.roomEyebrow}</p>
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-light italic leading-[1.3] text-charcoal-2">
              {copy.home.promises[1].d}
            </p>
          </Reveal>

          <Reveal y={14} delay={0.08} className="lg:col-span-7">
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {[copy.home.promises[0], copy.home.promises[3]].map((p) => (
                <div key={p.n} className="border-l border-stone/60 pl-5">
                  <p className="flex items-baseline gap-3">
                    <span className="font-display text-[15px] italic leading-none text-champagne-2">{p.n}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{p.t}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              <div className="border-b border-stone/50 pb-4">
                <p className="font-display text-[13px] italic text-champagne-2">{copy.header.navPanel.labs}</p>
                <Link href="/marques" className="mt-2 inline-flex items-center gap-2 text-[13px] text-charcoal transition-colors hover:text-ink">
                  Les maisons du comptoir
                  <ArrowRightIcon size={12} strokeWidth={1.5} className="rtl-mirror" />
                </Link>
              </div>
              <div className="border-b border-stone/50 pb-4">
                <p className="font-display text-[13px] italic text-champagne-2">{copy.header.navPanel.needs}</p>
                <Link href="/diagnostic" className="mt-2 inline-flex items-center gap-2 text-[13px] text-charcoal transition-colors hover:text-ink">
                  Répondre à votre peau
                  <ArrowRightIcon size={12} strokeWidth={1.5} className="rtl-mirror" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export async function VisageDirectory({ others }: { others: { slug: string; name: string }[] }) {
  const copy = await getCopy();
  return (
    <section aria-label="Les autres chapitres" className="border-b border-stone/60 bg-cream/25">
      <div className="container-wide py-10 lg:py-12">
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">
              {copy.univers.otherRooms}
            </span>
            {others.map((o, i) => (
              <Fragment key={o.slug}>
                {i > 0 && <span aria-hidden className="text-sand-2/50">/</span>}
                <Link
                  href={`/univers/${o.slug}`}
                  className="text-[13px] text-muted transition-colors duration-300 hover:text-ink"
                >
                  {o.name}
                </Link>
              </Fragment>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
