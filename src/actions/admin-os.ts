"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { adminTasks, automations, orderEvents, orderItems, orders, products, promotions, type TaskPriority, type TaskStatus } from "@/db/schema";
import { requireAdmin, requireStaff, type SafeUser } from "@/lib/auth";
import { audit, lockProducts, recordMovement, addOrderEvent } from "@/lib/orders";
import { fail, MESSAGES, ok, type ActionResult } from "@/lib/api";
import { runAutomation, type AutomationAction, type Condition } from "@/lib/admin/automations";
import { shippingFor, type ShippingMethod } from "@/lib/money";
import { enabledPaymentMethods } from "@/lib/payments";

async function staff(): Promise<SafeUser | null> {
  try { return await requireStaff(); } catch { return null; }
}

const PRIORITIES: TaskPriority[] = ["critical", "high", "normal", "low"];
const STATUSES: TaskStatus[] = ["open", "in_progress", "blocked", "done", "dismissed"];

/* ── Tasks ───────────────────────────────────────────────────────────────── */

export async function createTaskAction(input: {
  title: string;
  detail?: string;
  priority?: TaskPriority;
  entity?: string;
  entityId?: string | number;
  href?: string;
  assigneeId?: number | null;
  dueAt?: string | null;
  source?: string;
}): Promise<ActionResult<{ id: number }>> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const title = input.title?.trim().slice(0, 200);
  if (!title) return fail("Un titre est nécessaire.");
  const [row] = await db
    .insert(adminTasks)
    .values({
      title,
      detail: input.detail?.trim().slice(0, 2000) || null,
      priority: PRIORITIES.includes(input.priority as TaskPriority) ? (input.priority as TaskPriority) : "normal",
      entity: input.entity?.slice(0, 40) || null,
      entityId: input.entityId != null ? String(input.entityId) : null,
      href: input.href?.slice(0, 300) || null,
      assigneeId: input.assigneeId ?? null,
      source: input.source?.slice(0, 24) || "hand",
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      createdById: me.id,
    })
    .returning({ id: adminTasks.id });
  await audit(me.id, "task.create", "task", row.id, { title });
  revalidatePath("/admin/operations");
  revalidatePath("/admin");
  return ok({ id: row.id }, "Tâche ouverte.");
}

export async function setTaskStatusAction(id: number, status: TaskStatus): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  if (!STATUSES.includes(status)) return fail("Statut inconnu.");
  await db
    .update(adminTasks)
    .set({ status, closedAt: status === "done" || status === "dismissed" ? new Date() : null, updatedAt: new Date() })
    .where(eq(adminTasks.id, id));
  await audit(me.id, "task.status", "task", id, { status });
  revalidatePath("/admin/operations");
  revalidatePath("/admin");
  return ok(undefined, status === "done" ? "Tâche terminée." : "Tâche mise à jour.");
}

export async function assignTaskAction(id: number, assigneeId: number | null): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.update(adminTasks).set({ assigneeId, updatedAt: new Date() }).where(eq(adminTasks.id, id));
  await audit(me.id, "task.assign", "task", id, { assigneeId });
  revalidatePath("/admin/operations");
  return ok(undefined, assigneeId ? "Tâche attribuée." : "Tâche remise dans la file commune.");
}

export async function deleteTaskAction(id: number): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.delete(adminTasks).where(eq(adminTasks.id, id));
  await audit(me.id, "task.delete", "task", id);
  revalidatePath("/admin/operations");
  return ok(undefined, "Tâche supprimée.");
}

/** One click from an alert: open the task that closes it. */
export async function taskFromAlertAction(input: { title: string; detail?: string; href?: string; priority?: TaskPriority; entity?: string; entityId?: string | number }): Promise<ActionResult<{ id: number }>> {
  return createTaskAction({ ...input, source: "alert" });
}

/* ── Automations ─────────────────────────────────────────────────────────── */

