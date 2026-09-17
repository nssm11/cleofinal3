import type { Metadata } from "next";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, orderItems, products, subscriptionItems, subscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { SubscriptionManager, SubscribeComposer, type SubData } from "@/components/experience/subscriptions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon Abonnement" };

export default async function AbonnementPage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.subscription;

  const rows = await db.select({ id: subscriptions.id, status: subscriptions.status, frequencyDays: subscriptions.frequencyDays, nextDueAt: subscriptions.nextDueAt }).from(subscriptions).where(eq(subscriptions.userId, me.id)).orderBy(desc(subscriptions.createdAt)).limit(6);

  const subs: SubData[] = [];
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const itemRows = await db.select({ subId: subscriptionItems.subscriptionId, id: subscriptionItems.id, productId: subscriptionItems.productId, name: products.name, brandName: brands.name, image: products.image, priceMillimes: products.priceMillimes }).from(subscriptionItems).innerJoin(products, eq(products.id, subscriptionItems.productId)).leftJoin(brands, eq(brands.id, products.brandId)).where(inArray(subscriptionItems.subscriptionId, ids));
    for (const r of rows) {
      const items = itemRows.filter((i) => i.subId === r.id).map(({ subId, ...i }) => i);
      const subtotal = items.reduce((a, i) => a + i.priceMillimes, 0);
      subs.push({ id: r.id, status: r.status as SubData["status"], frequencyDays: r.frequencyDays, nextDueAt: (r.nextDueAt ?? new Date()).toISOString(), items, totalEstimate: Math.round(subtotal * 0.95) });
    }
  }

  const recent = await db.select({ id: products.id, name: products.name, brandName: brands.name, image: products.image, priceMillimes: products.priceMillimes, n: sql<number>`count(*)::int` }).from(orderItems).innerJoin(products, eq(products.id, orderItems.productId)).leftJoin(brands, eq(brands.id, products.brandId)).where(sql`EXISTS (SELECT 1 FROM orders o WHERE o.id = ${orderItems.orderId} AND o.user_id = ${me.id})`).groupBy(products.id, products.name, brands.name, products.image, products.priceMillimes).orderBy(desc(sql`count(*)`)).limit(4);

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">07 — {t.kicker}</p>
        <h1 className="mt-3 font-sans text-[24px] font-semibold tracking-[-0.02em]">{t.title}</h1>
        <p className="mt-2 max-w-[50ch] font-sans text-[13px] text-text-secondary">{t.intro}</p>
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {t.perks.map((p) => <div key={p} className="border border-line bg-bg-2 p-4 font-sans text-[12px] leading-[1.5]">{p}</div>)}
      </div>

      {subs.length > 0 ? (
        <div className="mt-10"><SubscriptionManager subs={subs} /></div>
      ) : (
        <div className="mt-10 border border-line bg-bg p-6">
          <p className="font-sans text-[13px] text-text-secondary">{t.noneText}</p>
          <div className="mt-6"><SubscribeComposer suggestions={recent} /></div>
        </div>
      )}
    </div>
  );
}
