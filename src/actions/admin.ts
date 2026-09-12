"use server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { articles, brands, concerns, duos, orders, productConcerns, productPairs, products, productSubstitutes, promotions, returnRequests, reviews, routineSteps, shelves, stores, supportTickets, ticketMessages, users, type LText, type OrderStatus, type ReturnStatus } from "@/db/schema";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { fail, MESSAGES, ok, zodFieldErrors, type ActionResult } from "@/lib/api";
import { ALLOWED_TRANSITIONS, addOrderEvent, audit, awardLoyaltyForOrder, lockOrder, lockProducts, recordMovement, restockOrder, restoreSpentLoyalty, reverseLoyaltyForOrder } from "@/lib/orders";
import { sendOrQueueEmail } from "@/lib/email/send";

/** « En cours de livraison » — the 7th letter: the parcel is on the last leg. */
export async function markOutForDeliveryAction(orderId: number): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!o) return fail(MESSAGES.notFound);
  if (o.status !== "shipped") return fail("La commande doit être expédiée avant d'être annoncée en tournée.");
  await addOrderEvent(db, o.id, "shipped", "En cours de livraison — le livreur est en tournée dans votre secteur.", me.id);
  const { sendOrderStatusEmail } = await import("@/lib/email/triggers");
  void sendOrderStatusEmail(o, "order_out_for_delivery");
  await audit(me.id, "order.out-for-delivery", "order", orderId);
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/compte/commandes");
  return ok(undefined, "Le client a été prévenu de la livraison du jour.");
}
import { httpsUrlSchema, isSafeImageUrl, orderStatusSchema, productSchema, promotionSchema, returnStatusSchema, stockAdjustSchema, userRoleSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

async function staff() {
  try { return await requireStaff(); } catch { return null; }
}
async function adminOnly() {
  try { return await requireAdmin(); } catch { return null; }
}

export async function updateOrderStatusAction(orderId: number, next: string, message?: string): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const parsed = orderStatusSchema.safeParse(next);
  if (!parsed.success) return fail("Statut invalide.");
  try {
    await db.transaction(async (tx) => {
      const o = await lockOrder(tx, orderId);
      if (!o) throw new Error(MESSAGES.notFound);
      if (!ALLOWED_TRANSITIONS[o.status].includes(parsed.data)) throw new Error(`Transition ${o.status} → ${parsed.data} non autorisée.`);
      const patch: Partial<typeof orders.$inferInsert> = { status: parsed.data, updatedAt: new Date() };
      if (parsed.data === "delivered" && o.paymentMethod === "cod") patch.paymentStatus = "paid";
      if (parsed.data === "cancelled" || parsed.data === "returned") {
        await restockOrder(tx, o.id, me.id);
        // Claw back any points already granted for this order, and give back
        // any points the customer spent on it.
        await reverseLoyaltyForOrder(tx, o, `${parsed.data === "returned" ? "Retour" : "Annulation"} commande ${o.number}`);
        await restoreSpentLoyalty(tx, o);
        if (o.paymentStatus === "paid") patch.paymentStatus = "refunded";
      }
      // Conditional on the status we actually read: if another actor moved the
      // order first, this updates 0 rows and we bail instead of double-applying.
      const updated = await tx.update(orders).set(patch).where(and(eq(orders.id, o.id), eq(orders.status, o.status))).returning({ id: orders.id });
      if (!updated.length) throw new Error("Cette commande vient d'être modifiée. Merci de recharger la page.");
      if (parsed.data === "delivered") {
        // Settlement point: COD is marked paid above, and this is where loyalty
        // is actually earned. Idempotent — one award per order, enforced by a
        // partial unique index.
        await awardLoyaltyForOrder(tx, { ...o, status: parsed.data, paymentStatus: patch.paymentStatus ?? o.paymentStatus });
      }
      await addOrderEvent(tx, o.id, parsed.data as OrderStatus, message || undefined, me.id);
    });
    await audit(me.id, "order.status", "order", orderId, { next: parsed.data });
    // Letters go out after the transaction commits — never inside it.
    const { sendOrderStatusEmail, queueCareSequence, STATUS_TO_EMAIL } = await import("@/lib/email/triggers");
    const fresh = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (fresh) {
      const kind = STATUS_TO_EMAIL[fresh.status];
      if (kind) void sendOrderStatusEmail(fresh, kind);
      if (fresh.status === "delivered") void queueCareSequence(fresh);
      if ((fresh.status === "cancelled" || fresh.status === "returned") && fresh.paymentStatus === "refunded") {
        void sendOrderStatusEmail(fresh, "order_refunded");
      }
    }
    revalidatePath("/admin/commandes");
    revalidatePath(`/admin/commandes/${orderId}`);
    return ok(undefined, "Statut mis à jour.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

const BULK_LIMIT = 100;

export async function bulkOrderStatusAction(ids: number[], next: string): Promise<ActionResult<{ done: number }>> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  if (!Array.isArray(ids)) return fail(MESSAGES.invalid);
  // Each id costs a locked transaction; an unbounded array is a cheap DoS.
  if (ids.length > BULK_LIMIT) return fail(`Maximum ${BULK_LIMIT} commandes à la fois.`);
  let done = 0;
  for (const id of ids) {
    const r = await updateOrderStatusAction(id, next);
    if (r.ok) done++;
  }
  return ok({ done }, `${done}/${ids.length} commande(s) mise(s) à jour.`);
}

export async function saveOrderNotesAction(orderId: number, internalNote: string, trackingCode: string): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.update(orders).set({ internalNote: internalNote.slice(0, 2000) || null, trackingCode: trackingCode.slice(0, 80) || null, updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath(`/admin/commandes/${orderId}`);
  return ok(undefined, "Notes enregistrées.");
}

function parseProductForm(form: FormData) {
  const num = (k: string) => { const v = String(form.get(k) ?? "").trim(); return v === "" ? null : Number(v); };
  const dt = (k: string) => Math.round(Number(String(form.get(k) ?? "0").replace(",", ".")) * 1000);
  return productSchema.safeParse({
    name: form.get("name"), slug: String(form.get("slug") || slugify(String(form.get("name") || ""))), sku: form.get("sku"),
    shortDescription: form.get("shortDescription"), description: form.get("description"), ingredients: form.get("ingredients"), howToUse: form.get("howToUse"),
    brandId: num("brandId"), categoryId: num("categoryId"), universeId: num("universeId"),
    priceMillimes: dt("priceDT"), compareAtMillimes: String(form.get("compareAtDT") || "").trim() ? dt("compareAtDT") : null,
    stock: Number(form.get("stock") || 0), lowStockThreshold: Number(form.get("lowStockThreshold") || 5),
    volume: form.get("volume"), image: form.get("image"), status: form.get("status"), isFeatured: form.get("isFeatured") === "on", isNew: form.get("isNew") === "on",
    isCounterPick: form.get("isCounterPick") === "on",
    texture: form.get("texture"), forWhom: form.get("forWhom"),
    audience: form.get("audience"), precautions: form.get("precautions"),
    useWhen: form.get("useWhen"), useAmount: form.get("useAmount"), useOrder: form.get("useOrder"),
    // One active per line, like the concern list: order is the display order.
    keyActives: form.getAll("keyActives").flatMap((x) => String(x).split("\n")).map((x) => x.trim()).filter(Boolean).slice(0, 8),
    // Tri-state selects: only explicit “oui”/“non” are recorded; “—” leaves the
    // key absent, which the storefront treats as unknown — never filterable.
    tolerances: Object.fromEntries(
      (["sansParfum", "grossesse", "peauAtopique", "yeuxSensibles"] as const)
        .map((k) => [k, form.get(`tol-${k}`)] as const)
        .filter(([, v]) => v === "1" || v === "0")
        .map(([k, v]) => [k, v === "1"]),
    ),
    launchedAt: (() => {
      const raw = String(form.get("launchedAt") ?? "").trim();
      const d = raw ? new Date(`${raw}T09:00:00`) : null;
      return d && !Number.isNaN(d.getTime()) ? d : null;
    })(),
    images: form.getAll("images").map((x) => String(x).trim()).filter(Boolean),
    imageAlts: form.getAll("imageAlts").map((x) => String(x)),
    concernIds: form.getAll("concernIds").map(Number).filter(Boolean),
  });
}

export async function saveProductAction(_prev: ActionResult<{ id: number }> | null, form: FormData): Promise<ActionResult<{ id: number }>> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  const parsed = parseProductForm(form);
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const id = Number(form.get("id") || 0);
  const { concernIds, ...d } = parsed.data;
  /*
   * The gallery is first-class: saving a product must never collapse
   * images[] into [singleImage]. The ordered list submitted by the form is
   * kept as-is (unsafe entries dropped), and the primary image is simply the
   * first plate of the gallery.
   */
  const gallery = d.images.filter(isSafeImageUrl).slice(0, 8);
  const primary = gallery[0] ?? (d.image && isSafeImageUrl(d.image) ? d.image : null);
  const images = primary ? (gallery.length ? gallery : [primary]) : [];
  const imageAlts = d.imageAlts.map((a) => a.trim()).slice(0, images.length);
  const values = {
    ...d,
    shortDescription: d.shortDescription || null, description: d.description || null, ingredients: d.ingredients || null, howToUse: d.howToUse || null, volume: d.volume || null,
    texture: d.texture || null, forWhom: d.forWhom || null,
    audience: d.audience || null, precautions: d.precautions || null,
    useWhen: d.useWhen || null, useAmount: d.useAmount || null, useOrder: d.useOrder || null,
    tolerances: d.tolerances && Object.keys(d.tolerances).length ? d.tolerances : null,
    launchedAt: d.launchedAt ?? null,
    image: primary, images, imageAlts,
  };
  try {
    const pid = await db.transaction(async (tx) => {
      let productId = id;
      if (id) {
        const before = await tx.query.products.findFirst({ where: eq(products.id, id) });
        if (!before) throw new Error(MESSAGES.notFound);
        const { stock, ...rest } = values;
        await tx.update(products).set({ ...rest, updatedAt: new Date() }).where(eq(products.id, id));
        if (stock !== before.stock) await recordMovement(tx, { productId: id, type: "adjust", quantity: stock - before.stock, reason: "Modification fiche produit", userId: me.id });
        await tx.delete(productConcerns).where(eq(productConcerns.productId, id));
      } else {
        const [p] = await tx.insert(products).values({ ...values, stock: 0 }).returning({ id: products.id });
        productId = p.id;
        if (values.stock > 0) await recordMovement(tx, { productId, type: "in", quantity: values.stock, reason: "Stock initial", userId: me.id });
      }
      if (concernIds.length) await tx.insert(productConcerns).values(concernIds.map((c) => ({ productId, concernId: c })));
      return productId;
    });
    await audit(me.id, id ? "product.update" : "product.create", "product", pid);
    revalidatePath("/admin/produits");
    revalidatePath("/boutique");
    return ok({ id: pid }, "Produit enregistré.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : MESSAGES.generic;
    return fail(msg.includes("unique") ? "Slug ou SKU déjà utilisé." : msg);
  }
}

export async function adjustStockAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const parsed = stockAdjustSchema.safeParse({ productId: Number(form.get("productId")), delta: Number(form.get("delta")), reason: form.get("reason") });
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  let prevStock = -1;
  try {
    await db.transaction(async (tx) => {
      // Lock the product row: an admin adjustment racing a concurrent checkout
      // must not read a stale stock value.
      const [p] = await lockProducts(tx, [parsed.data.productId]);
      if (!p) throw new Error(MESSAGES.notFound);
      prevStock = p.stock;
      if (p.stock + parsed.data.delta < 0) throw new Error("Le stock ne peut pas devenir négatif.");
      await recordMovement(tx, { productId: p.id, type: parsed.data.delta > 0 ? "restock" : "adjust", quantity: parsed.data.delta, reason: parsed.data.reason, userId: me.id });
    });
    await audit(me.id, "stock.adjust", "product", parsed.data.productId, parsed.data);
    // The reference is back: every watcher gets the letter, members first.
    if (parsed.data.delta > 0 && prevStock === 0) {
      const { enqueueRestockAlerts } = await import("@/lib/email/triggers");
      void enqueueRestockAlerts(parsed.data.productId);
    }
    revalidatePath("/admin/stock");
    return ok(undefined, "Stock ajusté.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

export async function savePromotionAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  const type = String(form.get("type"));
  const parsed = promotionSchema.safeParse({
    code: form.get("code"), label: form.get("label"), type,
    value: type === "fixed" ? Math.round(Number(form.get("value") || 0) * 1000) : Number(form.get("value") || 0),
    minSubtotalMillimes: Math.round(Number(form.get("minDT") || 0) * 1000),
    maxDiscountMillimes: String(form.get("maxDT") || "").trim() ? Math.round(Number(form.get("maxDT")) * 1000) : null,
    usageLimit: String(form.get("usageLimit") || "").trim() ? Number(form.get("usageLimit")) : null,
    perUserLimit: Number(form.get("perUserLimit") || 1), isActive: form.get("isActive") === "on", endsAt: form.get("endsAt"),
  });
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const id = Number(form.get("id") || 0);
  const universeId = Number(form.get("universeId") || 0) || null;
  const values = { ...parsed.data, universeId, endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null };
  try {
    if (id) await db.update(promotions).set({ ...values, updatedAt: new Date() }).where(eq(promotions.id, id));
    else await db.insert(promotions).values(values);
    await audit(me.id, id ? "promo.update" : "promo.create", "promotion", id || values.code);
    revalidatePath("/admin/promotions");
    return ok(undefined, "Promotion enregistrée.");
  } catch {
    return fail("Ce code existe déjà.");
  }
}
export async function deletePromotionAction(id: number): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  await db.delete(promotions).where(eq(promotions.id, id));
  await audit(me.id, "promo.delete", "promotion", id);
  revalidatePath("/admin/promotions");
  return ok(undefined, "Promotion supprimée.");
}

export async function moderateReviewAction(id: number, status: "approved" | "rejected", reply?: string): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  // Status change and rating re-aggregation must commit together, otherwise a
  // failure in between leaves products.rating_avg out of sync with the reviews.
  await db.transaction(async (tx) => {
    const [r] = await tx.update(reviews).set({ status, reply: reply?.trim() || null, updatedAt: new Date() }).where(eq(reviews.id, id)).returning();
    if (!r) return;
    // The score counts what the visitor sees: approved AND verified (P02).
    const agg = await tx.select({ avg: sql<number>`coalesce(round(avg(rating)*100),0)::int`, n: sql<number>`count(*)::int` }).from(reviews).where(sql`${reviews.productId} = ${r.productId} AND ${reviews.status} = 'approved' AND ${reviews.isVerified} = true`);
    await tx.update(products).set({ ratingAvg: agg[0]?.avg ?? 0, ratingCount: agg[0]?.n ?? 0 }).where(eq(products.id, r.productId));
  });
  await audit(me.id, "review.moderate", "review", id, { status });
  revalidatePath("/admin/avis");
  return ok(undefined, status === "approved" ? "Avis publié." : "Avis rejeté.");
}

/** A counter-taken review (written down in the shop) earns the mark by hand. */
export async function verifyReviewAction(id: number): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.update(reviews).set({ isVerified: true, updatedAt: new Date() }).where(eq(reviews.id, id));
  await audit(me.id, "review.verify", "review", id);
  revalidatePath("/admin/avis");
  return ok(undefined, "Avis marqué comme achat vérifié.");
}

export async function replyTicketAction(id: number, reply: string, close: boolean): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  if (reply.trim().length < 2) return fail("Réponse trop courte.");
  const [updated] = await db
    .update(supportTickets)
    .set({ reply: reply.trim(), status: close ? "closed" : "answered", updatedAt: new Date() })
    .where(eq(supportTickets.id, id))
    .returning();
  if (updated) {
    // Mirror the staff answer into the conversation the customer reads in the
    // concierge panel, then write the letter: reply when the thread lives on,
    // « resolved » when the dossier closes.
    await db.insert(ticketMessages).values({ ticketId: id, userId: me.id, authorName: `${me.firstName} ${me.lastName}`, body: reply.trim(), isBot: false });
    const { sendTicketEmail } = await import("@/lib/email/triggers");
    void sendTicketEmail(updated, close ? "ticket_resolved" : "ticket_reply", reply.trim());
  }
  await audit(me.id, "ticket.reply", "ticket", id);
  revalidatePath("/admin/support");
  revalidatePath("/compte/support");
  return ok(undefined, "Réponse enregistrée.");
}

