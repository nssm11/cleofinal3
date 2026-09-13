import Link from "next/link";
import { CoupeLabel } from "./parts";
import { fmt } from "@/lib/i18n/config";

/**
 * PLANCHE 06 — LES MAISONS.
 *
 * The laboratories as an arcade of signage: two counter-running lines of
 * names, set in the carved display face, walking past like the frontage of a
 * shopping street drawn from memory. Motion is the point — the row breathes,
 * slows on hover, and every name is a door: the marquee carries real links to
 * the real brand pages. Nothing is praised here; the count speaks (it is the
 * number of houses the catalogue actually stocks).
 */
export function Arcades({ t, brands }: { t: { index: string; title: string; sub: string; cta: string }; brands: { slug: string; name: string; country: string | null }[] }) {
  if (brands.length < 4) return null;
  const half = Math.ceil(brands.length / 2);
  const rows = [brands.slice(0, half), brands.slice(half)];
  return (
    <section id="planche-arcades" aria-label={t.title} className="relative overflow-hidden border-y border-stone bg-plaster-2 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[108rem] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <div>
            <CoupeLabel>{t.index}</CoupeLabel>
            <h2 className="mt-2.5 font-display text-[clamp(1.5rem,3vw,2.3rem)] uppercase leading-none tracking-[0.012em] text-ink">
              {fmt(t.title, { n: brands.length })}
            </h2>
          </div>
          <p className="max-w-[44ch] text-[12px] leading-relaxed text-muted">{t.sub}</p>
        </div>
      </div>

      <div className="mt-10 space-y-6 lg:mt-12">
        {rows.map((row, r) => (
          <div key={r} className="reg-marquee">
            <div className={`reg-track ${r === 1 ? "reg-track--reverse" : ""}`} style={{ animationDuration: `${46 + brands.length * 2.5}s` }}>
              {[0, 1].map((dup) => (
                <ul key={dup} className="flex items-baseline gap-x-10 pr-10 xl:gap-x-14 xl:pr-14">
                  {row.map((b, i) => (
                    <li key={`${dup}-${b.slug}`} className="shrink-0">
                      <Link href={`/marque/${b.slug}`} className="group inline-flex items-baseline gap-2.5 whitespace-nowrap">
                        <span
                          className={`font-display uppercase tracking-[0.02em] transition-colors duration-500 group-hover:text-brass ${
                            (i + r) % 4 === 0
                              ? "text-[clamp(1.7rem,4vw,3rem)] text-ink"
                              : (i + r) % 3 === 0
                                ? "text-[clamp(1.2rem,2.3vw,1.9rem)] text-charcoal"
                                : "text-[clamp(1.05rem,1.7vw,1.45rem)] text-charcoal-2"
                          }`}
                        >
                          {b.name}
                        </span>
                        {b.country ? (
                          <sup className="hidden text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted-2 group-hover:text-brass sm:inline">{b.country}</sup>
                        ) : null}
                        <span aria-hidden className="hidden h-1 w-1 shrink-0 rotate-45 bg-brass/50 lg:inline-block" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 w-full max-w-[108rem] px-4 sm:px-6 lg:mt-12 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone pt-5">
          <Link href="/marques" className="btn-ghost">
            {t.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
