import Link from "next/link";
import { resolvePeriod } from "@/lib/admin/period";
import { inventoryOverview, productHealth, productRows, qualityAudit } from "@/lib/admin/metrics";
import { productSignals, stockBook } from "@/lib/admin/insights";
import { PeriodSwitch } from "@/components/admin/os/controls";
import { ProductsTable, type ProductListRow } from "@/components/admin/os/products-table";
import { PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { BarList, Donut } from "@/components/admin/os/charts";
import { OsLink, Sheet, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

/**
 * CATALOGUE — l'instrument par référence
 *
 * Every line carries what the house knows: price, stock in its own bucket,
 * sales, wishes, rating, and a health score computed from real completeness
 * checks. Sorting by "couverture" answers the only question that matters on a
 * shelf: how long until this runs out.
 */
export default async function ProductsWorkspace({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const period = resolvePeriod({ p: flat.p ?? "30d", from: flat.from, to: flat.to });

  const [list, signals, stock, audit, overview] = await Promise.all([
    productRows(),
    productSignals(400),
    stockBook(),
    qualityAudit(),
    inventoryOverview(),
  ]);

  const signalById = new Map(signals.map((s) => [s.id, s]));
  const stockById = new Map(stock.map((s) => [s.id, s]));
  const rows: ProductListRow[] = list.map((p) => {
    const health = productHealth(p);
    const s = stockById.get(p.id);
    const sig = signalById.get(p.id);
    return {
      id: p.id, name: p.name, sku: p.sku, brand: p.brand, category: p.category, universe: p.universe,
      price: p.price, compareAt: p.compareAt, stock: p.stock, threshold: p.threshold, status: p.status,
      image: p.image, media: sig?.media ?? (p.image ? 1 : 0), rating: p.ratingAvg, ratings: p.ratingCount,
      unitsSold: p.unitsSold, revenue: p.revenue, wishes: p.wishes,
      lastSale: p.lastSale ? p.lastSale.toISOString() : null,
      health: health.score, grade: health.grade,
      bucket: s?.bucket ?? "sain", coverDays: s?.coverDays ?? null, perDay: s?.perDay ?? 0,
      marginFlag: p.compareAt != null && p.compareAt <= p.price,
    };
  });

  const active = rows.filter((r) => r.status === "active");
  const inStock = active.filter((r) => r.stock > 0);
  const avgHealth = rows.length ? Math.round(rows.reduce((a, r) => a + r.health, 0) / rows.length) : 0;
  const noImage = rows.filter((r) => !r.image).length;
  const byUniverse = overview.byUniverse.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow={`Commerce · ${period.label}`}
        icon="cube"
        title="Catalogue"
        sub="Toutes les références non archivées, avec leur santé, leur couverture de stock et ce qu'elles rapportent réellement. Cliquez une ligne pour ouvrir la fiche de commande."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSwitch current={period.key} from={flat.from} to={flat.to} />
            <OsLink href="/admin/produits/qualite" variant="ghost" size="md">Audit qualité</OsLink>
            <OsLink href="/admin/media" variant="ghost" size="md">Médiathèque</OsLink>
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Références", value: <AnimatedNumber value={rows.length} />, sub: `${active.length} en ligne · ${rows.length - active.length} hors ligne`, href: "/admin/produits" },
          { label: "Santé moyenne", value: <AnimatedNumber value={avgHealth} />, sub: `${rows.filter((r) => r.health < 55).length} fiche(s) sous 55`, tone: avgHealth >= 78 ? "good" : avgHealth >= 55 ? "warn" : "bad", href: "/admin/produits/qualite" },
          { label: "Sans visuel", value: <AnimatedNumber value={noImage} />, sub: "fiches qui ne peuvent pas être montrées", tone: noImage ? "bad" : "good", href: "/admin/media" },
          { label: "Valeur du stock", value: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(overview.retailValue / 1000)} DT`, sub: `${overview.units} unités · ${overview.dead} dormant(s)`, tone: "gold", href: "/admin/stock" },
        ]}
      />

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel eyebrow="Par univers" title="Où se concentre la valeur" sub="Unités et valeur de vente au prix du catalogue">
          <BarList
            rows={byUniverse.map((u) => ({ label: u.label, value: u.value, sub: `${u.units} unités · ${u.oos} rupture(s)`, href: `/admin/stock?universe=${u.id ?? ""}` }))}
            format={{ kind: "dt" }}
          />
        </Panel>

        <Panel eyebrow="Assortiment" title="État du stock" sub="Chaque produit dans son propre seuil de réassort">
          <Donut
            segments={[
              { label: "Sain", value: overview.healthy, tone: "ok" },
              { label: "Sous seuil", value: overview.low, tone: "warn" },
              { label: "Rupture", value: overview.outOfStock, tone: "crit" },
              { label: "Surstock", value: overview.overstock, tone: "info" },
            ]}
            centerLabel="références"
            format={{ kind: "count" }}
          />
        </Panel>

        <Panel eyebrow="Qualité" title={`${audit.issues.length} point(s) à corriger`} sub={`${audit.checks} contrôles sur ${audit.scanned} références`}>
          <p className="os-num font-ant uppercase text-[2.4rem] leading-none text-ops-ink"><AnimatedNumber value={audit.score} /><span className="ml-1 text-[0.4em] text-ops-faint">/ 100</span></p>
          <ul className="mt-3 space-y-1.5">
            {audit.byKind.slice(0, 5).map((k) => (
              <li key={k.kind} className="flex items-center justify-between gap-3 text-[12.5px]">
                <span className="text-ops-muted">{k.label}</span>
                <span className="os-num text-ops-ink">{k.n}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/produits/qualite" className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-ops-signal">Ouvrir le scanner</Link>
        </Panel>
      </section>

      <section className="mt-3">
        <ProductsTable rows={rows} />
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel eyebrow="Désir" title="Ce qui est désiré sans être acheté" sub="Ajouts en liste d'envie jamais convertis en commande pour la même cliente" padded={false}>
          <ul className="divide-y divide-ops-line-soft">
            {signals.filter((s) => s.wishesNeverBought > 2).sort((a, b) => b.wishesNeverBought - a.wishesNeverBought).slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                {s.image ? <img src={s.image} alt="" className="h-9 w-9 object-cover" loading="lazy" /> : <span className="h-9 w-9 bg-ops-sheet-2" />}
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/produits/${s.id}`} className="block truncate text-[12.5px] text-ops-ink hover:text-ops-signal">{s.name}</Link>
                  <span className="block text-[11px] text-ops-faint">{s.wishes} envie(s) · {s.units} vendu(s) · stock {s.stock}</span>
                </span>
                <Tag tone="warn">{s.wishesNeverBought} non converties</Tag>
              </li>
            ))}
            {signals.filter((s) => s.wishesNeverBought > 2).length === 0 && (
              <li className="px-4 py-4 text-[12.5px] text-ops-muted">
                Aucune liste d&apos;envie non convertie au-delà de deux clientes : le désir et l&apos;achat vont ensemble sur ce catalogue.
              </li>
            )}
          </ul>
        </Panel>

        <Panel eyebrow="Reserve" title="Ce qui dort en réserve" sub="Aucune vente depuis 90 jours, stock restant" padded={false}>
          <ul className="divide-y divide-ops-line-soft">
            {stock.filter((s) => s.bucket === "dormant").sort((a, b) => b.stock * b.price - a.stock * a.price).slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]">
                <Link href={`/admin/produits/${s.id}`} className="min-w-0 flex-1 truncate text-ops-ink hover:text-ops-signal">{s.name}</Link>
                <span className="os-num text-ops-muted">{s.stock} unités</span>
                <span className="os-num text-ops-ink">{new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format((s.stock * s.price) / 1000)} DT</span>
              </li>
            ))}
            {stock.filter((s) => s.bucket === "dormant").length === 0 && <li className="px-4 py-4 text-[12.5px] text-ops-muted">Rien ne dort : chaque référence en réserve s&apos;est vendue dans les 90 derniers jours.</li>}
          </ul>
          <div className="border-t border-ops-line px-4 py-2">
            <Link href="/admin/stock?bucket=dormant" className="text-[11px] uppercase tracking-[0.12em] text-ops-signal">Voir tous les dormants</Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
