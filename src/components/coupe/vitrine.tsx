import Link from "next/link";
import { Specimen } from "./specimen";
import { CoupeLabel, CoupeIndex } from "./parts";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { ProductCard } from "@/lib/catalog";
import type { CoupePromo } from "./types";

/**
 * PLANCHE 03 — LA VITRINE.
 *
 * The one register below grade: the dark street-side case of the house, lit
 * from its own ceiling. Whatever the staff shelf holds today stands behind the
 * glass — objects on a shared ledge under three light cones — and the day's
 * real codes are chalked on the slate beside it. Prices and images remain the
 * catalogue's; only the staging is invented.
 */
export function Vitrine({
  t,
  title,
  subtitle,
  items,
  promos,
}: {
  t: {
    index: string;
    title: string;
    sub: string;
    ardoise: string;
    ardoiseNote: string;
    code: string;
    from: string;
    until: string;
    cta: string;
  };
  title: string;
  subtitle: string | null;
  items: ProductCard[];
  promos: CoupePromo[];
}) {

  return (
    <section id="planche-vitrine" aria-label={title} className="reg-noir relative border-y border-[#100d09] text-paper">
      {/* faint grain + a single brass hairline along the pavement line */}
      <div aria-hidden className="grain absolute inset-0 opacity-50" />
      <div className="relative mx-auto w-full max-w-[108rem] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* The plaque outside the case */}
          <div className="lg:col-span-4">
            <CoupeIndex n="03" className="block text-[clamp(4.5rem,9vw,7.5rem)]" />
            <CoupeLabel light className="mt-2">{t.index}</CoupeLabel>
            <h2 className="mt-4 font-display text-[clamp(1.7rem,3.4vw,2.6rem)] leading-[1.02] tracking-[0.01em] text-paper">{title}</h2>
            <p className="mt-3 max-w-[42ch] text-[12.5px] leading-relaxed text-paper/55">{subtitle ?? t.sub}</p>
            <Link
              href="/promotions"
              className="mt-7 inline-flex min-h-[44px] items-center gap-3 border border-paper/25 px-5 text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-paper transition-colors duration-500 hover:border-brass-2 hover:bg-brass-2 hover:text-ink"
            >
              {t.cta} <span aria-hidden className="rtl-mirror">→</span>
            </Link>
          </div>

          {/* The case itself: one glass, four ledges. */}
          <div className="lg:col-span-8">
            <div className="reg-glass-top relative border border-paper/12 bg-[linear-gradient(180deg,rgba(244,236,216,0.05),transparent_18%)] px-4 pb-5 pt-8 sm:px-8">
              <span aria-hidden className="absolute inset-x-6 -top-8 mx-auto h-16 w-[70%] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(244,236,216,0.18),transparent)] blur-md" />
              <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
                {items.slice(0, 4).map((p, i) => (
                  <li key={p.id}>
                    <Specimen p={p} tone="deep" sizes="(max-width:1024px) 46vw, 21vw" aspect="aspect-[3/4]" priority={i === 0} tight />
                  </li>
                ))}
              </ul>
            </div>

            {/* The slate: real codes, real thresholds, real dates. */}
            {promos.length > 0 && (
              <div className="mt-8">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-brass-2">{t.ardoise}</p>
                  <p className="hidden max-w-[42ch] text-right text-[10.5px] leading-relaxed text-paper/45 sm:block">{t.ardoiseNote}</p>
                </div>
                <ul className="mt-3 grid gap-px border-t border-paper/12 sm:grid-cols-3">
                  {promos.map((p) => (
                    <li key={p.code} className="border-b border-paper/12 py-3.5 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
                      <Link href="/promotions" className="group block">
                        <p className="font-display text-[21px] tracking-[0.08em] text-brass-2 transition-colors group-hover:text-paper">{p.code}</p>
                        <p className="mt-1 line-clamp-1 text-[11.5px] text-paper/60">{p.label}</p>
                        <p className="mt-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.2em] text-paper/40">
                          {p.minSubtotalMillimes > 0 && (
                            <>
                              {t.from} {formatDT(p.minSubtotalMillimes)}
                              {p.endsAt ? " · " : null}
                            </>
                          )}
                          {p.endsAt ? `${t.until} ${formatDate(p.endsAt)}` : null}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
