import Link from "next/link";
import { resolvePeriod, previousPeriod } from "@/lib/admin/period";
import { businessPulse, paymentMix, pipeline, outstanding } from "@/lib/admin/metrics";
import { orderStatusCounts, ordersList, type OrderListRow } from "@/lib/admin/insights";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";

type OrderStatus = keyof typeof ORDER_STATUS_LABELS;
import { PeriodSwitch, RefreshControl } from "@/components/admin/os/controls";
import { OrdersTable, type OrderRow } from "@/components/admin/os/orders-table";
import { PageHead, Panel, StatStrip } from "@/components/admin/os/modules";
import { Funnel } from "@/components/admin/os/charts";
import { OsLink, Sheet, Tag } from "@/components/admin/os/primitives";
import { AnimatedNumber } from "@/components/admin/os/motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

/**
 * COMMANDES — l'espace opérationnel
 *
 * The desk: a funnel you can click to filter, a table that sorts, hides
 * columns, remembers views and acts in bulk, and every row opening the full
 * order workspace. Counts come from the book itself, not from the page's slice.
 */
export default async function OrdersWorkspace({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const period = resolvePeriod({ p: flat.p ?? "30d", from: flat.from, to: flat.to });
  const prev = previousPeriod(period);
  const statusFilter = flat.statut && ORDER_STATUS_LABELS[flat.statut as OrderStatus] ? [flat.statut] : [];
  const paymentFilter = flat.paiement ? [flat.paiement] : [];

  const [rows, counts, stages, pulse, payments, debt] = await Promise.all([
    ordersList({
      statuses: statusFilter.length ? statusFilter : undefined,
      payments: paymentFilter.length ? paymentFilter : undefined,
      from: period.from,
      to: period.to,
      onlyLate: flat.retard === "1",
      q: flat.q,
      limit: 600,
    }),
    orderStatusCounts(),
    pipeline(period),
    businessPulse(period, prev, period),
    paymentMix(period),
    outstanding(period),
  ]);

  const tableRows: OrderRow[] = rows.map((r: OrderListRow) => ({
    id: r.id, number: r.number, at: r.at.toISOString(), name: r.name, email: r.email, phone: r.phone,
    city: r.city, status: r.status, paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod,
    shippingMethod: r.shippingMethod, total: r.total, items: r.items, units: r.units,
    ageHours: r.ageHours, tracking: r.tracking, promoCode: r.promoCode,
  }));

  const late = rows.filter((r) => r.ageHours > 72 && ["pending", "confirmed", "preparing"].includes(r.status));
  const lateValue = late.reduce((a, r) => a + r.total, 0);
  const totalBook = Object.values(counts).reduce((a, b) => a + b, 0);
  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(Object.entries({ p: period.key, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/commandes?${next.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <PageHead
        eyebrow={`Commerce · ${period.label}`}
        icon="bag"
        title="Commandes"
        sub="Le livre entier, du panier validé à la livraison. Le tunnel ci-dessous est un filtre : cliquez une étape pour ne voir que ces commandes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSwitch current={period.key} from={flat.from} to={flat.to} />
            <RefreshControl intervalSeconds={60} />
            <OsLink href="/admin/commandes/nouvelle" variant="gold" size="md">Commande manuelle</OsLink>
          </div>
        }
      />

      <StatStrip
        items={[
          { label: "Commandes de la période", value: <AnimatedNumber value={pulse.current.orders} />, sub: `${pulse.current.units} unité(s) · ${pulse.previous.orders} sur la période précédente` },
          { label: "Chiffre d'affaires", value: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(pulse.current.gross / 1000)} DT`, sub: `panier moyen ${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(pulse.rates.aov.current / 1000)} DT`, tone: "gold" },
          { label: "En retard (> 72 h)", value: <AnimatedNumber value={late.length} />, sub: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(lateValue / 1000)} DT engagés`, tone: late.length ? "bad" : "good", href: "/admin/commandes?retard=1" },
          { label: "Encours à recouvrer", value: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(debt.value / 1000)} DT`, sub: `${debt.count} non réglée(s) · ${debt.failed} refus`, tone: debt.value ? "warn" : "good", href: "/admin/commandes?paiement=pending" },
        ]}
      />

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Sheet padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-line px-4 py-3">
            <div>
              <p className="os-label text-os-faint">Tunnel de traitement</p>
              <h2 className="mt-1 font-display text-[1.35rem] text-os-text">Où sont les commandes, maintenant</h2>
            </div>
            <OsLink href="/admin/commandes" variant="quiet" size="sm">Tout le livre</OsLink>
          </div>
          <div className="px-4 py-4">
            <Funnel
              stages={stages.map((s) => ({
                label: s.label,
                count: s.count,
                href: link({ statut: s.status }),
                note: `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(s.value / 1000)} DT${s.avgAgeHours != null ? ` · ${Math.round(s.avgAgeHours)} h en moyenne` : ""}`,
              }))}
            />
            <p className="mt-3 text-[11px] text-os-faint">
              {Object.entries(counts).map(([k, v]) => `${ORDER_STATUS_LABELS[k as OrderStatus] ?? k} ${v}`).join(" · ")} · {totalBook} commandes dans le livre depuis l&apos;ouverture
            </p>
          </div>
        </Sheet>

        <div className="grid gap-3">
          <Panel eyebrow="Encaissement" title="Moyens de paiement" sub="Période en cours, commandes non annulées">
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.method} className="flex items-center justify-between gap-3 border-b border-dashed border-os-line-soft pb-1.5 text-[12.5px] last:border-0">
                  <span className="text-os-text">{p.method === "cod" ? "À la livraison" : p.method === "bank_transfer" ? "Virement" : p.method === "gift_card" ? "Carte cadeau" : p.method}</span>
                  <span className="os-num text-os-muted">
                    {p.count} · {p.rate.toFixed(0)} % réglé
                  </span>
                </li>
              ))}
              {payments.length === 0 && <li className="text-[12.5px] text-os-muted">Aucune commande encaissable sur la période.</li>}
            </ul>
          </Panel>

          <Panel eyebrow="Vieux dossiers" title="Ce qui dort" sub="Non réglé ou non expédié depuis plus de 7 jours">
            {debt.aged.length === 0 ? (
              <p className="text-[12.5px] text-os-muted">Aucun encours ancien : tout ce qui est dû a moins de 7 jours.</p>
            ) : (
              <ul className="space-y-1.5">
                {debt.aged.map((a) => (
                  <li key={a.bucket} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="text-os-muted">{a.bucket}</span>
                    <span className="os-num text-os-text">
                      {a.count} · {new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(a.value / 1000)} DT
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/commandes?paiement=pending" className="mt-3 block text-[11px] uppercase tracking-[0.12em] text-os-gold">Filtrer les non réglées</Link>
          </Panel>

          <Panel eyebrow="Raccourcis" title="Vues de travail" sub="Filtres prêts à l'emploi">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["À préparer", link({ statut: "confirmed" })],
                ["En cours de préparation", link({ statut: "preparing" })],
                ["Expédiées", link({ statut: "shipped" })],
                ["Retards", link({ retard: "1" })],
                ["Paiements en échec", link({ paiement: "failed" })],
                ["Annulées", link({ statut: "cancelled" })],
              ].map(([label, href]) => (
                <Link key={label} href={href} className={cn("border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] transition-colors", "border-os-line text-os-muted hover:border-os-line-strong hover:text-os-text")}>
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-os-faint">
              Les filtres de la table se combinent avec ces vues, et chaque vue peut être enregistrée dans votre navigateur depuis l&apos;en-tête du tableau.
            </p>
          </Panel>
        </div>
      </section>

      <section className="mt-3">
        {(statusFilter.length || paymentFilter.length || flat.retard || flat.q) && (
          <div className="mb-2 flex flex-wrap items-center gap-2 border border-os-gold/30 bg-os-gold-soft/40 px-3 py-2 text-[12px] text-os-text">
            <Tag tone="gold">Filtre actif</Tag>
            {statusFilter.length > 0 && <span>statut : {ORDER_STATUS_LABELS[statusFilter[0] as OrderStatus]}</span>}
            {paymentFilter.length > 0 && <span>paiement : {paymentFilter[0]}</span>}
            {flat.retard === "1" && <span>en retard de plus de 72 h</span>}
            {flat.q && <span>recherche : « {flat.q} »</span>}
            <Link href={`/admin/commandes?p=${period.key}`} className="ml-auto underline">Retirer les filtres</Link>
          </div>
        )}
        <OrdersTable rows={tableRows} />
      </section>
    </div>
  );
}
