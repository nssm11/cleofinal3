import Link from "next/link";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { productLots, products, stores } from "@/db/schema";
import { AdminPage } from "@/components/admin/ui";
import { Barcode } from "@/components/kit/barcode";
import { lotMonthLabel, daysUntil } from "@/lib/lots";
import { formatDT } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Étiquettes rayon" };

/**
 * LES ÉTIQUETTES DU RAYON
 *
 * What actually goes on the shelf edge: the name, the price, the real barcode,
 * and — for a box that must leave first — the lot and its month. Printed in
 * black on white because that is what a scanner and a tired eye both need at
 * nine in the evening.
 *
 * The page is meant to be printed, so everything else disappears: no chrome,
 * no colour, no question of where the printer will cut. A shelf label that
 * cannot be cut out is a shelf label nobody uses.
 */
export default async function EtiquettesPage({ searchParams }: { searchParams: Promise<{ comptoir?: string; peril?: string }> }) {
  const sp = await searchParams;
  const storeFilter = sp.comptoir ? Number(sp.comptoir) : null;
  const soonOnly = sp.peril === "1";

  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      sku: products.sku,
      barcode: products.barcode,
      price: products.priceMillimes,
      compare: products.compareAtMillimes,
      volume: products.volume,
      lot: productLots.lot,
      expiresAt: productLots.expiresAt,
      quantity: productLots.quantity,
      clearance: productLots.clearancePercent,
      placed: productLots.placed,
      storeId: stores.id,
      storeName: stores.name,
    })
    .from(productLots)
    .innerJoin(products, eq(products.id, productLots.productId))
    .innerJoin(stores, eq(stores.id, productLots.storeId))
    .where(
      and(
        eq(productLots.status, "sale"),
        gt(productLots.quantity, 0),
        sql`${productLots.expiresAt} IS NOT NULL`,
        sql`${productLots.expiresAt} > now()`,
        storeFilter ? eq(productLots.storeId, storeFilter) : sql`true`,
      ),
    )
    .orderBy(asc(products.name), asc(productLots.expiresAt))
    .limit(120);

  const shown = soonOnly ? rows.filter((r) => (daysUntil(r.expiresAt) ?? 999) <= 90) : rows;
  const counters = await db.select({ id: stores.id, name: stores.name }).from(stores).orderBy(asc(stores.id));

  return (
    <AdminPage
      title="Étiquettes rayon"
      eyebrow="Lots & péremption"
      sub={`${shown.length} étiquette(s) — le papier se découpe, le code se scanne. Le premier lot de chaque référence porte sa date.`}
      action={
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Link href="/admin/lots" className="text-[12px] underline decoration-dotted">
            Retour aux lots
          </Link>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2 text-[12px] print:hidden">
        <Link href="/admin/lots/etiquettes" className={`border px-3 py-1.5 ${!storeFilter && !soonOnly ? "border-ops-gold text-ops-gold" : "border-ops-line text-ops-muted"}`}>
          Tout
        </Link>
        {counters.map((c) => (
          <Link key={c.id} href={`/admin/lots/etiquettes?comptoir=${c.id}`} className={`border px-3 py-1.5 ${storeFilter === c.id ? "border-ops-gold text-ops-gold" : "border-ops-line text-ops-muted"}`}>
            {c.name}
          </Link>
        ))}
        <Link href="/admin/lots/etiquettes?peril=1" className={`border px-3 py-1.5 ${soonOnly ? "border-ops-gold text-ops-gold" : "border-ops-line text-ops-muted"}`}>
          À surveiller (moins de 3 mois)
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-[3mm] sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {shown.map((r) => {
          const days = daysUntil(r.expiresAt);
          const price = r.clearance > 0 ? Math.round(r.price * (1 - r.clearance / 100)) : r.price;
          return (
            <article key={`${r.productId}-${r.lot}`} className="flex flex-col items-center border border-ops-line bg-white px-3 py-3 text-center print:break-inside-avoid print:border-black">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-ops-muted print:text-black">{r.storeName}</p>
              <p className="mt-1 line-clamp-2 min-h-[2.4em] text-[11px] font-semibold leading-tight">{r.name}</p>
              <p className="mt-0.5 text-[10px] text-ops-muted print:text-black">
                {r.volume ?? ""} {r.sku}
              </p>
              <p className="mt-1.5 font-sans text-[15px] font-semibold tabular-nums">
                {formatDT(price)}
                {r.clearance > 0 && <span className="ml-1 text-[10px] font-bold text-crit print:text-black">−{r.clearance}%</span>}
              </p>
              <div className="mt-2">
                <Barcode code={r.barcode} height={34} />
              </div>
              <p className="mt-1.5 font-mono text-[10px] leading-tight">
                Lot {r.lot}
                <br />
                DLC {lotMonthLabel(r.expiresAt)}
                {days !== null && <span className="ml-1">({days} j)</span>}
              </p>
              {r.clearance > 0 && (
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-crit print:text-black">
                  Date courte — à vendre en premier
                </p>
              )}
            </article>
          );
        })}
      </div>

      {shown.length === 0 && <p className="py-10 text-center text-[13px] text-ops-muted">Aucun lot daté et vendable sur ce filtre.</p>}

      <p className="mt-8 max-w-2xl text-[11px] leading-relaxed text-ops-muted print:hidden">
        Chaque étiquette porte le code-barres réel de la référence et, quand plusieurs lots coexistent, la date du lot concerné. Le prix barré n&apos;est jamais simulé : une remise n&apos;apparaît que si elle a été décidée sur ce lot précis, dans sa fiche.
      </p>
    </AdminPage>
  );
}
