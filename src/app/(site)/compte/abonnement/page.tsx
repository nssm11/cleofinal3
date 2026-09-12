import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, orderItems, products, subscriptionItems, subscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { SubscriptionManager, SubscribeComposer, type SubData } from "@/components/experience/subscriptions";
import { EmptyState } from "@/components/ui/primitives";
import { formatDT } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon Abonnement" };

export default async function AbonnementPage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.subscription;

  const rows = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      frequencyDays: subscriptions.frequencyDays,
      nextDueAt: subscriptions.nextDueAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, me.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(6);

  const subs: SubData[] = [];
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const itemRows = await db
      .select({
        subId: subscriptionItems.subscriptionId,
        id: subscriptionItems.id,
        productId: subscriptionItems.productId,
        name: products.name,
        brandName: brands.name,
        image: products.image,
        priceMillimes: products.priceMillimes,
      })
      .from(subscriptionItems)
      .innerJoin(products, eq(products.id, subscriptionItems.productId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(inArray(subscriptionItems.subscriptionId, ids));
    for (const r of rows) {
      const items = itemRows.filter((i) => i.subId === r.id).map(({ subId, ...i }) => i);
      const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, r.id) });
      const subtotal = items.reduce((a, i) => a + i.priceMillimes, 0);
      subs.push({
        id: r.id,
        status: r.status as SubData["status"],
        frequencyDays: r.frequencyDays,
        nextDueAt: (r.nextDueAt ?? new Date()).toISOString(),
        items,
        totalEstimate: Math.round(subtotal * 0.95),
      });
      void sub;
    }
  }

  // Suggestions: the customer's most-ordered references — natural staples.
  const recent = await db
    .select({
      id: products.id,
      name: products.name,
      brandName: brands.name,
      image: products.image,
      priceMillimes: products.priceMillimes,
      n: sql<number>`count(*)::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(sql`EXISTS (SELECT 1 FROM orders o WHERE o.id = ${orderItems.orderId} AND o.user_id = ${me.id})`)
    .groupBy(products.id, products.name, brands.name, products.image, products.priceMillimes)
    .orderBy(desc(sql`count(*)`))
    .limit(4);

  return (
    <section aria-labelledby="abo-title" className="max-w-[56rem]">
      <p className="rule-label mb-4">{t.kicker}</p>
      <h1 id="abo-title" className="font-display text-display-md leading-[1.05] tracking-[-0.02em] text-ink">
        {t.title}
      </h1>
      <p className="mt-4 max-w-[42rem] text-[14px] leading-[1.8] text-muted">{t.intro}</p>
      <ul className="mt-7 grid gap-2 sm:grid-cols-2">
        {t.perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5 border border-stone-2/40 bg-cream/60 px-4 py-2.5 text-[12.5px] leading-relaxed text-charcoal">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
            {p}
          </li>
        ))}
      </ul>

      {subs.length > 0 ? (
        <div className="mt-10">
          <SubscriptionManager subs={subs} />
        </div>
      ) : (
        <div className="mt-10">
          <p className="mb-6 max-w-[38rem] text-[13.5px] leading-relaxed text-muted">{t.noneText}</p>
          <SubscribeComposer suggestions={recent} />
        </div>
      )}
    </section>
  );
}