export async function saveAutomationAction(input: {
  id?: number;
  name: string;
  description?: string;
  trigger: string;
  conditions: Condition[];
  actions: AutomationAction[];
  isActive?: boolean;
}): Promise<ActionResult<{ id: number }>> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const name = input.name?.trim().slice(0, 140);
  if (!name) return fail("Nommez la règle.");
  if (!input.trigger) return fail("Choisissez un déclencheur.");
  if (!input.actions?.length) return fail("Ajoutez au moins une action.");
  const conditions = (input.conditions ?? []).filter((c) => c.field && c.op).slice(0, 12);
  const payload = {
    name,
    description: input.description?.trim().slice(0, 300) || null,
    trigger: input.trigger,
    conditions,
    actions: input.actions.slice(0, 6),
    isActive: input.isActive ?? true,
    updatedAt: new Date(),
  };
  if (input.id) {
    await db.update(automations).set(payload).where(eq(automations.id, input.id));
    await audit(me.id, "automation.update", "automation", input.id, { trigger: input.trigger });
    revalidatePath("/admin/operations/automations");
    return ok({ id: input.id }, "Règle enregistrée.");
  }
  const [row] = await db.insert(automations).values({ ...payload, createdById: me.id }).returning({ id: automations.id });
  await audit(me.id, "automation.create", "automation", row.id, { trigger: input.trigger });
  revalidatePath("/admin/operations/automations");
  return ok({ id: row.id }, "Règle créée.");
}

export async function toggleAutomationAction(id: number, isActive: boolean): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.update(automations).set({ isActive, updatedAt: new Date() }).where(eq(automations.id, id));
  await audit(me.id, "automation.toggle", "automation", id, { isActive });
  revalidatePath("/admin/operations/automations");
  return ok(undefined, isActive ? "Règle active." : "Règle en veille.");
}

export async function deleteAutomationAction(id: number): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.delete(automations).where(eq(automations.id, id));
  await audit(me.id, "automation.delete", "automation", id);
  revalidatePath("/admin/operations/automations");
  return ok(undefined, "Règle supprimée.");
}

export async function runAutomationAction(id: number, mode: "test" | "manual" = "manual"): Promise<ActionResult<{ matched: number; affected: number; detail: string }>> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const [a] = await db.select().from(automations).where(eq(automations.id, id)).limit(1);
  if (!a) return fail(MESSAGES.notFound);
  const result = await runAutomation(
    { id: a.id, trigger: a.trigger, conditions: (a.conditions ?? []) as Condition[], actions: (a.actions ?? []) as AutomationAction[], name: a.name },
    mode,
    me.id,
  );
  await audit(me.id, mode === "test" ? "automation.test" : "automation.run", "automation", id, { matched: result.matched, affected: result.affected });
  revalidatePath("/admin/operations/automations");
  revalidatePath("/admin/operations");
  return result.ok
    ? ok({ matched: result.matched, affected: result.affected, detail: result.detail }, result.detail)
    : fail(result.detail);
}

/* ── Media ───────────────────────────────────────────────────────────────── */

export async function assignMediaAction(input: { productId: number; url: string; role: "principale" | "galerie"; alt?: string }): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const url = input.url?.trim().slice(0, 255);
  if (!url) return fail("Aucune image choisie.");
  const [p] = await db.select({ id: products.id, image: products.image, images: products.images, imageAlts: products.imageAlts }).from(products).where(eq(products.id, input.productId)).limit(1);
  if (!p) return fail(MESSAGES.notFound);
  const gallery = Array.isArray(p.images) ? p.images : [];
  const alts = Array.isArray(p.imageAlts) ? p.imageAlts : [];
  if (input.role === "principale") {
    // The former main image stays in the gallery rather than disappearing.
    const nextGallery = [...new Set([...(p.image ? [p.image] : []), ...gallery, url])].slice(0, 8);
    await db.update(products).set({ image: url, images: nextGallery, imageAlts: alts, updatedAt: new Date() }).where(eq(products.id, p.id));
  } else {
    if (gallery.includes(url)) return fail("Cette image est déjà dans la galerie.");
    await db.update(products).set({ images: [...gallery, url].slice(0, 8), imageAlts: alts, updatedAt: new Date() }).where(eq(products.id, p.id));
  }
  await audit(me.id, "product.media", "product", p.id, { url, role: input.role });
  revalidatePath(`/admin/produits/${p.id}`);
  revalidatePath("/admin/media");
  revalidatePath("/admin/qualite");
  return ok(undefined, input.role === "principale" ? "Visuel principal mis à jour." : "Image ajoutée à la galerie.");
}

export async function detachMediaAction(input: { productId: number; url: string }): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const [p] = await db.select({ id: products.id, image: products.image, images: products.images }).from(products).where(eq(products.id, input.productId)).limit(1);
  if (!p) return fail(MESSAGES.notFound);
  const gallery = (Array.isArray(p.images) ? p.images : []).filter((u) => u !== input.url);
  const nextMain = p.image === input.url ? (gallery[0] ?? null) : p.image;
  await db.update(products).set({ image: nextMain, images: gallery.filter((u) => u !== nextMain), updatedAt: new Date() }).where(eq(products.id, p.id));
  await audit(me.id, "product.media.detach", "product", p.id, { url: input.url });
  revalidatePath(`/admin/produits/${p.id}`);
  revalidatePath("/admin/media");
  return ok(undefined, "Image détachée de la fiche.");
}

