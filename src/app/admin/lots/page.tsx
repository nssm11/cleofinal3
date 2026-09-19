import Link from "next/link";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { productLots, products, stores } from "@/db/schema";
import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { DateLotForm, LotStatusForm, ReceiveLotForm, SweepExpiredForm } from "@/components/admin/lots";
import { expiryAlerts, stockDrift } from "@/lib/lot-stock";
import { daysUntil, lotMonthLabel } from "@/lib/lots";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lots & péremption" };

/**
 * LES LOTS — l'étagère, datée.
 *
 * This screen exists because a pharmacy's stock is not a number, it is a
 * shelf of dated boxes. Three questions, in the order a pharmacist asks them:
 *
 *   1. What must come off the shelf today?   → the alerts, worst first
 *   2. What cannot be sold because it has no date? → the undated queue
 *   3. Where is everything, exactly?          → the ledger, lot by lot
 *
 * Nothing here is decorative: each row can be dated, pulled, destroyed or put
 * back, and every one of those moves writes an event and moves the stock.
 */
export default async function AdminLots() {
  const now = new Date();
  const alerts = await expiryAlerts(now);

  const [rows, counters, productList, drift] = await Promise.all([
    db
      .select({
        id: productLots.id,
        productId: productLots.productId,
        name: products.name,
        slug: products.slug,
        storeName: stores.name,
        lot: productLots.lot,
        expiresAt: productLots.expiresAt,
        quantity: productLots.quantity,
        placed: productLots.placed,
        status: productLots.status,
        supplier: productLots.supplier,
        receivedAt: productLots.receivedAt,
        note: productLots.note,
        productStock: products.stock,
      })
      .from(productLots)
      .innerJoin(products, eq(products.id, productLots.productId))
      .innerJoin(stores, eq(stores.id, productLots.storeId))
      .orderBy(asc(productLots.expiresAt), asc(products.name))
      .limit(400),
    db.select({ id: stores.id, name: stores.name }).from(stores).orderBy(asc(stores.id)),
    db.select({ id: products.id, name: products.name, stock: products.stock }).from(products).where(gt(products.stock, 0)).orderBy(asc(products.name)),
    stockDrift(12),
  ]);

  const undated = await db
    .select({ id: productLots.id, lot: productLots.lot, quantity: productLots.quantity, name: products.name, storeName: stores.name })
    .from(productLots)
    .innerJoin(products, eq(products.id, productLots.productId))
    .innerJoin(stores, eq(stores.id, productLots.storeId))
    .where(and(eq(productLots.status, "sale"), sql`${productLots.expiresAt} IS NULL`, gt(productLots.quantity, 0)))
    .orderBy(asc(products.name));

  const units = rows.reduce((a, r) => (r.status === "sale" ? a + r.quantity : a), 0);
  const shelfUnits = rows.reduce((a, r) => (r.status === "sale" && r.placed === "shelf" ? a + r.quantity : a), 0);

  return (
    <AdminPage
      title="Lots & péremption"
      eyebrow="Conformité"
      sub={`${rows.length} lots suivis · ${units} unités en vente · ${shelfUnits} en rayon · prochaine échéance ${alerts.lots[0] ? lotMonthLabel(alerts.lots[0].expiresAt) : "—"}`}
      action={<SweepExpiredForm />}
    >
      {/* ── 1. ce qui doit sortir du rayon ─────────────────────────────── */}
      <div className="mb-8 grid gap-px border border-ops-line bg-ops-line sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Périmés, en rayon" value={alerts.expired} tone={alerts.expired > 0 ? "crit" : "ok"} hint="à retirer aujourd'hui" />
        <Stat label="Sous 30 jours" value={alerts.critical} tone={alerts.critical > 0 ? "warn" : "ok"} hint="sortir ou remiser" />
        <Stat label="Sous 90 jours" value={alerts.watch} tone="muted" hint="à surveiller" />
        <Stat label="Sans date" value={alerts.undated} tone={alerts.undated > 0 ? "warn" : "ok"} hint="invendables en l'état" />
      </div>

      {alerts.lots.length > 0 && (
        <Panel title="Échéances — les premières d'abord" className="mb-8">
          <Table head={["Péremption", "Produit", "Lot", "Comptoir", "Unités", "Placement", "Reste", "Action"]} minWidth="min-w-[900px]">
            {alerts.lots.map((l) => {
              const d = l.days ?? 0;
              return (
                <tr key={l.id} className="border-b border-ops-line/60 last:border-0">
                  <td className="px-4 py-2.5 tabular-nums">{lotMonthLabel(l.expiresAt)}</td>
                  <td className="max-w-[240px] px-4 py-2.5">
                    {l.productId ? <Link href={`/admin/produits/${l.productId}`} className="hover:underline">{l.productName}</Link> : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{l.lot}</td>
                  <td className="px-4 py-2.5 text-ops-muted">{l.storeName}</td>
                  <td className="px-4 py-2.5 tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-2.5 text-ops-muted">{l.placed === "shelf" ? "Rayon" : "Réserve"}</td>
                  <td className={`px-4 py-2.5 tabular-nums ${d < 0 ? "text-crit" : d <= 30 ? "text-amber" : "text-ops-muted"}`}>{d < 0 ? `périmé (${Math.abs(d)} j)` : `${d} j`}</td>
                  <td className="px-4 py-2.5"><LotStatusForm lotId={l.id} status={l.status} label={l.lot} /></td>
                </tr>
              );
            })}
          </Table>
        </Panel>
      )}

      {/* ── 2. les lots sans date ──────────────────────────────────────── */}
      <Panel title="Lots sans date — invendables jusqu'à la saisie" className="mb-8">
        {undated.length === 0 ? (
          <p className="px-5 py-4 text-[13px] text-ops-muted">Chaque lot en stock porte une date. C&apos;est l&apos;état normal.</p>
        ) : (
          <ul className="divide-y divide-ops-line/60">
            {undated.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <span className="text-[13px]">
                  <span className="font-mono text-[12px]">{u.lot}</span> · {u.name}
                  <span className="ml-2 text-ops-muted">{u.quantity} unité(s) · {u.storeName}</span>
                </span>
                <DateLotForm lotId={u.id} label={u.lot} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ── 3. la réception ────────────────────────────────────────────── */}
      <Panel title="Réceptionner un lot" className="mb-8">
        <div className="px-5 py-5">
          <ReceiveLotForm products={productList} stores={counters} />
        </div>
      </Panel>

      {/* ── 4. le registre ─────────────────────────────────────────────── */}
      <Panel title="Registre des lots" className="mb-8">
        <Table head={["Produit", "Lot", "Péremption", "Reste", "Comptoir", "Placement", "Statut", "Fournisseur", "Reçu le", "Action"]} minWidth="min-w-[1100px]">
          {rows.map((r) => {
            const d = daysUntil(r.expiresAt, now);
            return (
              <tr key={r.id} className="border-b border-ops-line/60 last:border-0">
                <td className="max-w-[240px] px-4 py-2.5"><Link href={`/admin/produits/${r.productId}`} className="hover:underline">{r.name}</Link></td>
                <td className="px-4 py-2.5 font-mono text-[12px]">{r.lot}</td>
                <td className="px-4 py-2.5 tabular-nums">
                  {r.expiresAt ? lotMonthLabel(r.expiresAt) : <span className="text-amber">non communiquée</span>}
                  {d !== null && <span className={`ml-2 text-[11px] ${d < 0 ? "text-crit" : d <= 30 ? "text-amber" : "text-ops-muted"}`}>{d < 0 ? "périmé" : `${d} j`}</span>}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{r.quantity}</td>
                <td className="px-4 py-2.5 text-ops-muted">{r.storeName}</td>
                <td className="px-4 py-2.5 text-ops-muted">{r.placed === "shelf" ? "Rayon" : "Réserve"}</td>
                <td className="px-4 py-2.5 text-[11px] uppercase tracking-[0.1em]">{r.status}</td>
                <td className="px-4 py-2.5 text-ops-muted">{r.supplier ?? "—"}</td>
                <td className="px-4 py-2.5 text-ops-muted">{formatDateTime(r.receivedAt)}</td>
                <td className="px-4 py-2.5"><LotStatusForm lotId={r.id} status={r.status} label={r.lot} /></td>
              </tr>
            );
          })}
        </Table>
      </Panel>

      {/* ── 5. l'écart entre l'étagère et le chiffre ───────────────────── */}
      <Panel title="Stock que les lots n'expliquent pas">
        {drift.length === 0 ? (
          <p className="px-5 py-4 text-[13px] text-ops-muted">Le chiffre de stock et les lots disent exactement la même chose. C&apos;est l&apos;état normal.</p>
        ) : (
          <Table head={["Produit", "Stock affiché", "En lots valides", "Écart", "Explication"]} minWidth="min-w-[700px]">
            {drift.map((d) => (
              <tr key={d.productId} className="border-b border-ops-line/60 last:border-0">
                <td className="px-4 py-2.5"><Link href={`/admin/produits/${d.productId}`} className="hover:underline">{d.name}</Link></td>
                <td className="px-4 py-2.5 tabular-nums">{d.stock}</td>
                <td className="px-4 py-2.5 tabular-nums">{d.inLots}</td>
                <td className={`px-4 py-2.5 tabular-nums ${d.drift > 0 ? "text-amber" : "text-crit"}`}>{d.drift > 0 ? `+${d.drift}` : d.drift}</td>
                <td className="px-4 py-2.5 text-ops-muted">
                  {d.drift > 0 ? "des unités vendues sans lot enregistré" : "des lots en retard sur le chiffre — à recompter"}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}

function Stat({ label, value, tone, hint }: { label: string; value: number; tone: "ok" | "warn" | "crit" | "muted"; hint: string }) {
  const color = tone === "crit" ? "text-crit" : tone === "warn" ? "text-amber" : tone === "ok" ? "text-ok" : "text-ops-text";
  return (
    <div className="bg-ops-surface px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ops-muted">{label}</p>
      <p className={`mt-1 font-sans text-[1.7rem] leading-none tabular-nums ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] text-ops-muted">{hint}</p>
    </div>
  );
}
