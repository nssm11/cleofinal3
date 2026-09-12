import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, products, rituals } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { Rituals, type RitualData, type RitualItem } from "@/components/experience/rituals";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon Rituel" };

export default async function RituelsPage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const t = copy.ritual;
  const rows = await db
    .select()
    .from(rituals)
    .where(eq(rituals.userId, me.id))
    .orderBy(desc(rituals.updatedAt));

  // Expand the stored product ids to display rows, preserving each ritual's order.
  const allIds = [...new Set(rows.flatMap((r) => (r.items ?? []).map((i) => i.productId)))];
  let prodRows: { id: number; name: string; brandName: string | null; image: string | null; priceMillimes: number; stock: number; volume: string | null }[] = [];
  if (allIds.length) {
    prodRows = await db
      .select({
        id: products.id,
        name: products.name,
        brandName: brands.name,
        image: products.image,
        priceMillimes: products.priceMillimes,
        stock: products.stock,
        volume: products.volume,
      })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(sql`${products.id} in (${sql.join(allIds.map((i) => sql`${i}`), sql`, `)})`);
  }
  const byId = new Map(prodRows.map((p) => [p.id, p]));
  const data: RitualData[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    moment: r.moment === "evening" ? "evening" : "morning",
    season: r.season,
    reminderEnabled: r.reminderEnabled,
    reminderHour: r.reminderHour,
    reminderDays: r.reminderDays,
    items: (r.items ?? [])
      .filter((i) => byId.has(i.productId))
      .map<RitualItem>((i) => ({ productId: i.productId, note: i.note, ...byId.get(i.productId)! })),
  }));

  return (
    <section aria-labelledby="rituel-title" className="max-w-[60rem]">
      <h1 id="rituel-title" className="font-display text-display-md leading-[1.05] tracking-[-0.02em] text-ink">
        {t.title}
      </h1>
      <p className="mt-4 max-w-[44rem] text-[14px] leading-[1.8] text-muted">{t.intro}</p>
      <div className="mt-10">
        <Rituals initial={data} />
      </div>
    </section>
  );
}
