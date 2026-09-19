import type { Metadata } from "next";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { Metric, SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Prévisions stock" };
export const dynamic = "force-dynamic";

export default async function ForecastPage() {
  const rows = await db.select({ id: products.id, slug: products.slug, name: products.name, brand: brands.name, stock: products.stock, low: products.lowStockThreshold, sales: products.salesCount, price: products.priceMillimes }).from(products).leftJoin(brands, eq(brands.id, products.brandId)).where(eq(products.status, "active")).orderBy(asc(products.stock)).limit(40);
  const forecast = rows.map((p) => { const daily = Math.max(0.15, p.sales / 210); const days = Math.floor(p.stock / daily); return { ...p, daily, days, reorder: Math.max(6, Math.ceil(daily * 30) - p.stock) }; });
  return <div className="space-y-5"><SectionHead eyebrow="Forecast" title="Inventory forecasting dashboard" sub="New module estimating days of cover from demo sales velocity and current stock." /><div className="grid gap-3 md:grid-cols-4"><Metric label="At risk &lt; 14 days" value={forecast.filter((x)=>x.days<14).length} /><Metric label="Low stock" value={forecast.filter((x)=>x.stock<=x.low).length} /><Metric label="Suggested units" value={forecast.reduce((a,b)=>a+Math.max(0,b.reorder),0)} /><Metric label="Products" value={forecast.length} /></div><Sheet><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-os-line text-left os-label text-os-faint"><th className="py-2">Product</th><th>Stock</th><th>Daily velocity</th><th>Cover</th><th>Suggestion</th></tr></thead><tbody>{forecast.map((p) => <tr key={p.id} className="border-b border-os-line"><td className="py-3"><span className="block text-os-text">{p.name}</span><span className="text-os-faint">{p.brand}</span></td><td>{p.stock}</td><td>{p.daily.toFixed(2)}</td><td>{p.days < 14 ? <Tag tone="bad">{p.days} days</Tag> : p.days < 30 ? <Tag tone="warn">{p.days} days</Tag> : <Tag tone="good">{p.days} days</Tag>}</td><td>{p.reorder > 0 ? `${p.reorder} units` : "No buy"}</td></tr>)}</tbody></table></div></Sheet></div>;
}