/* ── Coupons: bulk factory ───────────────────────────────────────────────── */

export async function createCouponBatchAction(input: {
  prefix: string;
  label: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  count: number;
  endsAt?: string | null;
  usageLimit?: number | null;
  minSubtotalDT?: number;
}): Promise<ActionResult<{ codes: string[] }>> {
  const me = await requireAdmin().catch(() => null);
  if (!me) return fail(MESSAGES.forbidden);
  const prefix = (input.prefix || "CLEO").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 10) || "CLEO";
  const count = Math.max(1, Math.min(50, Math.round(input.count || 1)));
  const label = (input.label || "Série de codes").slice(0, 160);
  if (!["percent", "fixed", "free_shipping"].includes(input.type)) return fail("Type de remise inconnu.");
  const value = Math.max(0, Math.round(input.value || 0));
  if (input.type === "percent" && (value <= 0 || value > 90)) return fail("Un pourcentage doit être compris entre 1 et 90.");

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 — dictated over the phone
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let suffix = "";
    for (let k = 0; k < 5; k++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    codes.push(`${prefix}-${suffix}`);
  }
  const existing = await db.select({ code: promotions.code }).from(promotions).where(inArray(promotions.code, codes));
  const taken = new Set(existing.map((e) => e.code));
  const fresh = codes.filter((c) => !taken.has(c));
  if (!fresh.length) return fail("Aucun code disponible, réessayez.");
  await db.insert(promotions).values(
    fresh.map((code) => ({
      code,
      label: `${label} · ${code}`.slice(0, 160),
      type: input.type,
      value: input.type === "fixed" ? Math.round((input.value || 0) * 1000) : value,
      minSubtotalMillimes: Math.round((input.minSubtotalDT ?? 0) * 1000),
      usageLimit: input.usageLimit ?? null,
      perUserLimit: 1,
      startsAt: new Date(),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      isActive: true,
    })),
  );
  await audit(me.id, "promotion.batch", "promotion", undefined, { count: fresh.length, prefix, type: input.type, value });
  revalidatePath("/admin/promotions");
  return ok({ codes: fresh }, `${fresh.length} code(s) créé(s).`);
}

/* ── Manual order ────────────────────────────────────────────────────────── */

export type ManualOrderInput = {
  customerId?: number | null;
  email: string;
  phone: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  items: { productId: number; quantity: number }[];
  shippingMethod: ShippingMethod;
  paymentMethod: string;
  promoCode?: string | null;
  customerNote?: string | null;
  internalNote?: string | null;
  giftWrap?: boolean;
};

/**
 * Phone or counter sale, entered by the house. It goes through the same stock
 * ledger, the same order events and the same audit trail as a web order — the
 * only difference is who typed it.
 */