export async function saveArticleAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  const id = Number(form.get("id") || 0);
  const title = String(form.get("title") || "").trim();
  const body = String(form.get("body") || "").trim();
  if (title.length < 3 || body.length < 20) return fail("Titre ou contenu trop court.");
  const values = { title, slug: String(form.get("slug") || slugify(title)), excerpt: String(form.get("excerpt") || "").slice(0, 400) || null, body, tag: String(form.get("tag") || "") || null, image: String(form.get("image") || "") || null, author: String(form.get("author") || "").trim().slice(0, 120) || null, authorRole: String(form.get("authorRole") || "").trim().slice(0, 80) || null, readMinutes: Math.max(1, Math.ceil(body.split(/\s+/).length / 200)), isPublished: form.get("isPublished") === "on" };
  try {
    if (id) await db.update(articles).set({ ...values, updatedAt: new Date() }).where(eq(articles.id, id));
    else await db.insert(articles).values(values);
    revalidatePath("/journal"); revalidatePath("/admin/journal");
    return ok(undefined, "Article enregistré.");
  } catch { return fail("Slug déjà utilisé."); }
}

export async function saveStoreAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  const id = Number(form.get("id") || 0);
  const v = { name: String(form.get("name") || ""), slug: String(form.get("slug") || slugify(String(form.get("name") || ""))), address: String(form.get("address") || ""), city: String(form.get("city") || ""), phone: String(form.get("phone") || ""), hours: String(form.get("hours") || ""), mapsUrl: String(form.get("mapsUrl") || "").trim() || null, isActive: form.get("isActive") === "on" };
  if (v.name.length < 2 || v.address.length < 3 || v.phone.length < 8) return fail("Champs obligatoires manquants.");
  // Stored external links must be safe HTTPS URLs — never javascript: or http:.
  if (v.mapsUrl) {
    const u = httpsUrlSchema.safeParse(v.mapsUrl);
    if (!u.success) return fail("L'URL de la carte doit être une URL HTTPS valide.");
  }
  try {
    if (id) await db.update(stores).set({ ...v, updatedAt: new Date() }).where(eq(stores.id, id));
    else await db.insert(stores).values(v);
  } catch {
    // stores.slug is unique; report it instead of leaking a driver error.
    return fail("Une boutique utilise déjà cet identifiant (slug).");
  }
  revalidatePath("/boutiques"); revalidatePath("/admin/boutiques");
  return ok(undefined, "Boutique enregistrée.");
}

