import "server-only";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { lotEvents, productLots, products, stores } from "@/db/schema";
import { chooseLots, daysUntil, earliestExpiry, isSellable, sellableUnits, unsellableUnits, type LotStatus } from "@/lib/lots";

/**
 * The database half of the lots.
 *
 * `src/lib/lots.ts` decides; this file only asks and writes. Every write here
 * leaves an event behind, because stock that moves without a trace is stock
 * nobody can explain at the end of the month — and, in a pharmacy, stock nobody
 * can explain is stock nobody can sell.
 */

export type LotRow = {
  id: number;
  productId: number;
  storeId: number;
  storeSlug: string | null;
  storeName: string | null;
  lot: string;
  expiresAt: Date | null;
  quantity: number;
  placed: "shelf" | "back";
  status: LotStatus;
  supplier: string | null;
  receivedAt: Date;
  note: string | null;
};

export type StoreShelf = {
  slug: string;
  name: string;
  sellable: number;
  shelf: number;
  back: number;
  earliest: Date | null;
  undated: number;
};

export type ShelfSummary = {
  sellable: number;
  earliest: Date | null;
  undated: number;
  expired: number;
  held: number;
  perStore: StoreShelf[];
};

const lotSelect = {
  id: productLots.id,
  productId: productLots.productId,
  storeId: productLots.storeId,
  storeSlug: stores.slug,
  storeName: stores.name,
  lot: productLots.lot,
  expiresAt: productLots.expiresAt,
  quantity: productLots.quantity,
  placed: productLots.placed,
  status: productLots.status,
  supplier: productLots.supplier,
  receivedAt: productLots.receivedAt,
  note: productLots.note,
};

export async function lotsFor(productIds: number[]): Promise<LotRow[]> {
  if (!productIds.length) return [];
  return db
    .select(lotSelect)
    .from(productLots)
    .leftJoin(stores, eq(stores.id, productLots.storeId))
    .where(inArray(productLots.productId, productIds))
    .orderBy(asc(productLots.expiresAt), asc(productLots.id));
}

/** Everything one product's shelf can say about itself, without a second query. */
export function summarise(lots: readonly LotRow[], now: Date = new Date()): ShelfSummary {
  const perStore = new Map<number, StoreShelf>();
  for (const l of lots) {
    const key = l.storeId;
    const row = perStore.get(key) ?? {
      slug: l.storeSlug ?? String(key),
      name: l.storeName ?? `Comptoir ${key}`,
      sellable: 0,
      shelf: 0,
      back: 0,
      earliest: null,
      undated: 0,
    };
    if (isSellable(l, now)) {
      row.sellable += l.quantity;
      if (l.placed === "shelf") row.shelf += l.quantity;
      else row.back += l.quantity;
      if (l.expiresAt && (!row.earliest || l.expiresAt < row.earliest)) row.earliest = l.expiresAt;
    } else if (l.status === "sale" && daysUntil(l.expiresAt, now) === null && l.quantity > 0) {
      row.undated += l.quantity;
    }
    perStore.set(key, row);
  }
  const blocked = unsellableUnits(lots, now);
  return {
    sellable: sellableUnits(lots, now),
    earliest: earliestExpiry(lots, now),
    undated: blocked.undated,
    expired: blocked.expired,
    held: blocked.held,
    perStore: [...perStore.values()].sort((a, b) => b.sellable - a.sellable),
  };
}

export async function shelfSummary(productIds: number[], now: Date = new Date()): Promise<Map<number, ShelfSummary>> {
  const rows = await lotsFor(productIds);
  const byProduct = new Map<number, LotRow[]>();
  for (const r of rows) {
    const list = byProduct.get(r.productId) ?? [];
    list.push(r);
    byProduct.set(r.productId, list);
  }
  const out = new Map<number, ShelfSummary>();
  for (const [id, list] of byProduct) out.set(id, summarise(list, now));
  return out;
}

/** One product's lots, for the fiche and the counter. */
export async function shelfFor(productId: number, now: Date = new Date()): Promise<{ lots: LotRow[]; summary: ShelfSummary }> {
  const lots = await lotsFor([productId]);
  return { lots, summary: summarise(lots, now) };
}

export type LotAllocation = { lotNumber: string; expiresAt: Date | null; quantity: number };

/**
 * FEFO against the database, inside the caller's transaction. Locks the lot
 * rows, so two simultaneous checkouts cannot take the same box.
 *
 * Returns what it took. A shortage is reported, never silently ignored: the
 * caller decides whether to refuse the sale (checkout does) or tell the counter.
 */