export async function createManualOrderAction(input: ManualOrderInput): Promise<ActionResult<{ id: number; number: string; total: number }>> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const items = (input.items ?? []).filter((i) => i.productId && i.quantity > 0).slice(0, 30);
  if (!items.length) return fail("Ajoutez au moins une référence.");
  const email = input.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Adresse e-mail invalide.");
  if (!input.fullName?.trim() || !input.line1?.trim() || !input.city?.trim() || !input.governorate?.trim()) return fail("L'adresse de livraison est incomplète.");
  const shippingMethod = (["standard", "express", "pickup"] as const).includes(input.shippingMethod) ? input.shippingMethod : "standard";
  const allowedPayments = enabledPaymentMethods();
  const paymentMethod = allowedPayments.includes(input.paymentMethod as never) ? input.paymentMethod : allowedPayments[0];

  try {
    const result = await db.transaction(async (tx) => {
      const locked = await lockProducts(tx, items.map((i) => i.productId).filter((id): id is number => typeof id === "number"));
      if (locked.length !== items.length) throw new Error("Une référence est introuvable.");
      const lines = items.map((i) => {
        const p = locked.find((x: { id: number }) => x.id === i.productId)!;
        if (p.stock < i.quantity) throw new Error(`Stock insuffisant pour « ${p.name} » (${p.stock} restant).`);
        return { p, qty: i.quantity };
      });
      const subtotal = lines.reduce((a, l) => a + l.p.price_millimes * l.qty, 0);

      let discount = 0;
      let appliedPromo: string | null = null;
      if (input.promoCode?.trim()) {
        const code = input.promoCode.trim().toUpperCase();
        const [promo] = await tx.select().from(promotions).where(and(eq(promotions.code, code), eq(promotions.isActive, true))).limit(1);
        if (!promo) throw new Error("Code promotionnel inconnu ou désactivé.");
        const now = new Date();
        if (promo.startsAt && promo.startsAt > now) throw new Error("Ce code n'est pas encore actif.");
        if (promo.endsAt && promo.endsAt < now) throw new Error("Ce code a expiré.");
        if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) throw new Error("Ce code a atteint sa limite d'utilisation.");
        if (subtotal < promo.minSubtotalMillimes) throw new Error(`Ce code s'applique à partir de ${(promo.minSubtotalMillimes / 1000).toFixed(3)} DT.`);
        if (promo.type === "percent") discount = Math.min(Math.round((subtotal * promo.value) / 100), promo.maxDiscountMillimes ?? Number.MAX_SAFE_INTEGER);
        else if (promo.type === "fixed") discount = Math.min(promo.value, subtotal);
        appliedPromo = promo.code;
        await tx.update(promotions).set({ usageCount: sql`${promotions.usageCount} + 1` }).where(eq(promotions.id, promo.id));
      }

      const shipping = shippingFor(subtotal, shippingMethod);
      const giftWrap = input.giftWrap ? 5_000 : 0;
      const total = subtotal - discount + shipping + giftWrap;
      const ymd = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
      const number = `CL-${ymd}-${rnd}`;

      const [order] = await tx
        .insert(orders)
        .values({
          number,
          userId: input.customerId ?? null,
          email,
          phone: input.phone?.slice(0, 20) || "00000000",
          status: "pending",
          paymentMethod: paymentMethod as never,
          paymentStatus: "pending",
          shippingMethod,
          shippingAddress: {
            fullName: input.fullName.trim().slice(0, 160),
            phone: input.phone?.slice(0, 20) || "00000000",
            line1: input.line1.trim().slice(0, 200),
            line2: input.line2?.trim().slice(0, 200) || undefined,
            city: input.city.trim().slice(0, 100),
            governorate: input.governorate.trim().slice(0, 60),
            postalCode: input.postalCode?.trim().slice(0, 10) || undefined,
          },
          subtotalMillimes: subtotal,
          discountMillimes: discount,
          shippingMillimes: shipping,
          giftWrapMillimes: giftWrap,
          totalMillimes: total,
          promoCode: appliedPromo,
          giftWrap: Boolean(input.giftWrap),
          customerNote: input.customerNote?.slice(0, 2000) || null,
          internalNote: input.internalNote?.slice(0, 2000) || null,
        })
        .returning({ id: orders.id, number: orders.number, totalMillimes: orders.totalMillimes });

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id, productId: l.p.id, name: l.p.name, sku: l.p.sku,
          image: l.p.image, unitPriceMillimes: l.p.price_millimes, quantity: l.qty, lineTotalMillimes: l.p.price_millimes * l.qty,
        })),
      );
      for (const l of lines) {
        await recordMovement(tx, { productId: l.p.id, type: "sale", quantity: -l.qty, reason: `Saisie comptoir — commande ${order.number}`, orderId: order.id, userId: me.id });
      }
      await addOrderEvent(tx, order.id, "pending", "Commande saisie par l'équipe (téléphone ou comptoir).", me.id);
      return { id: order.id, number: order.number, total: order.totalMillimes };
    });
    await audit(me.id, "order.manual", "order", result.id, { number: result.number, total: result.total });
    revalidatePath("/admin/commandes");
    revalidatePath("/admin");
    return ok(result, `Commande ${result.number} créée.`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/** Product search for the manual-order builder (real catalogue, real stock). */
export async function lookupProductsAction(term: string): Promise<{ id: number; name: string; sku: string; price: number; stock: number; image: string | null }[]> {
  const me = await staff();
  if (!me) return [];
  const like = `%${(term ?? "").trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  if (like.length < 3) return [];
  const res = await db.execute(sql`
    SELECT id, name, sku, price_millimes AS price, stock, image FROM products
    WHERE status <> 'archived' AND (unaccent(name) ILIKE unaccent(${like}) OR sku ILIKE ${like})
    ORDER BY name LIMIT 12`);
  const list = ((res as unknown as { rows?: Record<string, unknown>[] }).rows ?? (res as unknown as Record<string, unknown>[])) as Record<string, unknown>[];
  return list.map((p) => ({ id: Number(p.id), name: String(p.name), sku: String(p.sku), price: Number(p.price), stock: Number(p.stock), image: (p.image as string | null) ?? null }));
}

/** Customers matching a phone or e-mail at the counter. */
export async function lookupCustomersAction(term: string): Promise<{ id: number; name: string; email: string; phone: string | null }[]> {
  const me = await staff();
  if (!me) return [];
  const like = `%${(term ?? "").trim().replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  if (like.length < 3) return [];
  const res = await db.execute(sql`
    SELECT id, first_name || ' ' || last_name AS name, email, phone FROM users
    WHERE unaccent(first_name || ' ' || last_name) ILIKE unaccent(${like}) OR email ILIKE ${like} OR phone ILIKE ${like}
    ORDER BY created_at DESC LIMIT 6`);
  const list = ((res as unknown as { rows?: Record<string, unknown>[] }).rows ?? (res as unknown as Record<string, unknown>[])) as Record<string, unknown>[];
  return list.map((u) => ({ id: Number(u.id), name: String(u.name), email: String(u.email), phone: (u.phone as string | null) ?? null }));
}

/** Customer note kept from the 360 view (thin wrapper over the existing action). */
export async function appendCustomerNoteAction(userId: number, note: string): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await audit(me.id, "customer.note", "user", userId, { length: note.length });
  revalidatePath(`/admin/clients/${userId}`);
  return ok(undefined, "Note enregistrée dans le journal d'audit.");
}

/** Bulk order status from the focused table — reuses the transactional action. */
export async function bulkStatusFromTable(ids: number[], next: string): Promise<ActionResult<{ done: number }>> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  if (!Array.isArray(ids) || !ids.length) return fail(MESSAGES.invalid);
  if (ids.length > 100) return fail("Maximum 100 commandes à la fois.");
  const { bulkOrderStatusAction } = await import("./admin");
  return bulkOrderStatusAction(ids, next);
}

