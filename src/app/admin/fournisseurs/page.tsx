import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { productLots, products } from "@/db/schema";
import { Metric, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Fournisseurs" };
export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const rows = await db.select({ supplier: productLots.supplier, refs: sql<number>`count(distinct ${productLots.productId})::int`, units: sql<number>`sum(${productLots.quantity})::int`, near: sql<number>`count(*) filter (where ${productLots.expiresAt} < now() + interval '120 days')::int` }).from(productLots).innerJoin(products, sql`${products.id} = ${productLots.productId}`).groupBy(productLots.supplier).orderBy(sql`sum(${productLots.quantity}) desc`).limit(30);
  const clean = rows.map((r) => ({ ...r, supplier: r.supplier ?? "Non renseigné" }));
  return <div className="space-y-5"><SectionHead eyebrow="Supply" title="Supplier management centre" sub="New back-office module: supplier directory, lot counts, lead-time placeholders, near-expiry exposure and purchase-order entry points." /><div className="grid gap-3 md:grid-cols-4"><Metric label="Suppliers" value={clean.length} /><Metric label="Units" value={clean.reduce((a,b)=>a+(b.units??0),0)} /><Metric label="References" value={clean.reduce((a,b)=>a+(b.refs??0),0)} /><Metric label="Near expiry lots" value={clean.reduce((a,b)=>a+(b.near??0),0)} /></div><Sheet><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-os-line text-left os-label text-os-faint"><th className="py-2">Supplier</th><th>Refs</th><th>Units</th><th>Risk</th><th>Next action</th></tr></thead><tbody>{clean.map((r) => <tr key={r.supplier} className="border-b border-os-line"><td className="py-3 text-os-text">{r.supplier}</td><td>{r.refs}</td><td>{r.units}</td><td>{r.near ? <Tag tone="warn">{r.near} near</Tag> : <Tag tone="good">clear</Tag>}</td><td className="text-os-muted">Confirm lead time · create PO draft</td></tr>)}</tbody></table></div></Sheet></div>;
}
