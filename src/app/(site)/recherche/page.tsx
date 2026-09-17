import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { queryLandings } from "@/db/schema";
import Link from "next/link";
import { Suspense } from "react";
import { Listing, type SP } from "@/components/catalog/listing";
import { concernsNearQuery, getUniverses, listProducts } from "@/lib/catalog";
import { getCopy } from "@/lib/i18n/server";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { logSearchAction } from "@/actions/shop";
import { MotifLayer } from "@/components/shell/motif";
import { Reveal } from "@/components/motion/reveal";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Recherche", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * THE RESULTS.
 *
 * The query is treated as an exhibit: it is re-printed in the display face, so
 * a shopper always knows exactly what the shelf in front of them is answering.
 */
export default async function RecherchePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  let total = -1;
  let allOos = false;
  if (q.length >= 2 && !sp.page) {
    const res = await listProducts({ q, perPage: 6 });
    total = res.total;
    // Prompt 15 — the second truth of a search: words matched, shelves were
    // empty. Logged so the counter can restock what the country asks for.
    allOos = res.total > 0 && res.items.length > 0 && res.items.every((it: { stock: number }) => it.stock <= 0);
    await logSearchAction(q, total, allOos);
  }
  const landings =
    q.length >= 2
      ? await db
          .select()
          .from(queryLandings)
          .where(and(eq(queryLandings.query, q.toLowerCase().trim().slice(0, 200)), eq(queryLandings.kind, total === 0 ? "zero" : "oos")))
          .limit(1)
      : [];
  const landing = landings[0] ?? null;
  const [unis, copy, needs] = await Promise.all([
    getUniverses(),
    getCopy(),
    total === 0 ? concernsNearQuery(q, 5) : Promise.resolve([]),
  ]);
  const mm = copy.merch;

  return (
    <div>
      <section className="relative overflow-hidden bg-porcelain pb-10 pt-28 lg:pb-14 lg:pt-36">
        <MotifLayer motif="clarity" light={[82, 12]} />
        <div className="relative container-wide">
          <p className="rule-label mb-7">Recherche</p>
          <Reveal y={12} amount={0.1}>
            {q ? (
              <h1 className="max-w-[30ch] font-display text-[clamp(2rem,5vw,4rem)] leading-[0.98] tracking-[-0.026em] text-ink">
                «&nbsp;<span className="italic text-cinabre-2">{q}</span>&nbsp;»
              </h1>
            ) : (
              <h1 className="font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.98] tracking-[-0.026em] text-ink">
                Que cherchez-vous&nbsp;?
              </h1>
            )}
            <p className="mt-6 max-w-[38rem] text-[15px] leading-[1.85] text-graphite">
              {q
                ? "Voici les références qui répondent le mieux à votre recherche, classées par pertinence et par demande réelle."
                : "Un actif, une marque, un besoin : cherchez dans toute la sélection — produits, marques, rayons et conseils."}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-wide pb-16 lg:pb-24">
        {q.length >= 2 && !sp.page && total === 0 ? (
          /* The useful zero (P03): never a dead end — needs that are close,
             the rooms as doors, and a pharmacist who can order what we lack. */
          <div className="relative overflow-hidden border border-rule-strong/40 bg-bone/70 px-6 py-14 text-center lg:px-12">
            <span aria-hidden className="marble-veil opacity-30" />
            <div className="relative mx-auto max-w-2xl">
              <SearchIcon size={22} className="mx-auto text-cinabre-2" />
              <p className="mt-5 font-display text-[clamp(1.4rem,3vw,2rem)] leading-snug text-ink">{mm.szTitle}</p>
              <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-graphite">{mm.szText}</p>
              {landing && (
                <div className="mx-auto mt-7 max-w-md border border-cinabre-2/40 bg-porcelain px-5 py-5 text-left">
                  <p className="eyebrow mb-2 text-cinabre-2">{mm.szLandingEyebrow}</p>
                  <p className="text-[13.5px] leading-relaxed text-slate">{landing.label}</p>
                  <a href={landing.href} className="btn-primary mt-4 inline-flex">
                    {mm.szLandingCta}
                  </a>
                </div>
              )}
              {needs.length > 0 && (
                <div className="mt-9">
                  <p className="eyebrow mb-3.5 text-ash">{mm.szNeeds}</p>
                  <ul className="flex flex-wrap justify-center gap-2.5">
                    {needs.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/besoin/${c.slug}`} className="inline-flex min-h-11 items-center border border-rule-strong/55 px-4 text-[12.5px] text-slate transition-colors hover:border-cinabre hover:text-ink">
                          {c.name} <span className="ml-2 tabular-nums text-[10.5px] text-ash">{c.n}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-8">
                <p className="eyebrow mb-3 text-ash">{mm.szRooms}</p>
                <ul className="flex flex-wrap justify-center gap-x-7 gap-y-2">
                  {unis.slice(0, 7).map((u) => (
                    <li key={u.id}>
                      <Link href={`/univers/${u.slug}`} className="link-underline font-display text-[17px] text-slate hover:text-cinabre-2">{u.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/aide?type=product_question&subject=${encodeURIComponent(`Recherche : ${q}`)}&message=${encodeURIComponent(`Je cherche « ${q} » et je ne le trouve pas dans la boutique. Pouvez-vous me conseiller ou le commander ?`)}`}
                className="btn-primary mt-10 inline-flex"
              >
                {mm.szAsk}
              </Link>
            </div>
          </div>
        ) : q.length >= 2 ? (
          <Suspense key={q + JSON.stringify(sp)} fallback={<ProductGridSkeleton n={8} />}>
            {allOos && landing && (
              <div className="relative mb-8 flex flex-wrap items-center justify-between gap-4 border border-cinabre-2/40 bg-bone/70 px-6 py-5">
                <div>
                  <p className="eyebrow mb-1.5 text-cinabre-2">Rupture au comptoir</p>
                  <p className="text-[13.5px] leading-relaxed text-slate">{landing.label}</p>
                </div>
                <a href={landing.href} className="btn-secondary shrink-0">
                  {mm.szLandingCta}
                </a>
              </div>
            )}
            <Listing base={{ q }} sp={sp} basePath="/recherche" />
          </Suspense>
        ) : (
          <div className="relative overflow-hidden border border-rule-strong/40 bg-bone/70 px-6 py-16 text-center">
            <span aria-hidden className="marble-veil opacity-30" />
            <div className="relative">
              <SearchIcon size={24} className="mx-auto text-cinabre-2" />
              <p className="mt-5 font-display text-display-sm text-ink">Saisissez au moins deux caractères</p>
              <p className="mx-auto mt-3 max-w-sm text-[13.5px] text-graphite">
                Ou entrez directement par un rayon — la sélection est courte, elle se parcourt vite.
              </p>
              <ul className="mt-9 flex flex-wrap justify-center gap-x-8 gap-y-3">
                {unis.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/univers/${u.slug}`}
                      className="link-underline font-display text-[18px] text-slate hover:text-cinabre-2"
                    >
                      {u.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
