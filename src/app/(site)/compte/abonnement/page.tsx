import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, orderItems, products, subscriptionItems, subscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { SubscriptionManager, SubscribeComposer, type SubData } from "@/components/experience/subscriptions";
import { AccountCard, cardPad } from "@/components/account/account-ui";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";

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
    <section aria-labelledby="abo-title" className="max-w-[60rem]">
      <SectionBrow index="07" eyebrow={t.kicker} title={t.title} description={t.intro} />

      <Reveal y={10} className="mt-8">
        <ul className="grid gap-3 sm:grid-cols-2">
          {t.perks.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 rounded-[3px] border border-stone/60 bg-ivory px-5 py-4 text-[12.5px] leading-relaxed text-charcoal shadow-whisper"
            >
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne-2" />
              {p}
            </li>
          ))}
        </ul>
      </Reveal>

      {subs.length > 0 ? (
        <div className="mt-10">
          <SubscriptionManager subs={subs} />
        </div>
      ) : (
        <Reveal y={12} className="mt-10">
          <AccountCard>
            <div className={cardPad}>
              <p className="mb-6 max-w-[40rem] text-[13.5px] leading-relaxed text-muted">{t.noneText}</p>
              <SubscribeComposer suggestions={recent} />
            </div>
          </AccountCard>
        </Reveal>
      )}
    </section>
  );
}
