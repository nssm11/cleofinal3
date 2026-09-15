import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { brands, categories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { previousPeriod, resolvePeriod, sameperiodLastYear } from "@/lib/admin/period";
import { METRICS, businessPulse, paymentMix, revenueBreakdown } from "@/lib/admin/metrics";
import { seriesBundle, type SeriesKey } from "@/lib/admin/insights";
import { AreaChart, BarList, Donut } from "@/components/admin/os/charts";
import { MetricSwitch, PeriodSwitch } from "@/components/admin/os/controls";
import { Glyph } from "@/components/admin/os/icons";
import { EmptyState, Money, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const dynamic = "force-dynamic";

const PAYMENT_LABEL: Record<string, string> = { cod: "Paiement à la livraison", bank_transfer: "Virement", card: "Carte", gift_card: "Carte cadeau" };

/**
 * L'EXPLORATEUR
 *
 * Une métrique, une période, une dimension — le chiffre est toujours le même
 * que sur le poste de commande : il vient de la même base, jamais d'une
 * estimation. Le curseur descend du rayon à la marque, de la marque au
 * produit, du produit à la commande.
 */
export default async function Explorer({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user || !["admin", "support"].includes(user.role)) redirect("/admin");

  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as Record<string, string | undefined>;
  const period = resolvePeriod({ p: flat.p, from: flat.from, to: flat.to });
  const prev = previousPeriod(period);
  const metricKey = (METRICS.find((m) => m.key === flat.m)?.key ?? "revenue") as SeriesKey;
  const level = (flat.level === "brand" || flat.level === "product" || flat.level === "category" ? flat.level : "universe") as "universe" | "category" | "brand" | "product";
  const parentLevel = flat.parent === "brand" || flat.parent === "category" || flat.parent === "universe" ? flat.parent : null;
  const parentId = flat.parentId ? Number(flat.parentId) : null;
  const dim = level === "product" ? "product" : level === "brand" ? "brand" : level === "category" ? "category" : "universe";

  const [pulse, bundle, breakdown, payments, cats, marks] = await Promise.all([
    businessPulse(period, prev, sameperiodLastYear(period)),
    seriesBundle(period),
    revenueBreakdown(period, dim, parentId && parentLevel ? { level: parentLevel, id: parentId } : undefined),
    paymentMix(period),
    db.select().from(categories).orderBy(categories.name),
    db.select().from(brands).orderBy(brands.name),
  ]);

  const points = bundle[metricKey];
  const metricMeta = METRICS.find((m) => m.key === metricKey)!;
  const fmt = metricMeta.unit === "millimes"
    ? (v: number) => `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v / 1000)} DT`
    : (v: number) => new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v);

  const total = breakdown.reduce((a, r) => a + r.revenue, 0);
  const dimLabel = level === "universe" ? "rayon" : level === "category" ? "catégorie" : level === "brand" ? "marque" : "produit";
  const crumb: string[] = [];
  const parentLabel = parentLevel === "universe" ? "Rayon" : parentLevel === "category" ? "Catégorie" : "Marque";
  if (parentId && parentLevel) crumb.push(`${parentLabel} #${parentId}`);

  const nextLevel: "category" | "brand" | "product" | null = level === "universe" ? "category" : level === "category" ? "brand" : level === "brand" ? "product" : null;

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 pt-5">
        <div className="min-w-0">
          <p className="os-label text-os-faint">Analytique · {period.label}</p>
          <h1 className="mt-1.5 font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.02] tracking-tight text-os-text">
            {metricMeta.label}, {crumb.length ? crumb.join(" → ") : `par ${dimLabel}`}
          </h1>
          <p className="mt-1 max-w-[64ch] text-[13px] text-os-muted">{metricMeta.hint} — même base que le poste de commande, aucune estimation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MetricSwitch basePath="/admin/analytique" current={metricKey} metrics={METRICS.map((m) => ({ key: m.key, label: m.label }))} />
          <PeriodSwitch basePath="/admin/analytique" current={period.key} from={flat.from} to={flat.to} />
        </div>
      </header>

      {/* La courbe */}
      <Sheet padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
          <SectionHead eyebrow={period.label} title={metricMeta.label} sub={`${points.length} points observés · moyenne ${fmt(points.length ? Math.round(points.reduce((a, p) => a + p.value, 0) / points.length) : 0)}`} />
          <Link href="/admin" className="flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-os-gold">
            <Glyph name="command" size={13} /> Poste de commande
          </Link>
        </div>
        <div className="px-4 py-3">
          {points.length > 1 ? (
            <AreaChart points={points} height={240} tone="gold" format={{ kind: metricMeta.unit === "millimes" ? "dt" : "count" }} ariaLabel={`${metricMeta.label} sur la période`} showAxis />
          ) : (
            <EmptyState title="Aucun point sur la période" why="Aucune vente ne tombe dans cette fenêtre de temps. Élargissez la période pour retrouver le fil." />
          )}
        </div>
      </Sheet>

      {/* Le classement — la descente rayon → marque → produit */}
      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Sheet padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <SectionHead
              eyebrow={`Répartition · ${dimLabel}`}
              title={`${breakdown.length} ${dimLabel === "rayon" ? "rayons" : dimLabel === "marque" ? "marques" : dimLabel === "produit" ? "références" : "catégories"} sur la période`}
              sub={total > 0 ? `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(total / 1000)} DT de chiffre d’affaires non annulÃ©` : "aucune vente sur la pÃ©riode"}
            />
            {nextLevel && breakdown.length > 0 && (
              <Tag tone="gold">Cliquez pour descendre au niveau {nextLevel === "category" ? "catégorie" : nextLevel === "brand" ? "marque" : "produit"}</Tag>
            )}
          </div>
          <div className="px-4 py-3">
            {breakdown.length === 0 ? (
              <EmptyState title="Rien Ã  classer" why={`Aucun ${dimLabel} n’a vendu sur cette pÃ©riode.`} />
            ) : (
              <BarList
                rows={breakdown.slice(0, 10).map((r) => ({
                  label: r.label,
                  value: r.revenue,
                  sub: `${r.units} unités · ${r.orders} commande(s)${nextLevel ? "" : ` · ${r.sub}`}`,
                  image: r.image,
                  href: nextLevel
                    ? `/admin/analytique?p=${period.key}&m=${metricKey}&level=${nextLevel}&parent=${level}&parentId=${r.id}`
                    : `/admin/produits/${r.id}`,
                }))}
                format={{ kind: "dt" }}
              />
            )}
          </div>
        </Sheet>

        <div className="grid content-start gap-3">
          <Sheet>
            <SectionHead eyebrow="Encaissement" title="Moyens de paiement" sub="Ce que les clientes choisissent sur la période" />
            {payments.length > 0 ? (
              <>
                <div className="mt-3">
                  <Donut
                    segments={payments.map((p) => ({ label: PAYMENT_LABEL[p.method] ?? p.method, value: p.value, tone: p.rate >= 70 ? "ok" : p.rate > 0 ? "warn" : "crit" }))}
                    centerLabel="encaissé"
                    center={new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(pulse.current.collected / 1000)}
                  />
                </div>
                <div className="mt-3 space-y-1.5 border-t border-os-line pt-3 text-[12px]">
                  {payments.map((p) => (
                    <div key={p.method} className="flex items-center justify-between gap-3">
                      <span className="text-os-muted">{PAYMENT_LABEL[p.method] ?? p.method}</span>
                      <span className="os-num text-os-text">{p.count} · {p.rate.toFixed(0)} % réglé</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState title="Aucun encaissement" why="Aucune commande non annulée sur la période." />
            )}
          </Sheet>

          <Sheet>
            <SectionHead eyebrow="Le registre" title="Catalogue observé" sub={`${cats.length} rayons · ${marks.length} marques`} />
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-2">
                <span className="text-os-muted">Rayons actifs</span>
                <span className="os-num flex items-center gap-2 text-os-text">
                  {cats.length}
                  <Link href="/admin/mise-en-scene" className="text-[10px] uppercase tracking-[0.12em] text-os-gold">vitrines</Link>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-2">
                <span className="text-os-muted">Marques</span>
                <span className="os-num text-os-text">{marks.length}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-os-muted">Commandes de la période</span>
                <span className="os-num text-os-text">{pulse.current.orders}</span>
              </div>
            </div>
          </Sheet>
        </div>
      </section>

      {/* Pied honnête */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-os-line bg-os-surface-2/50 px-4 py-3 text-[11px] text-os-muted">
        <span>Commandes annulées exclues · {cats.length} rayons et {marks.length} marques dans le registre</span>
        <span className="flex flex-wrap items-center gap-3">
          <Link href="/admin/recherches" className="uppercase tracking-[0.12em] text-os-gold">Intelligence de recherche</Link>
          <Link href="/admin/echanges" className="uppercase tracking-[0.12em] text-os-gold">Exporter les données</Link>
        </span>
      </div>
    </div>
  );
}
