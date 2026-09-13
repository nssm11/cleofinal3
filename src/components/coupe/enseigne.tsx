import Link from "next/link";
import { CoupeLabel, CoupeIndex } from "./parts";
import { ClockIcon, PhoneIcon } from "@/components/icons";
import type { CoupeStore } from "./types";

/**
 * PLANCHE 08 — L'ENSEIGNE.
 *
 * The page ends the way the street sees the house: two doors set into the
 * wall, each carrying what a passer-by actually needs — name, address, hours,
 * a phone that rings the real shop. No photograph of a storefront is staged;
 * the stones carry the facts. Below the doors, the three house rules re-read
 * at the scale of signage, then the global footer takes over.
 */
export function Enseigne({
  t,
  stores,
  facts,
  helpHref,
}: {
  t: { index: string; title: string; sub: string; call: string; directions: string; hours: string; ctaAll: string; back: string };
  stores: CoupeStore[];
  facts: string[];
  helpHref: string;
}) {
  return (
    <section id="planche-enseigne" aria-label={t.title} className="reg-wall relative border-t border-stone">
      <div aria-hidden className="grain absolute inset-0 opacity-50" />
      <div className="relative mx-auto w-full max-w-[108rem] px-4 pb-16 pt-14 sm:px-6 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-stone-2/60 pb-4">
          <div>
            <CoupeLabel>{t.index}</CoupeLabel>
            <h2 className="mt-2.5 font-display text-[clamp(1.6rem,3.4vw,2.6rem)] uppercase leading-none tracking-[0.012em] text-ink">{t.title}</h2>
          </div>
          <p className="max-w-[48ch] text-[12px] leading-relaxed text-muted">{t.sub}</p>
        </div>

        <ul className={`mt-10 grid gap-6 ${stores.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {stores.map((s, i) => (
            <li key={s.slug}>
              {/* A door: tall plaster panel, arched lintel, facts engraved. */}
              <div className="relative h-full border border-stone-2/60 bg-[linear-gradient(180deg,#f3ecda,#e7dcc1)] px-6 pb-6 pt-8 transition-shadow duration-700 hover:shadow-soft lg:px-8 lg:pt-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-brass">Boutique {String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-none tracking-[0.01em] text-ink">{s.name}</h3>
                  </div>
                  <CoupeIndex n={String(i + 1).padStart(2, "0")} className="text-[clamp(2.8rem,6vw,4.5rem)]" />
                </div>
                <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed text-charcoal">
                  {s.address}
                  {s.city ? `, ${s.city}` : ""}
                </p>
                <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                  <ClockIcon size={13} className="shrink-0 text-brass" />
                  {s.hours}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:+216${s.phone.replace(/\D/g, "")}`}
                    className="inline-flex min-h-[42px] items-center gap-2.5 bg-ink px-4 text-[9px] font-extrabold uppercase tracking-[0.22em] text-plaster transition-colors duration-500 hover:bg-brass"
                  >
                    <PhoneIcon size={12} /> {t.call} — {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </a>
                  {s.mapsUrl ? (
                    <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost min-h-[42px]">
                      {t.directions} ↗
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-t border-stone-2/60 pt-5">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {facts.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.24em] text-charcoal-2">
                <span aria-hidden className="h-1 w-1 rotate-45 bg-brass/70" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/boutiques" className="btn-ghost">
              {t.ctaAll} →
            </Link>
            <Link href={helpHref} className="btn-ghost">
              {t.hours} &amp; aide →
            </Link>
            <a
              href="#planche-entree"
              className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-muted-2 transition-colors hover:text-brass"
            >
              ↑ {t.back}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
