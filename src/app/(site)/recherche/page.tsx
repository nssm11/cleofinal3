import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { Suspense } from "react";
import { db } from "@/db";
import { queryLandings } from "@/db/schema";
import { Listing, type SP } from "@/components/catalog/listing";
import { concernsNearQuery, getUniverses, listProducts } from "@/lib/catalog";
import { logSearchAction } from "@/actions/shop";
import { getCopy } from "@/lib/i18n/server";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import { Chapter } from "@/components/kit/surfaces";
import { Mask } from "@/components/kit/motion";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Recherche", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * LE RÉSULTAT.
 *
 * The query is re-printed as an exhibit — poster caps on the ruled sheet — so
 * the visitor always knows exactly what the shelf in front of them answers.
 * The useful zero survives: landed curations, the needs that come close, the
 * rayons as doors, and the search logged for the counter.
 */
export default async function RecherchePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  let total = -1;
  let allOos = false;
  if (q.length >= 2 && !sp.page) {
    const res = await listProducts({ q, perPage: 6 });
    total = res.total;
    // The second truth of a search: words matched, shelves were empty. Logged
    // so the counter can restock what the country asks for.
    allOos = res.total > 0 && res.items.length > 0 && res.items.every((it: { stock: number }) => it.stock <= 0);
    await logSearchAction(q, total, allOos);
  }
  const landings =
    q.length >= 2
      ? await db
          .select()
          .from(queryLandings)
          .where(
            and(
              eq(queryLandings.query, q.toLowerCase().trim().slice(0, 200)),
              eq(queryLandings.kind, total === 0 ? "zero" : "oos"),
            ),
          )
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
      <section className="border-b border-line bg-canvas pb-10 pt-28 lg:pb-14 lg:pt-36">
        <div className="shell-wide">
          <div className="flex items-center gap-3">
            <span aria-hidden className="marker bg-iodine" />
            <span className="kicker">Recherche</span>
            {q && <span className="kicker-xs text-faint">pour</span>}
          </div>

          <Mask delay={0.05}>
            {q ? (
              <h1 className="mt-4 max-w-[26ch] font-ant text-[clamp(2rem,6vw,5rem)] uppercase leading-[0.9] text-carbon">
                «&nbsp;{q}&nbsp;»
              </h1>
            ) : (
              <h1 className="mt-4 font-ant text-[clamp(2rem,6vw,5rem)] uppercase leading-[0.9] text-carbon">
                Que cherchez-vous&nbsp;?
              </h1>
            )}
          </Mask>

          <p className="mt-5 max-w-[56ch] text-lead text-steel">
            {q
              ? "Voici les références qui répondent le mieux à votre recherche, classées par pertinence et par demande réelle au comptoir."
              : "Un actif, une marque, un besoin : cherchez dans toute la sélection — produits, laboratoires, rayons et conseils."}
          </p>

          <form action="/recherche" className="mt-8 flex max-w-xl items-center gap-3 border-b border-line-strong pb-2 focus-within:border-iodine">
            <SearchIcon size={16} className="shrink-0 text-iodine" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nom du soin, laboratoire, besoin…"
              aria-label="Rechercher"
              className="min-h-11 w-full bg-transparent text-[0.9375rem] text-carbon placeholder:text-faint focus:outline-none"
            />
            <button type="submit" className="btn-ghost shrink-0">
              Chercher
            </button>
          </form>
        </div>
      </section>

      {q.length >= 2 && !sp.page && total === 0 ? (
        <section className="shell-wide py-block lg:py-block-lg">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <p className="font-ant text-h2 uppercase text-carbon">{mm.szTitle}</p>
              <p className="mt-4 max-w-[46ch] text-meta text-steel">{mm.szText}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/boutique" className="btn-solid">
                  Parcourir la boutique
                </Link>
                <Link href="/aide" className="btn-outline">
                  Demander au pharmacien
                </Link>
              </div>

              {landing && (
                <div className="mt-9 border border-iodine/40 bg-iodine-wash/60 p-5">
                  <p className="kicker-xs text-iodine-deep">Le comptoir a préparé une réponse</p>
                  <p className="mt-3 text-meta text-carbon">{landing.label}</p>
                  <Link href={landing.href} className="btn-ghost mt-4">
                    Voir la sélection
                  </Link>
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              {needs.length > 0 && (
                <div>
                  <p className="kicker-xs mb-4">Un besoin, peut-être</p>
                  <ul className="flex flex-wrap gap-2">
                    {needs.map((n) => (
                      <li key={n.slug}>
                        <Link href={`/besoin/${n.slug}`} className="chip">
                          {n.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-10 border-t border-line pt-6">
                <p className="kicker-xs mb-4">Entrer par un rayon</p>
                <ul className="grid gap-px bg-line sm:grid-cols-2">
                  {unis.map((u) => (
                    <li key={u.id} className="bg-canvas">
                      <Link href={`/univers/${u.slug}`} className="group flex items-center justify-between gap-4 p-4">
                        <span className="font-ant text-[1.15rem] uppercase leading-none text-carbon group-hover:text-iodine">
                          {u.name}
                        </span>
                        <span aria-hidden className="h-px w-5 bg-line-strong transition-all group-hover:w-8 group-hover:bg-iodine" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="shell-wide py-block lg:py-block-lg">
          <Suspense key={JSON.stringify(sp)} fallback={<ProductGridSkeleton n={9} />}>
            <Listing base={{ q }} sp={sp} basePath="/recherche" hideConcerns />
          </Suspense>
        </section>
      )}

      <section className="border-t border-line bg-mist">
        <div className="shell-wide py-band">
          <Chapter
            label="Continuer"
            title="Le comptoir vous conseille"
            align="between"
            action={{ href: "/journal", label: "Lire le journal" }}
          />
        </div>
      </section>
    </div>
  );
}
