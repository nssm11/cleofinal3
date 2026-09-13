import Link from "next/link";
import { Specimen } from "./specimen";
import { CoupeLabel } from "./parts";
import type { ProductCard } from "@/lib/catalog";

/**
 * PLANCHE 04 — LES ARRIVAGES.
 *
 * The week's real goods stood on a single stone line, in receipt order — no
 * carousel, no cards: the page itself is the shelf. Desktop reads the line at a
 * glance (six objects, one shared rail); the phone walks it with the thumb.
 */
export function Arrivages({ t, items, ctaHref }: { t: { index: string; title: string; sub: string; cta: string; swipe: string }; items: ProductCard[]; ctaHref: string }) {
  if (items.length < 2) return null;
  return (
    <section id="planche-arrivages" aria-label={t.title} className="border-b border-stone bg-plaster">
      <div className="mx-auto w-full max-w-[108rem] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <div>
            <CoupeLabel>{t.index}</CoupeLabel>
            <h2 className="mt-2.5 font-display text-[clamp(1.5rem,3vw,2.3rem)] uppercase leading-none tracking-[0.01em] text-ink">{t.title}</h2>
          </div>
          <p className="max-w-[36ch] text-[12px] leading-relaxed text-muted lg:text-right">{t.sub}</p>
        </div>

        <div className="scrollbar-none mt-10 -mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex w-max min-w-full items-stretch gap-x-6 border-t border-stone pt-6 lg:grid lg:grid-cols-6 lg:gap-x-7 lg:border-t-0 lg:pt-6">
            {items.slice(0, 6).map((p, i) => (
              <li key={p.id} className="w-[64vw] shrink-0 snap-start sm:w-[36vw] lg:w-auto">
                <Specimen p={p} tight sizes="(max-width:1024px) 64vw, 15vw" aspect="aspect-[4/5]" overline={`Nº ${String(i + 1).padStart(2, "0")}`} />
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5 flex items-center justify-between gap-6">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-2 lg:hidden">{t.swipe}</p>
          <Link href={ctaHref} className="btn-ghost ml-auto">
            {t.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