export async function updateUserRoleAction(userId: number, role: "customer" | "support" | "admin"): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  // The declared type is not a runtime guarantee: validate, otherwise a bad value
  // reaches the Postgres enum and surfaces as an unhandled driver error.
  const parsedRole = userRoleSchema.safeParse(role);
  if (!parsedRole.success) return fail("Rôle invalide.");
  if (!Number.isInteger(userId) || userId <= 0) return fail(MESSAGES.invalid);
  if (me.id === userId) return fail("Vous ne pouvez pas modifier votre propre rôle.");
  const updated = await db.update(users).set({ role: parsedRole.data, updatedAt: new Date() }).where(eq(users.id, userId)).returning({ id: users.id });
  if (!updated.length) return fail(MESSAGES.notFound);
  await audit(me.id, "user.role", "user", userId, { role: parsedRole.data });
  revalidatePath("/admin/clients");
  return ok(undefined, "Rôle mis à jour.");
}
export async function saveCustomerNoteAction(userId: number, notes: string): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  if (!Number.isInteger(userId) || userId <= 0) return fail(MESSAGES.invalid);
  const updated = await db.update(users).set({ notes: notes.slice(0, 2000) || null }).where(eq(users.id, userId)).returning({ id: users.id });
  if (!updated.length) return fail(MESSAGES.notFound);
  revalidatePath(`/admin/clients/${userId}`);
  return ok(undefined, "Note enregistrée.");
}