export async function consumeLots(
  tx: Tx,
  args: { productId: number; quantity: number; orderId?: number; userId?: number | null; reason?: string },
): Promise<{ lines: LotAllocation[]; short: number }> {
  if (args.quantity <= 0) return { lines: [], short: 0 };
  const rows = await tx.execute(sql`
    SELECT id, lot, expires_at, quantity, placed, status
      FROM product_lots
     WHERE product_id = ${args.productId}
       AND status = 'sale'
       AND quantity > 0
       AND expires_at IS NOT NULL
       AND expires_at >= now()
     ORDER BY expires_at ASC, (placed = 'shelf') DESC, id ASC
       FOR UPDATE`);
  const lots = (rows.rows as Array<{ id: number; lot: string; expires_at: string | Date; quantity: number; placed: "shelf" | "back"; status: LotStatus }>).map((r) => ({
    id: r.id,
    lot: r.lot,
    expiresAt: r.expires_at instanceof Date ? r.expires_at : new Date(r.expires_at),
    quantity: r.quantity,
    status: r.status,
    placed: r.placed,
  }));
  const { picks, short } = chooseLots(lots, args.quantity);

  const lines: LotAllocation[] = [];
  for (const p of picks) {
    await tx.execute(sql`UPDATE product_lots SET quantity = quantity - ${p.take}, updated_at = now() WHERE id = ${p.lot.id}`);
    await tx.insert(lotEvents).values({ lotId: p.lot.id, type: "sold", quantity: -p.take, orderId: args.orderId ?? null, userId: args.userId ?? null, note: args.reason ?? null });
    lines.push({ lotNumber: p.lot.lot, expiresAt: p.lot.expiresAt, quantity: p.take });
  }
  return { lines, short };
}

/** Put units back into the lots they came from — the lots frozen on the order. */
export async function returnToLots(tx: Tx, args: { productId: number; orderId: number; quantity: number; userId?: number | null }): Promise<number> {
  const items = await tx.execute(sql`
    SELECT lot_number FROM order_items
     WHERE order_id = ${args.orderId} AND product_id = ${args.productId} AND lot_number IS NOT NULL
     ORDER BY id ASC LIMIT 1`);
  const first = (items.rows as Array<{ lot_number: string | null }>)[0]?.lot_number;
  if (!first) return 0; // legacy line: no lot to return to, and the drift report will say so
  const rows = await tx.execute(sql`
    UPDATE product_lots SET quantity = quantity + ${args.quantity}, updated_at = now()
     WHERE product_id = ${args.productId} AND lot = ${first}
     RETURNING id`);
  const lotId = (rows.rows as Array<{ id: number }>)[0]?.id;
  if (!lotId) return 0;
  await tx.insert(lotEvents).values({ lotId, type: "returned", quantity: args.quantity, orderId: args.orderId, userId: args.userId ?? null, note: "Retour en stock" });
  return args.quantity;
}

export async function receiveLot(
  tx: Tx,
  args: {
    productId: number;
    storeId: number;
    lot: string;
    /** Null is allowed and means « DLC non communiquée » — the lot exists, undated. */
    expiresAt: Date | null;
    quantity: number;
    placed?: "shelf" | "back";
    supplier?: string | null;
    note?: string | null;
    userId?: number | null;
  },
): Promise<{ id: number; created: boolean }> {
  const lotNumber = args.lot.trim().slice(0, 60) || "SANS-NUMÉRO";
  const existing = await tx
    .select({ id: productLots.id })
    .from(productLots)
    .where(and(eq(productLots.productId, args.productId), eq(productLots.storeId, args.storeId), eq(productLots.lot, lotNumber)))
    .limit(1);
  let id = existing[0]?.id ?? 0;
  let created = false;
  if (id) {
    await tx.execute(sql`
      UPDATE product_lots
         SET quantity = quantity + ${args.quantity},
             expires_at = COALESCE(${args.expiresAt ? args.expiresAt.toISOString() : null}::timestamptz, expires_at),
             supplier = COALESCE(${args.supplier ?? null}, supplier),
             updated_at = now()
       WHERE id = ${id}`);
  } else {
    const [row] = await tx
      .insert(productLots)
      .values({
        productId: args.productId,
        storeId: args.storeId,
        lot: lotNumber,
        expiresAt: args.expiresAt,
        quantity: args.quantity,
        placed: args.placed ?? "shelf",
        supplier: args.supplier ?? null,
        note: args.note ?? null,
      })
      .returning({ id: productLots.id });
    id = row.id;
    created = true;
  }
  await tx.insert(lotEvents).values({
    lotId: id,
    type: "received",
    quantity: args.quantity,
    userId: args.userId ?? null,
    note: args.note ?? (args.expiresAt ? null : "Lot reçu sans date — à dater avant vente"),
  });
  return { id, created };
}

export async function setLotStatus(tx: Tx, args: { lotId: number; status: LotStatus; note?: string | null; userId?: number | null }) {
  const [row] = await tx.update(productLots).set({ status: args.status, note: args.note ?? null, updatedAt: new Date() }).where(eq(productLots.id, args.lotId)).returning({ id: productLots.id, quantity: productLots.quantity });
  if (!row) throw new Error("Lot introuvable.");
  const type = args.status === "quarantine" ? "quarantined" : args.status === "destroyed" ? "destroyed" : args.status === "returned" ? "returned" : "adjusted";
  await tx.insert(lotEvents).values({ lotId: row.id, type, quantity: 0, note: args.note ?? null, userId: args.userId ?? null });
  return row;
}

