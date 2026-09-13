import Link from "next/link";
import { CoupeLabel, CoupeRule } from "./parts";
import { fmt } from "@/lib/i18n/config";

/**
 * PLANCHE 05 — L'ORDONNANCE.
 *
 * The house's clinical side, drawn as the ledger a pharmacist actually keeps:
 * needs numbered in sequence, dotted leaders running to the count of products
 * that answer each one, no photographs allowed to decorate a decision. Under
 * the ledger, the four services of the counter as tear-off slips — the paper
 * you would leave with a customer, reproduced in type.
 */
export function Ordonnance({
  t,
  concerns,
  services,
}: {
  t: { index: string; title: string; sub: string; diag: string; services: string; servicesNote: string };
  concerns: { slug: string; name: string; intro: string | null; n: number }[];
  services: { t: string; d: string; href: string; cta: string }[];
}) {
  return (
    <section id="planche-ordonnance" aria-label={t.title} className="reg-wall-shade border-b border-stone">
      <div className="relative mx-auto w-full max-w-[108rem] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* The heading stands as its own column — no box around it. */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <CoupeLabel>{t.index}</CoupeLabel>
              <h2 className="mt-3 font-display text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[1.04] tracking-[0.005em] text-ink">{t.title}</h2>
              <p className="mt-4 max-w-[40ch] text-[13px] leading-[1.85] text-muted">{fmt(t.sub, { n: concerns.length })}</p>
              <Link
                href="/diagnostic"
                className="mt-7 inline-flex min-h-[46px] items-center gap-3 bg-ink px-5 text-[9.5px] font-extrabold uppercase tracking-[0.22em] text-plaster transition-colors duration-500 hover:bg-brass"
              >
                {t.diag} <span aria-hidden className="rtl-mirror">→</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-ink/12">
              {concerns.map((cn2, i) => (
                <li key={cn2.slug} className="border-b border-ink/12">
                  <Link href={`/besoin/${cn2.slug}`} className="group flex items-baseline gap-4 py-2.5 transition-colors duration-300 hover:bg-plaster/60">
                    <span className="w-7 shrink-0 pt-1 font-display text-[11px] italic leading-none text-brass">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[clamp(1.05rem,1.7vw,1.35rem)] leading-snug text-ink transition-colors duration-300 group-hover:text-brass">
                        {cn2.name}
                      </span>
                      {cn2.intro ? <span className="mt-0.5 line-clamp-1 block text-[11.5px] leading-relaxed text-muted">{cn2.intro}</span> : null}
                    </span>
                    <span aria-hidden className="reg-leader hidden sm:block" />
                    <span className="shrink-0 pb-0.5 text-[9.5px] font-extrabold tabular-nums tracking-[0.18em] text-muted-2">
                      {cn2.n}
                    </span>
                    <span aria-hidden className="w-4 shrink-0 pb-0.5 text-right text-[13px] text-ink/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-brass rtl-mirror">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* The tear-off slips of the counter's services. */}
            <div className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
                <CoupeLabel>{t.services}</CoupeLabel>
                <p className="text-[11px] text-muted">{t.servicesNote}</p>
              </div>
              <CoupeRule className="mt-3" />
              <ul className="grid gap-0 sm:grid-cols-2">
                {services.map((s) => (
                  <li key={s.href} className="reg-perf border-b [border-image:none]">
                    <Link href={s.href} className="group flex h-full flex-col justify-between gap-3 bg-plaster-2/40 px-4 py-4 transition-colors duration-500 hover:bg-cream/80 sm:even:border-l sm:even:border-stone/70">
                      <span>
                        <span className="block font-display text-[17px] leading-tight text-ink transition-colors duration-500 group-hover:text-brass">{s.t}</span>
                        <span className="mt-1.5 block text-[11.5px] leading-relaxed text-muted">{s.d}</span>
                      </span>
                      <span className="flex items-center gap-2 text-[8.5px] font-extrabold uppercase tracking-[0.24em] text-charcoal transition-colors duration-300 group-hover:text-brass">
                        {s.cta} <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