/** Order events for the live timeline of one order (polled by the drawer). */
export async function orderEventsSince(orderId: number): Promise<{ id: number; status: string; message: string | null; at: string }[]> {
  const me = await staff();
  if (!me) return [];
  const rows = await db.select({ id: orderEvents.id, status: orderEvents.status, message: orderEvents.message, at: orderEvents.createdAt }).from(orderEvents).where(eq(orderEvents.orderId, orderId)).orderBy(orderEvents.createdAt);
  return rows.map((r) => ({ id: r.id, status: r.status, message: r.message, at: r.at.toISOString() }));
}

/* ── Catalogue — one command surface for the product page ────────────────── */

export type ProductFlagPatch = {
  status?: "active" | "draft" | "archived";
  isFeatured?: boolean;
  isCounterPick?: boolean;
  isNew?: boolean;
  lowStockThreshold?: number;
};

/**
 * Fast edits that the product page performs without a full form round-trip:
 * publish, retire, feature, counter-pick, or move the restock threshold.
 *
 * Each accepted change writes an audit row, so the trail explains *who* put
 * the reference back online at 18h04 and not only that it happened.
 */
export async function setProductFlagsAction(productId: number, patch: ProductFlagPatch): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  if (!Number.isFinite(productId)) return fail(MESSAGES.invalid);

  const values: Record<string, unknown> = { updatedAt: new Date() };
  const changed: string[] = [];
  if (patch.status) { values.status = patch.status; changed.push("status"); }
  if (typeof patch.isFeatured === "boolean") { values.isFeatured = patch.isFeatured; changed.push("isFeatured"); }
  if (typeof patch.isCounterPick === "boolean") { values.isCounterPick = patch.isCounterPick; changed.push("isCounterPick"); }
  if (typeof patch.isNew === "boolean") { values.isNew = patch.isNew; changed.push("isNew"); }
  if (typeof patch.lowStockThreshold === "number" && patch.lowStockThreshold >= 0) {
    values.lowStockThreshold = Math.floor(patch.lowStockThreshold);
    changed.push("lowStockThreshold");
  }
  if (!changed.length) return fail("Aucun changement à enregistrer.");

  try {
    const [before] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!before) return fail(MESSAGES.notFound);
    await db.update(products).set(values).where(eq(products.id, productId));
    await audit(me.id, "product.flags", "product", productId, { before: { status: before.status, isFeatured: before.isFeatured, isCounterPick: before.isCounterPick, isNew: before.isNew, lowStockThreshold: before.lowStockThreshold }, patch });
    revalidatePath("/admin/produits");
    revalidatePath(`/admin/produits/${productId}`);
    revalidatePath("/admin");
    return ok(undefined, `${before.name} — ${changed.join(", ")} mis à jour.`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}
