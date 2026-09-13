import Image from "next/image";
import Link from "next/link";
import { CoupeLabel, Niche } from "./parts";
import { formatDate } from "@/lib/utils";
import type { CoupeArticle } from "./types";

/**
 * PLANCHE 07 — LE JOURNAL.
 *
 * The pharmacy's written voice, mounted like plates in a corridor: the lead
 * article gets one full arched plate with its caption engraved underneath; the
 * rest walk as an index rail on the side, numbered, dated, read in minutes —
 * an honest magazine wall rather than a row of blog cards.
 */
export function Journal({ t, lead, rest }: { t: { index: string; title: string; sub: string; cta: string; minutes: string }; lead: CoupeArticle | null; rest: CoupeArticle[] }) {
  if (!lead) return null;
  return (
    <section id="planche-journal" aria-label={t.title} className="border-b border-stone bg-plaster">
      <div className="mx-auto w-full max-w-[108rem] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-stone pb-4">
          <div>
            <CoupeLabel>{t.index}</CoupeLabel>
            <h2 className="mt-2.5 font-display text-[clamp(1.5rem,3vw,2.3rem)] uppercase leading-none tracking-[0.012em] text-ink">{t.title}</h2>
          </div>
          <Link href="/journal" className="btn-ghost">
            {t.cta} →
          </Link>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <article className="lg:col-span-7">
            <Link href={`/journal/${lead.slug}`} className="group block">
              <Niche src={lead.image} alt="" sizes="(max-width:1024px) 100vw, 54vw" className="aspect-[16/10] w-full" priority>
                <span className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4 lg:p-5">
                  <span className="text-[8.5px] font-extrabold uppercase tracking-[0.26em] text-plaster/90">{lead.tag}</span>
                  <span className="text-[9.5px] tabular-nums text-plaster/70">
                    {lead.readMinutes} {t.minutes} · {lead.publishedAt ? formatDate(lead.publishedAt) : ""}
                  </span>
                </span>
              </Niche>
              <h3 className="mt-5 max-w-[24ch] font-display text-[clamp(1.45rem,2.8vw,2.2rem)] leading-[1.08] tracking-[-0.01em] text-ink transition-colors duration-500 group-hover:text-brass">
                {lead.title}
              </h3>
              <p className="mt-3 max-w-[62ch] text-[13px] leading-[1.8] text-muted">{lead.excerpt}</p>
            </Link>
          </article>

          <div className="lg:col-span-5">
            <ul className="border-t border-stone">
              {rest.map((a, i) => (
                <li key={a.slug} className="border-b border-stone">
                  <Link href={`/journal/${a.slug}`} className="group flex gap-5 py-4">
                    <span className="w-8 shrink-0 pt-1 font-display text-[13px] italic leading-none text-brass">{String(i + 2).padStart(2, "0")}</span>
                    <span className="relative block h-20 w-16 shrink-0 overflow-hidden">
                      {a.image && <Image src={a.image} alt="" fill sizes="80px" className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[8.5px] font-extrabold uppercase tracking-[0.24em] text-muted-2">
                        {a.tag} · {a.readMinutes} {t.minutes}
                      </span>
                      <span className="mt-1.5 block font-display text-[clamp(1.05rem,1.5vw,1.25rem)] leading-snug text-ink transition-colors duration-500 group-hover:text-brass">
                        {a.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-[12px] leading-relaxed text-muted">{a.excerpt}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-[46ch] text-[12px] leading-relaxed text-muted">{t.sub}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