export async function recentOrdersForExport() {
  await requireStaff();
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(2000);
}

export async function updateReturnStatusAction(id: number, next: ReturnStatus, note?: string): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  const parsed = returnStatusSchema.safeParse(next);
  if (!parsed.success) return fail("Statut invalide.");
  if (!Number.isInteger(id) || id <= 0) return fail(MESSAGES.invalid);

  await db.transaction(async (tx) => {
    const [r] = await tx.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1);
    if (!r) throw new Error(MESSAGES.notFound);
    const patch: Partial<typeof returnRequests.$inferInsert> = { status: parsed.data, updatedAt: new Date() };
    if (note) patch.staffNote = note.slice(0, 2000);
    if (parsed.data === "approved" || parsed.data === "rejected" || parsed.data === "completed") {
      patch.resolvedAt = new Date();
      patch.resolvedBy = me.id;
    }
    await tx.update(returnRequests).set(patch).where(eq(returnRequests.id, id));
  });

  await audit(me.id, "return.status", "return", id, { next: parsed.data });
  // Prompt 11 — the customer learns of each step by letter, in their own
  // language. `pending`/`in_review` are internal shuffles: no mail for those.
  if (parsed.data === "approved" || parsed.data === "awaiting_customer" || parsed.data === "rejected" || parsed.data === "completed") {
    try {
      const [r] = await db.select().from(returnRequests).where(eq(returnRequests.id, id)).limit(1);
      if (r?.userId) {
        const [u] = await db.select({ id: users.id, firstName: users.firstName, email: users.email, locale: users.locale }).from(users).where(eq(users.id, r.userId)).limit(1);
        const [ord] = r.orderId ? await db.select({ number: orders.number }).from(orders).where(eq(orders.id, r.orderId)).limit(1) : [];
        if (u) {
          void sendOrQueueEmail({
            kind: "return_update",
            to: u.email,
            userId: u.id,
            locale: u.locale,
            payload: { kind: "return_update", firstName: u.firstName, returnNumber: r.number, orderNumber: ord?.number ?? "", status: parsed.data, note: note?.slice(0, 600) ?? null, locale: u.locale } as never,
          });
        }
      }
    } catch {
      /* the status change itself already committed — the letter retries via outbox on the next round */
    }
  }
  revalidatePath("/admin/support");
  revalidatePath(`/compte/retours`);
  return ok(undefined, "Statut de retour mis à jour.");
}

