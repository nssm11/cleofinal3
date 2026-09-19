"use server";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lotEvents, productLots } from "@/db/schema";
import { fail, MESSAGES, ok, type ActionResult } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { recordMovement, audit } from "@/lib/orders";
import { dateLot, receiveLot, setLotStatus } from "@/lib/lot-stock";
import { quarantineOverdue } from "@/lib/lot-stock";

/**
 * Les actions du comptoir sur les lots.
 *
 * Receiving a box is the moment the date enters the shop, and the moment the
 * stock figure must move with it — the two happen in one transaction, or the
 * shelf and the number start lying to each other.
 *
 * A box that arrives without a date is accepted on purpose: pretending it has
 * one would be worse. It simply is not sellable until somebody types the date.
 */

const num = (v: FormDataEntryValue | null) => (v == null || v === "" ? null : Number(v));
const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function receiveLotAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  let me;
  try {
    me = await requireStaff();
  } catch {
    return fail(MESSAGES.forbidden);
  }
  const productId = num(form.get("productId"));
  const storeId = num(form.get("storeId"));
  const quantity = num(form.get("quantity"));
  if (!productId || !storeId || !quantity || quantity <= 0) return fail("Produit, comptoir et quantité sont obligatoires.");
  const lotNumber = str(form.get("lot"));
  if (!lotNumber) return fail("Le numéro de lot est obligatoire : sans lui, la boîte est intraçable.");
  const rawDate = str(form.get("expiresAt"));
  const expiresAt = rawDate ? new Date(`${rawDate}T12:00:00.000Z`) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return fail("Date de péremption illisible.");
  // A past date is accepted — but it is quarantined on arrival, never shelved.
  const expired = !!expiresAt && expiresAt.getTime() < Date.now();

  try {
    await db.transaction(async (tx) => {
      const res = await receiveLot(tx, {
        productId,
        storeId,
        lot: lotNumber,
        expiresAt,
        quantity,
        placed: (str(form.get("placed")) as "shelf" | "back") ?? "shelf",
        supplier: str(form.get("supplier")),
        note: str(form.get("note")) ?? (expired ? "Reçu déjà périmé — quarantaine immédiate" : null),
        userId: me.id,
      });
      if (expired) await setLotStatus(tx, { lotId: res.id, status: "quarantine", note: "Reçu déjà périmé — jamais mis en rayon", userId: me.id });
      // The aggregate stock only counts what can be sold: an expired receipt
      // adds a lot to the shelf, not units to the shop.
      if (!expired && expiresAt) {
        await recordMovement(tx, { productId, type: "in", quantity, reason: `Réception lot ${lotNumber}`, userId: me.id });
      }
    });
    await audit(me.id, "lot.receive", "product", productId, { lotNumber, quantity, expiresAt: rawDate });
    revalidatePath("/admin/lots");
    revalidatePath("/admin/stock");
    return ok(undefined, expired ? "Lot reçu et mis en quarantaine : il était déjà périmé." : `Lot ${lotNumber} réceptionné — ${quantity} unité(s).`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/** Type the date a lot arrived without. This is what makes it sellable. */
export async function dateLotAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  let me;
  try {
    me = await requireStaff();
  } catch {
    return fail(MESSAGES.forbidden);
  }
  const lotId = num(form.get("lotId"));
  const rawDate = str(form.get("expiresAt"));
  if (!lotId || !rawDate) return fail("Lot et date sont obligatoires.");
  const expiresAt = new Date(`${rawDate}T12:00:00.000Z`);
  if (Number.isNaN(expiresAt.getTime())) return fail("Date illisible.");
  try {
    await db.transaction(async (tx) => {
      const lot = await tx.execute(sql`SELECT product_id, quantity FROM product_lots WHERE id = ${lotId} FOR UPDATE`);
      const row = (lot.rows as Array<{ product_id: number; quantity: number }>)[0];
      if (!row) throw new Error(MESSAGES.notFound);
      await dateLot(tx, { lotId, expiresAt, userId: me.id });
      if (expiresAt.getTime() > Date.now()) {
        await recordMovement(tx, { productId: row.product_id, type: "in", quantity: row.quantity, reason: "Lot daté — entré en stock vendable", userId: me.id });
      }
    });
    await audit(me.id, "lot.date", "lot", lotId, { expiresAt: rawDate });
    revalidatePath("/admin/lots");
    return ok(undefined, "Date enregistrée.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/** Pull a lot off the shelf: quarantine, or destruction with a reason. */
export async function lotStatusAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  let me;
  try {
    me = await requireStaff();
  } catch {
    return fail(MESSAGES.forbidden);
  }
  const lotId = num(form.get("lotId"));
  const status = str(form.get("status"));
  if (!lotId || !status || !["sale", "quarantine", "destroyed", "returned"].includes(status)) return fail(MESSAGES.invalid);
  const note = str(form.get("note"));
  if ((status === "destroyed" || status === "quarantine") && !note) return fail("Dites pourquoi : un lot ne quitte pas le rayon sans motif écrit.");
  try {
    await db.transaction(async (tx) => {
      const before = await tx.execute(sql`SELECT product_id, quantity, status FROM product_lots WHERE id = ${lotId} FOR UPDATE`);
      const row = (before.rows as Array<{ product_id: number; quantity: number; status: string }>)[0];
      if (!row) throw new Error(MESSAGES.notFound);
      await setLotStatus(tx, { lotId, status: status as "sale" | "quarantine" | "destroyed" | "returned", note, userId: me.id });
      const wasSellable = row.status === "sale";
      if (status !== "sale" && wasSellable) {
        await recordMovement(tx, { productId: row.product_id, type: "adjust", quantity: -row.quantity, reason: `Lot retiré — ${note}`, userId: me.id });
      }
      if (status === "sale" && !wasSellable) {
        await recordMovement(tx, { productId: row.product_id, type: "adjust", quantity: row.quantity, reason: `Lot remis en vente — ${note ?? "vérification faite"}`, userId: me.id });
      }
    });
    await audit(me.id, "lot.status", "lot", lotId, { status, note });
    revalidatePath("/admin/lots");
    revalidatePath("/admin/stock");
    return ok(undefined, status === "sale" ? "Lot remis en vente." : "Lot retiré de la vente.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/** The sweep, on demand: what the nightly job does, a human can do now. */
export async function sweepExpiredAction(_prev: ActionResult | null, _form: FormData): Promise<ActionResult> {
  let me;
  try {
    me = await requireStaff();
  } catch {
    return fail(MESSAGES.forbidden);
  }
  const res = await quarantineOverdue();
  await audit(me.id, "lot.sweep", "lot", undefined, res);
  revalidatePath("/admin/lots");
  return ok(undefined, res.lots === 0 ? "Aucun lot périmé en rayon." : `${res.lots} lot(s) périmé(s) retiré(s) — ${res.units} unité(s).`);
}


/**
 * Déplacer un lot d'un comptoir à l'autre.
 *
 * Un transfert n'est pas une vente et n'est pas une réception : c'est le même
 * lot qui change de place. Le stock total du produit ne bouge donc pas — seule
 * la répartition change, et les deux côtés gardent leur trace.
 */
export async function transferLotAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  let me;
  try {
    me = await requireStaff();
  } catch {
    return fail(MESSAGES.forbidden);
  }
  const lotId = num(form.get("lotId"));
  const toStoreId = num(form.get("toStoreId"));
  const quantity = num(form.get("quantity"));
  if (!lotId || !toStoreId || !quantity || quantity <= 0) return fail("Lot, comptoir de destination et quantité sont obligatoires.");
  try {
    await db.transaction(async (tx) => {
      const src = await tx.execute(sql`SELECT product_id, store_id, lot, expires_at, quantity, placed, supplier, status FROM product_lots WHERE id = ${lotId} FOR UPDATE`);
      const row = (src.rows as Array<{ product_id: number; store_id: number; lot: string; expires_at: string | null; quantity: number; placed: "shelf" | "back"; supplier: string | null; status: string }>)[0];
      if (!row) throw new Error(MESSAGES.notFound);
      if (row.store_id === toStoreId) throw new Error("Le lot est déjà dans ce comptoir.");
      if (row.quantity < quantity) throw new Error(`Ce lot n'en contient que ${row.quantity}.`);
      await tx.execute(sql`UPDATE product_lots SET quantity = quantity - ${quantity}, updated_at = now() WHERE id = ${lotId}`);
      await tx.insert(lotEvents).values({ lotId, type: "moved", quantity: -quantity, userId: me.id, note: "Transfert vers un autre comptoir" });
      const dest = await receiveLot(tx, {
        productId: row.product_id,
        storeId: toStoreId,
        lot: row.lot,
        expiresAt: row.expires_at ? new Date(row.expires_at) : null,
        quantity,
        placed: "back",
        supplier: row.supplier,
        note: "Reçu par transfert interne",
        userId: me.id,
      });
      await tx.insert(lotEvents).values({ lotId: dest.id, type: "moved", quantity, userId: me.id, note: "Transfert depuis un autre comptoir" });
    });
    await audit(me.id, "lot.transfer", "lot", lotId, { toStoreId, quantity });
    revalidatePath("/admin/lots");
    return ok(undefined, "Lot transféré. Le stock total ne change pas — seule la répartition bouge.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/**
 * La remise courte date.
 *
 * Elle appartient au lot, pas à la référence : la boîte qui expire en novembre
 * se vend moins cher, celle de 2028 garde son prix. Un prix barré qui
 * s'appliquerait à tout le stock serait un faux prix barré.
 */
export async function lotClearanceAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  let me;
  try {
    me = await requireStaff();
  } catch {
    return fail(MESSAGES.forbidden);
  }
  const lotId = num(form.get("lotId"));
  const percent = num(form.get("percent"));
  if (!lotId || percent === null || percent < 0 || percent > 70) return fail("Remise invalide (0 à 70 %).");
  try {
    const [row] = await db.update(productLots).set({ clearancePercent: Math.round(percent), updatedAt: new Date() }).where(eq(productLots.id, lotId)).returning({ id: productLots.id, lot: productLots.lot, expiresAt: productLots.expiresAt });
    if (!row) throw new Error(MESSAGES.notFound);
    await db.insert(lotEvents).values({ lotId: row.id, type: "adjusted", quantity: 0, userId: me.id, note: percent > 0 ? `Remise courte date : −${Math.round(percent)} %` : "Remise courte date retirée" });
    await audit(me.id, "lot.clearance", "lot", lotId, { percent });
    revalidatePath("/admin/lots");
    revalidatePath("/admin/lots/etiquettes");
    return ok(undefined, percent > 0 ? `Lot ${row.lot} remisé de ${Math.round(percent)} % au comptoir.` : "Remise retirée : le lot repart au prix plein.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}