/** Date a lot that arrived without one. The only way it becomes sellable. */
export async function dateLot(tx: Tx, args: { lotId: number; expiresAt: Date; userId?: number | null }) {
  const [row] = await tx.update(productLots).set({ expiresAt: args.expiresAt, updatedAt: new Date() }).where(eq(productLots.id, args.lotId)).returning({ id: productLots.id, lot: productLots.lot });
  if (!row) throw new Error("Lot introuvable.");
  await tx.insert(lotEvents).values({ lotId: row.id, type: "dated", quantity: 0, userId: args.userId ?? null, note: `DLC saisie : ${args.expiresAt.toISOString().slice(0, 10)}` });
  return row;
}

/**
 * Move every past-dated lot to quarantine. Run daily: this is the sweep that
 * keeps an expired box from ever being pickable, even if nobody looked.
 */
export async function quarantineOverdue(now: Date = new Date()): Promise<{ lots: number; units: number }> {
  const rows = await db.execute(sql`
    UPDATE product_lots
       SET status = 'quarantine', updated_at = now()
     WHERE status = 'sale' AND quantity > 0 AND expires_at IS NOT NULL AND expires_at < ${now.toISOString()}
     RETURNING id, quantity`);
  const list = rows.rows as Array<{ id: number; quantity: number }>;
  for (const l of list) {
    await db.insert(lotEvents).values({ lotId: l.id, type: "quarantined", quantity: 0, note: "Date de péremption atteinte — retiré de la vente automatiquement" });
  }
  return { lots: list.length, units: list.reduce((a, l) => a + l.quantity, 0) };
}

/** Everything worth waking the office up for, across the whole shop. */
export async function expiryAlerts(now: Date = new Date()): Promise<{
  expired: number;
  critical: number;
  watch: number;
  undated: number;
  lots: Array<LotRow & { days: number | null; productName: string }>;
}> {
  const rows = await db
    .select({ ...lotSelect, productName: products.name })
    .from(productLots)
    .innerJoin(products, eq(products.id, productLots.productId))
    .leftJoin(stores, eq(stores.id, productLots.storeId))
    .where(and(eq(productLots.status, "sale"), gt(productLots.quantity, 0), sql`${productLots.expiresAt} IS NOT NULL AND ${productLots.expiresAt} < now() + interval '90 days'`))
    .orderBy(asc(productLots.expiresAt));
  const withDays = rows.map((r) => ({ ...r, days: daysUntil(r.expiresAt, now) }));
  const undatedRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(productLots)
    .where(and(eq(productLots.status, "sale"), gt(productLots.quantity, 0), sql`${productLots.expiresAt} IS NULL`));
  return {
    expired: withDays.filter((l) => (l.days ?? 0) < 0).length,
    critical: withDays.filter((l) => (l.days ?? 0) >= 0 && (l.days ?? 0) <= 30).length,
    watch: withDays.filter((l) => (l.days ?? 0) > 30).length,
    undated: Number(undatedRows[0]?.n ?? 0),
    lots: withDays,
  };
}

/**
 * Stock that no lot explains. It is not an error to be hidden: a pharmacy has
 * boxes on a shelf, and a shelf is not a spreadsheet. But the gap has a number,
 * and the office can see it.
 */
export async function stockDrift(limit = 40): Promise<Array<{ productId: number; name: string; stock: number; inLots: number; drift: number }>> {
  const rows = await db.execute(sql`
    SELECT p.id, p.name, p.stock,
           COALESCE((SELECT SUM(l.quantity) FROM product_lots l
                      WHERE l.product_id = p.id AND l.status = 'sale'
                        AND l.expires_at IS NOT NULL AND l.expires_at >= now()), 0)::int AS in_lots
      FROM products p
     WHERE p.status = 'active'
     ORDER BY abs(p.stock - COALESCE((SELECT SUM(l.quantity) FROM product_lots l
                      WHERE l.product_id = p.id AND l.status = 'sale'
                        AND l.expires_at IS NOT NULL AND l.expires_at >= now()), 0)) DESC, p.name ASC
     LIMIT ${limit}`);
  return (rows.rows as Array<{ id: number; name: string; stock: number; in_lots: number }>)
    .map((r) => ({ productId: r.id, name: r.name, stock: r.stock, inLots: r.in_lots, drift: r.stock - r.in_lots }))
    .filter((r) => r.drift !== 0);
}

/** The lots a given customer's order actually received — invoice and account. */
export async function orderLotLines(orderId: number): Promise<Array<{ name: string; lotNumber: string | null; expiresAt: Date | null; quantity: number }>> {
  const rows = await db.execute(sql`
    SELECT name, lot_number, lot_expires_at, quantity FROM order_items WHERE order_id = ${orderId} ORDER BY id ASC`);
  return (rows.rows as Array<{ name: string; lot_number: string | null; lot_expires_at: string | Date | null; quantity: number }>).map((r) => ({
    name: r.name,
    lotNumber: r.lot_number,
    expiresAt: r.lot_expires_at ? (r.lot_expires_at instanceof Date ? r.lot_expires_at : new Date(r.lot_expires_at)) : null,
    quantity: r.quantity,
  }));
}