export async function markTicketReadAction(id: number): Promise<ActionResult> {
  const me = await staff();
  if (!me) return fail(MESSAGES.forbidden);
  await db.update(supportTickets).set({ readAt: new Date() }).where(eq(supportTickets.id, id));
  revalidatePath("/admin/support");
  return ok(undefined, "");
}

/* ── Mise en scène (P01) ────────────────────────────────────────────────────
 * The curated surfaces share one discipline: the office types product SLUGS,
 * the server resolves them, and a row that mentions an unknown slug is
 * refused rather than half-saved. A shelf or a ritual must never ship a link
 * that leads nowhere.
 */

function ltext(prefix: string, form: FormData, max = 160): LText {
  const clean = (k: string) => String(form.get(`${prefix}${k}`) ?? "").trim().slice(0, max);
  const fr = clean("-fr");
  if (!fr) throw new Error(`Le texte « ${prefix} » est vide.`);
  const out: LText = { fr };
  const tn = clean("-tn");
  const tna = clean("-tna");
  if (tn) out.tn = tn;
  if (tna) out.tna = tna;
  return out;
}

async function slugsToIds(lines: string[]): Promise<number[]> {
  const slugs = [...new Set(lines.map((x) => x.trim().toLowerCase()).filter(Boolean))];
  if (!slugs.length) return [];
  const rows = await db.select({ id: products.id, slug: products.slug }).from(products).where(inArray(products.slug, slugs));
  const found = new Set(rows.map((r) => r.slug));
  const missing = slugs.filter((s) => !found.has(s));
  if (missing.length) throw new Error(`Slug inconnu : ${missing.join(", ")}`);
  // Preserve the typed order — shelves and duos are merchandised by hand.
  return slugs.map((s) => rows.find((r) => r.slug === s)!.id);
}

