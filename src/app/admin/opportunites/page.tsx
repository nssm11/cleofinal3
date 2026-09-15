import Link from "next/link";
import { opportunities } from "@/lib/admin/attention";
import { boughtTogether, customerLadder, inventoryOverview, wishlistIntelligence } from "@/lib/admin/metrics";
import { searchPulse } from "@/lib/admin/insights";
import { OpportunityLedger, PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { BarList } from "@/components/admin/os/charts";
import { Sheet, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centre d'opportunités" };

/**
 * CENTRE D'OPPORTUNITÉS
 *
 * Signals the ledger itself produces: desire that never converted, pairs that
 * sell together, searches with no answer, stock asleep in the reserve. Each
 * card is a decision, not a chart.
 */
export default async function OpportunityCentre() {
  const [items, wishes, pairs, stock, ladder, search] = await Promise.all([
    opportunities(),
    wishlistIntelligence(),
    boughtTogether(10),
    inventoryOverview(),
    customerLadder(),
    searchPulse(30),
  ]);

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow="Commandement · signal"
        icon="spark"
        title="Centre d'opportunités"
        sub="Ce que la base propose de faire, avec la preuve chiffrée qui l'accompagne. Rien n'est recommandé qui ne puisse être montré."
      />

      <StatStrip
        items={[
          { label: "Signaux actifs", value: <AnimatedNumber value={items.length} />, sub: `${items.filter((i) => i.severity === "chaud").length} chaud(s)`, tone: "gold" },
          { label: "Désir non converti", value: <AnimatedNumber value={wishes.totals.items} />, sub: `${wishes.totals.products} produits en liste d'envie`, href: "/admin/analytique" },
          { label: "Recherches sans réponse", value: <AnimatedNumber value={search.totals.zero} />, sub: `${search.totals.unique} requêtes distinctes sur 30 jours`, tone: search.totals.zero > 0 ? "warn" : "good", href: "/admin/recherches" },
          { label: "Stock dormant", value: <AnimatedNumber value={stock.dead} />, sub: `${stock.outOfStock} rupture(s) · ${stock.low} sous seuil`, href: "/admin/stock" },
        ]}
      />

      <section className="mt-3">
        <OpportunityLedger items={items} columns={2} />
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel eyebrow="Listes d'envie" title="Le désir, produit par produit" sub="Ajouts en liste d'envie face aux ventes réelles">
          <BarList
            rows={wishes.top.slice(0, 8).map((w) => ({
              label: w.name,
              value: w.wishes,
              sub: `${w.units} vendu(s) · écart ${w.gap} · stock ${w.stock}`,
              href: `/admin/produits/${w.id}`,
              image: w.image,
            }))}
            format={{ kind: "count", suffixes: ["envie", "envies"] }}
          />
        </Panel>

        <Panel eyebrow="Paniers" title="Ce qui part ensemble" sub="Paires réellement vendues dans la même commande">
          {pairs.length === 0 ? (
            <p className="text-[12.5px] leading-relaxed text-os-muted">
              Aucune paire ne revient assez souvent pour être affirmée : le calcul exige au moins deux commandes partageant les deux mêmes références.
            </p>
          ) : (
            <ul className="space-y-2">
              {pairs.slice(0, 6).map((p) => (
                <li key={`${p.a.id}-${p.b.id}`} className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-2 last:border-0">
                  <span className="flex min-w-0 items-center gap-2">
                    {p.a.image && <img src={p.a.image} alt="" className="h-8 w-8 object-cover" loading="lazy" />}
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] text-os-text">{p.a.name}</span>
                      <span className="block truncate text-[12.5px] text-os-muted">{p.b.name}</span>
                    </span>
                  </span>
                  <span className="os-num shrink-0 text-[12px] text-os-text">{p.count}×</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel eyebrow="Base cliente" title="Où la relation se perd" sub="Chaque marche est un registre, pas une estimation">
          <ul className="space-y-2">
            {ladder.map((s, i) => {
              const prev = i > 0 ? ladder[i - 1].count : s.count;
              const drop = prev > 0 ? ((prev - s.count) / prev) * 100 : 0;
              return (
                <li key={s.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="text-os-muted">{s.label}</span>
                  <span className="os-num flex items-center gap-2 text-os-text">
                    {s.count}
                    {i > 0 && drop > 0 && <Tag tone="warn">−{drop.toFixed(0)} %</Tag>}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[11.5px] leading-relaxed text-os-faint">
            Les étapes sont indépendantes : une cliente peut utiliser sa liste d&apos;envie sans commander. La marche la plus coûteuse indique où travailler.
          </p>
        </Panel>
      </section>

      <section className="mt-3">
        <Sheet padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <div>
              <p className="os-label text-os-faint">Demande non servie</p>
              <h2 className="mt-1 font-display text-[1.35rem] text-os-text">Recherches sans résultat, à curer ou à approvisionner</h2>
            </div>
            <Link href="/admin/recherches" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Intelligence de recherche</Link>
          </div>
          <div className="grid gap-px bg-os-line sm:grid-cols-2 lg:grid-cols-3">
            {search.zeroQueries.slice(0, 9).map((z) => (
              <div key={z.query} className="bg-os-surface p-4">
                <p className="text-[13.5px] text-os-text">« {z.query} »</p>
                <p className="os-num mt-1 text-[11.5px] text-os-muted">
                  {z.n} recherche(s) · dernière le {new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "short" }).format(z.last)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Tag tone={z.landing ? "info" : "bad"}>{z.landing ? "page d'atterrissage" : "aucune curation"}</Tag>
                  <a href={`/catalogue?q=${encodeURIComponent(z.query)}`} target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-[0.12em] text-os-gold">Voir côté client</a>
                  <Link href="/admin/journal" className="text-[11px] uppercase tracking-[0.12em] text-os-muted">Curer</Link>
                </div>
              </div>
            ))}
            {search.zeroQueries.length === 0 && (
              <p className="bg-os-surface p-4 text-[12.5px] text-os-muted">Aucune recherche vide sur 30 jours : chaque requête a trouvé au moins une référence.</p>
            )}
          </div>
        </Sheet>
      </section>
    </div>
  );
}
