import Link from "next/link";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventoryMovements, products, restockAlerts } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { AdminPage, Panel, Table } from "@/components/admin/ui";
import { StockForm } from "@/components/admin/stock-form";
export const dynamic = "force-dynamic";
export default async function AdminStock() {
  const [all, low, moves] = await Promise.all([
    db.select({ id: products.id, name: products.name, stock: products.stock }).from(products).orderBy(asc(products.name)),
    db.select({ id: products.id, name: products.name, stock: products.stock, t: products.lowStockThreshold, waiters: sql<number>`count(case when ${restockAlerts.notifiedAt} is null then ${restockAlerts.id} end)::int` }).from(products).leftJoin(restockAlerts, and(eq(restockAlerts.productId, products.id), isNull(restockAlerts.notifiedAt))).where(sql`${products.stock} <= ${products.lowStockThreshold}`).groupBy(products.id, products.name, products.stock, products.lowStockThreshold).orderBy(asc(products.stock)),
    db.select({ id: inventoryMovements.id, type: inventoryMovements.type, q: inventoryMovements.quantity, after: inventoryMovements.stockAfter, reason: inventoryMovements.reason, at: inventoryMovements.createdAt, name: products.name }).from(inventoryMovements).innerJoin(products, eq(products.id, inventoryMovements.productId)).orderBy(desc(inventoryMovements.createdAt)).limit(100),
  ]);
  return (
    <AdminPage title="Stock" sub={`${low.length} alerte(s)`}>
      <Panel className="mb-8 p-5"><h2 className="mb-4 text-[10px] uppercase tracking-[0.16em] text-ops-muted">Ajustement</h2><StockForm products={all} /></Panel>
      {low.length > 0 && <div className="mb-8"><h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-ops-muted">Alertes stock bas — et les mains levées</h2><ul className="grid gap-px border border-ops-line bg-ops-line sm:grid-cols-2 lg:grid-cols-3">{low.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 bg-ops-canvas px-4 py-3 text-sm"><Link href={`/admin/produits/${p.id}`} className="truncate hover:underline">{p.name}</Link><span className="flex shrink-0 items-center gap-2.5"><span className={`tabular-nums ${p.stock === 0 ? "text-crit" : "text-amber"}`}>{p.stock} / seuil {p.t}</span>{p.waiters > 0 && <span className="border border-ops-line px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-ops-muted">{p.waiters} attendu{p.waiters > 1 ? "s" : ""}</span>}</span></li>)}</ul></div>}
      <h2 className="mb-3 text-[10px] uppercase tracking-[0.16em] text-ops-muted">Historique des mouvements</h2>
      <Table head={["Date", "Produit", "Type", "Qté", "Après", "Motif"]}>{moves.map((m) => <tr key={m.id}><td className="px-4 py-2.5 text-xs text-ops-muted">{formatDateTime(m.at)}</td><td className="px-4 py-2.5">{m.name}</td><td className="px-4 py-2.5 text-xs uppercase tracking-[0.12em] text-ops-muted">{m.type}</td><td className={`px-4 py-2.5 tabular-nums ${m.q < 0 ? "text-crit" : "text-ok"}`}>{m.q > 0 ? `+${m.q}` : m.q}</td><td className="px-4 py-2.5 tabular-nums">{m.after}</td><td className="px-4 py-2.5 text-ops-muted">{m.reason}</td></tr>)}</Table>
    </AdminPage>
  );
}