function revalidateShop() {
  revalidatePath("/");
  revalidatePath("/admin/mise-en-scene");
}

export async function saveShelfAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  try {
    const title = ltext("titre", form, 120);
    const subtitle = form.get("sub-fr") ? ltext("sub", form, 220) : null;
    const startMonth = Math.min(12, Math.max(1, Number(form.get("startMonth") || 1)));
    const endMonth = Math.min(12, Math.max(1, Number(form.get("endMonth") || 12)));
    const productIds = await slugsToIds(String(form.get("slugs") ?? "").split(/\n|,/));
    if (productIds.length < 2) return fail("Une vitrine se tient avec au moins deux références valides.");
    const isActive = form.get("isActive") === "on";
    const id = Number(form.get("id") || 0);
    if (id) await db.update(shelves).set({ title, subtitle, startMonth, endMonth, productIds, isActive, updatedAt: new Date() }).where(eq(shelves.id, id));
    else await db.insert(shelves).values({ title, subtitle, startMonth, endMonth, productIds, isActive });
    await audit(me.id, id ? "shelf.update" : "shelf.create", "shelf", id || undefined);
    revalidateShop();
    return ok(undefined, "Vitrine enregistrée.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

export async function deleteShelfAction(form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail(MESSAGES.invalid);
  await db.delete(shelves).where(eq(shelves.id, id));
  await audit(me.id, "shelf.delete", "shelf", id);
  revalidateShop();
  return ok(undefined, "Vitrine retirée.");
}

export async function saveDuoAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  try {
    const name = ltext("nom", form, 120);
    const ids = await slugsToIds([String(form.get("slugA") ?? ""), String(form.get("slugB") ?? "")]);
    if (ids.length !== 2) return fail("Un duo, c’est deux références — deux slugs valides, svp.");
    const [a, b] = ids;
    if (a === b) return fail("Les deux membres d’un duo doivent être différents.");
    const discountMillimes = Math.round(Number(String(form.get("discountDT") ?? "0").replace(",", ".")) * 1000);
    if (!Number.isFinite(discountMillimes) || discountMillimes < 0) return fail("Remise invalide.");
    const [pa, pb] = await db.select({ price: products.priceMillimes }).from(products).where(inArray(products.id, [a, b]));
    const sum = (pa?.price ?? 0) + (pb?.price ?? 0);
    if (discountMillimes >= sum) return fail("Un duo doit rester payant : la remise dépasse le prix cumulé.");
    if (discountMillimes > sum * 0.35) return fail("Restons honnêtes : un duo pharmacien se limite à 35 % du cumulé.");
    const slug = slugify(name.fr).slice(0, 130) || `duo-${Date.now()}`;
    const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;
    const isActive = form.get("isActive") === "on";
    const id = Number(form.get("id") || 0);
    if (id) await db.update(duos).set({ name, productIdA: a, productIdB: b, discountMillimes, note, isActive, updatedAt: new Date() }).where(eq(duos.id, id));
    else await db.insert(duos).values({ slug, name, productIdA: a, productIdB: b, discountMillimes, note, isActive });
    await audit(me.id, id ? "duo.update" : "duo.create", "duo", id || undefined);
    revalidateShop();
    return ok(undefined, "Duo enregistré.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

export async function deleteDuoAction(form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail(MESSAGES.invalid);
  await db.delete(duos).where(eq(duos.id, id));
  await audit(me.id, "duo.delete", "duo", id);
  revalidateShop();
  return ok(undefined, "Duo retiré.");
}

export async function saveRoutineAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  try {
    const concernId = Number(form.get("concernId"));
    const concern = await db.query.concerns.findFirst({ where: eq(concerns.id, concernId) });
    if (!concern) return fail("Besoin inconnu.");
    const raw = [1, 2, 3].map((pos) => ({
      pos,
      slug: String(form.get(`p${pos}`) ?? "").trim(),
      hasLabel: Boolean(String(form.get(`l${pos}-fr`) ?? "").trim()),
    }));
    const filled = raw.filter((r) => r.slug);
    if (filled.length && filled.length !== 3) return fail("Un rituel conseillé se tient en trois gestes — ou pas du tout.");
    await db.transaction(async (tx) => {
      await tx.delete(routineSteps).where(eq(routineSteps.concernId, concernId));
      if (!filled.length) return;
      const ids = await slugsToIds(filled.map((f) => f.slug));
      const byPos = new Map(filled.map((f, i) => [f.pos, ids[i]]));
      for (const f of filled) {
        const label = ltext(`l${f.pos}`, form, 60);
        const reason = form.get(`r${f.pos}-fr`) ? ltext(`r${f.pos}`, form, 200) : null;
        await tx.insert(routineSteps).values({ concernId, position: f.pos, productId: byPos.get(f.pos)!, label, reason });
      }
    });
    await audit(me.id, "routine.save", "concern", concernId);
    revalidatePath(`/besoin/${concern.slug}`);
    revalidatePath("/admin/mise-en-scene");
    return ok(undefined, filled.length ? "Rituel enregistré." : "Rituel retiré de la page besoin.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

export async function saveSubstitutesAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  try {
    const productSlug = String(form.get("productSlug") ?? "").trim().toLowerCase();
    const [target] = await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.slug, productSlug));
    if (!target) return fail("Produit introuvable — vérifier le slug.");
    const rows = [1, 2].map((pos) => ({ pos, slug: String(form.get(`s${pos}`) ?? "").trim() })).filter((r) => r.slug);
    const ids = rows.length ? await slugsToIds(rows.map((r) => r.slug)) : [];
    if (ids.some((id) => id === target.id)) return fail("Un substitut doit être un autre produit que la référence.");
    await db.transaction(async (tx) => {
      await tx.delete(productSubstitutes).where(eq(productSubstitutes.productId, target.id));
      for (let i = 0; i < ids.length; i++) {
        const reason = form.get(`rs${rows[i].pos}-fr`) ? ltext(`rs${rows[i].pos}`, form, 200) : null;
        await tx.insert(productSubstitutes).values({ productId: target.id, substituteProductId: ids[i], position: i + 1, reason });
      }
    });
    await audit(me.id, "substitutes.save", "product", target.id, { count: ids.length });
    revalidatePath(`/produit/${productSlug}`);
    revalidatePath("/admin/mise-en-scene");
    return ok(undefined, ids.length ? "Substitutions enregistrées." : "Substitutions retirées.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/** “Souvent associé” (P02): two complements max, one honest FR line each. */
export async function savePairsAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  try {
    const productSlug = String(form.get("productSlug") ?? "").trim().toLowerCase();
    const [target] = await db.select({ id: products.id }).from(products).where(eq(products.slug, productSlug));
    if (!target) return fail("Produit introuvable — vérifier le slug.");
    const rows = [1, 2].map((pos) => ({ pos, slug: String(form.get(`p${pos}`) ?? "").trim(), reason: String(form.get(`pr${pos}`) ?? "").trim().slice(0, 200) })).filter((r) => r.slug);
    const ids = rows.length ? await slugsToIds(rows.map((r) => r.slug)) : [];
    if (ids.some((id) => id === target.id)) return fail("Un associé doit être un autre produit que la référence.");
    await db.transaction(async (tx) => {
      await tx.delete(productPairs).where(eq(productPairs.productId, target.id));
      for (let i = 0; i < ids.length; i++) {
        await tx.insert(productPairs).values({ productId: target.id, pairProductId: ids[i], reason: rows[i].reason || null, position: i + 1 });
      }
    });
    await audit(me.id, "pairs.save", "product", target.id, { count: ids.length });
    revalidatePath(`/produit/${productSlug}`);
    revalidatePath("/admin/mise-en-scene");
    return ok(undefined, ids.length ? "Associés enregistrés." : "Associés retirés.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

export async function saveBrandPicksAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await adminOnly();
  if (!me) return fail(MESSAGES.forbidden);
  try {
    const brandSlug = String(form.get("brandSlug") ?? "").trim().toLowerCase();
    const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, brandSlug));
    if (!brand) return fail("Laboratoire introuvable.");
    const story = String(form.get("story") ?? "").trim().slice(0, 2000) || null;
    const heroSlugs = String(form.get("heroSlugs") ?? "").split(/\n|,/).map((x) => x.trim()).filter(Boolean);
    if (heroSlugs.length > 3) return fail("Trois références héro au maximum — c’est un trio, pas une vitrine.");
    const ids = heroSlugs.length ? await slugsToIds(heroSlugs) : [];
    if (ids.length) {
      const bad = await db.select({ id: products.id }).from(products).where(and(inArray(products.id, ids), sql`${products.brandId} is distinct from ${brand.id}`));
      if (bad.length) return fail("Les références héro doivent appartenir au laboratoire.");
    }
    await db.update(brands).set({ story, heroProductIds: ids, updatedAt: new Date() }).where(eq(brands.id, brand.id));
    await audit(me.id, "brand.picks", "brand", brand.id);
    revalidatePath(`/marque/${brandSlug}`);
    revalidatePath("/admin/mise-en-scene");
    return ok(undefined, "Page laboratoire enregistrée.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}
