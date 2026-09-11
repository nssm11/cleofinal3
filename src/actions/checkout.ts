"use server";
import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orderEvents, orderItems, orders, stores, users } from "@/db/schema";
import { createSession, getCurrentUser, hashPassword } from "@/lib/auth";
import { fail, MESSAGES, ok, zodFieldErrors, type ActionResult } from "@/lib/api";
import { GIFT_WRAP_FEE, LOYALTY_POINT_MILLIMES, loyaltyDiscountFor, shippingFor } from "@/lib/money";
import { checkOrigin, clientKey } from "@/lib/origin";
import {
  addOrderEvent,
  audit,
  generateAccessKey,
  lockOrder,
  lockProducts,
  recordLoyaltyRedemption,
  recordMovement,
  reserveOrderNumber,
  restockOrder,
  restoreSpentLoyalty,
  reverseLoyaltyForOrder,
  track,
} from "@/lib/orders";
import { isPaymentMethodEnabled } from "@/lib/payments";
import { reservePromoUsage } from "@/lib/promotions";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation";
import { log } from "@/lib/logger";

/**
 * Transaction-scoped advisory lock keyed on the idempotency key.
 * Two identical requests arriving at the same time — even on different app
 * instances — serialise here, so the second one finds the committed order
 * instead of inserting a duplicate. The lock is released automatically at
 * commit/rollback; the unique index on `orders.idempotency_key` is the backstop.
 */
function advisoryKey(idempotencyKey: string): string {
  return BigInt("0x" + createHash("sha256").update(`cleo:idem:${idempotencyKey}`).digest("hex").slice(0, 15)).toString();
}

export async function placeOrderAction(input: unknown): Promise<ActionResult<{ number: string; accessKey: string }>> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  if (!(await rateLimit(`checkout:${await clientKey()}`, 6, 300_000))) return fail(MESSAGES.rateLimited);
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return fail(MESSAGES.invalid, zodFieldErrors(parsed.error.issues));
  const data = parsed.data;
  const me = await getCurrentUser();

  // Payment methods the server actually supports. The UI disabling `card` is
  // cosmetic; this is the real gate.
  if (!isPaymentMethodEnabled(data.paymentMethod)) {
    return fail("Ce moyen de paiement n'est pas disponible. Merci d'en choisir un autre.");
  }

  // Fast path for a plain retry; the authoritative check runs inside the
  // transaction below, under the advisory lock.
  const existing = await db.query.orders.findFirst({ where: eq(orders.idempotencyKey, data.idempotencyKey) });
  if (existing) return ok({ number: existing.number, accessKey: existing.accessKey ?? "" }, "Commande déjà enregistrée.");

  // merge duplicate lines
  const merged = new Map<number, number>();
  for (const l of data.lines) merged.set(l.productId, Math.min(20, (merged.get(l.productId) ?? 0) + l.quantity));

  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${advisoryKey(data.idempotencyKey)}::bigint)`);

      const dup = await tx.query.orders.findFirst({ where: eq(orders.idempotencyKey, data.idempotencyKey) });
      if (dup) return { order: dup, userId: dup.userId, created: false, duplicate: true } as const;

      const locked = await lockProducts(tx, [...merged.keys()]);
      const lines = [] as { productId: number; name: string; sku: string; image: string | null; brandId: number | null; universeId: number | null; unit: number; qty: number; total: number }[];
      for (const [pid, qty] of merged) {
        const p = locked.find((x) => x.id === pid);
        if (!p || p.status !== "active") throw new Error(`Un article n'est plus disponible.`);
        if (p.stock < qty) throw new Error(`Stock insuffisant pour « ${p.name} » (${p.stock} restant${p.stock > 1 ? "s" : ""}).`);
        lines.push({ productId: p.id, name: p.name, sku: p.sku, image: p.image, brandId: p.brand_id, universeId: p.universe_id, unit: p.price_millimes, qty, total: p.price_millimes * qty });
      }
      const subtotal = lines.reduce((a, l) => a + l.total, 0);

      let discount = 0, freeShipping = false, promoCode: string | null = null;
      if (data.promoCode) {
        // Row-locked, limit-checked and atomically consumed. Rolls back with the
        // rest of the transaction if anything downstream fails.
        const res = await reservePromoUsage(tx, data.promoCode, lines.map((l) => ({ productId: l.productId, universeId: l.universeId, lineTotal: l.total })), me?.id, data.email);
        if (!res.ok) throw new Error(res.reason);
        discount = res.discount; freeShipping = res.freeShipping; promoCode = res.promo.code;
      }

      // Pickup is validated against the stores table — never trust the client.
      let storeId: number | null = null;
      if (data.shippingMethod === "pickup") {
        if (!data.storeId) throw new Error("Veuillez sélectionner une boutique de retrait.");
        const store = await tx.select({ id: stores.id }).from(stores).where(and(eq(stores.id, data.storeId), eq(stores.isActive, true))).limit(1);
        if (!store.length) throw new Error("Cette boutique de retrait n'est pas disponible. Merci d'en choisir une autre.");
        storeId = store[0].id;
      }

      // Loyalty redemption — 1000 points = 10 DT. The balance is read under
      // FOR UPDATE so two concurrent checkouts cannot spend the same points;
      // the (order_id, kind) uniqueness on the ledger is the backstop.
      let loyaltySpent = 0;
      if (me && data.usePoints) {
        const [u] = await tx.select({ loyaltyPoints: users.loyaltyPoints }).from(users).where(eq(users.id, me.id)).for("update");
        if (u) {
          const maxByRemaining = Math.floor(Math.max(0, subtotal - discount) / LOYALTY_POINT_MILLIMES);
          loyaltySpent = Math.min(u.loyaltyPoints, maxByRemaining);
        }
      }
      const pointsDiscount = loyaltyDiscountFor(loyaltySpent);

      const shipping = freeShipping && data.shippingMethod !== "express" ? 0 : shippingFor(subtotal - discount - pointsDiscount, data.shippingMethod);
      const giftWrapFee = data.giftWrap ? GIFT_WRAP_FEE : 0;
      const total = subtotal - discount - pointsDiscount + shipping + giftWrapFee;

      let userId = me?.id ?? null;
      if (!me && data.createAccount && data.accountPassword && data.accountPassword.length >= 8) {
        const exists = await tx.query.users.findFirst({ where: eq(users.email, data.email) });
        if (!exists) {
          const [first, ...rest] = data.address.fullName.split(" ");
          const [u] = await tx.insert(users).values({ email: data.email, passwordHash: await hashPassword(data.accountPassword), firstName: first || "Client", lastName: rest.join(" ") || "Cléopâtre", phone: data.address.phone }).returning();
          userId = u.id;
        }
      }

      const brandNames = await tx.execute(sql`SELECT id, name FROM brands`);
      const bn = new Map((brandNames.rows as { id: number; name: string }[]).map((b) => [b.id, b.name]));
      const [order] = await tx.insert(orders).values({
        number: await reserveOrderNumber(tx), accessKey: generateAccessKey(), idempotencyKey: data.idempotencyKey, userId, email: data.email, phone: data.address.phone,
        paymentMethod: data.paymentMethod, shippingMethod: data.shippingMethod, storeId,
        shippingAddress: { ...data.address, line2: data.address.line2 || undefined, postalCode: data.address.postalCode || undefined },
        subtotalMillimes: subtotal, discountMillimes: discount, shippingMillimes: shipping, giftWrapMillimes: giftWrapFee, totalMillimes: total,
        loyaltySpent,
        promoCode, giftWrap: data.giftWrap, giftMessage: data.giftMessage || null, customerNote: data.customerNote || null,
      }).returning();
      if (loyaltySpent > 0) await recordLoyaltyRedemption(tx, order, loyaltySpent);
      await tx.insert(orderItems).values(lines.map((l) => ({ orderId: order.id, productId: l.productId, name: l.name, sku: l.sku, brandName: l.brandId ? bn.get(l.brandId) ?? null : null, image: l.image, unitPriceMillimes: l.unit, quantity: l.qty, lineTotalMillimes: l.total })));
      for (const l of lines) {
        await recordMovement(tx, { productId: l.productId, type: "sale", quantity: -l.qty, reason: `Commande ${order.number}`, orderId: order.id, userId: userId ?? undefined });
        await tx.execute(sql`UPDATE products SET sales_count = sales_count + ${l.qty} WHERE id = ${l.productId}`);
      }
      await addOrderEvent(tx, order.id, "pending", "Commande reçue", userId ?? undefined);
      // Loyalty is intentionally NOT awarded here: the order is still `pending`
      // and unpaid. Points are granted when the order is settled — see
      // `awardLoyaltyForOrder` in `updateOrderStatusAction`.
      return { order, userId, created: !me && userId != null, duplicate: false } as const;
    });

    if (result.created && result.userId) await createSession(result.userId, (await headers()).get("user-agent"));
    if (!result.duplicate) {
      await track("order.placed", { number: result.order.number, total: result.order.totalMillimes }, result.userId);
      log.info("order.placed", { number: result.order.number });
      revalidatePath("/admin");
    }
    return ok(
      { number: result.order.number, accessKey: result.order.accessKey ?? "" },
      result.duplicate ? "Commande déjà enregistrée." : "Commande confirmée.",
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : MESSAGES.generic;
    log.warn("order.failed", { msg });
    return fail(msg);
  }
}

export async function cancelOrderAction(orderId: number): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  try {
    const res = await db.transaction(async (tx) => {
      const o = await lockOrder(tx, orderId);
      // Ownership is re-checked against the locked row.
      if (!o || o.userId !== me.id) throw new Error(MESSAGES.notFound);
      if (!["pending", "confirmed"].includes(o.status)) throw new Error("Cette commande ne peut plus être annulée.");
      // Conditional update: the row count tells us whether *we* performed the
      // transition, so a second concurrent cancel cannot restock twice.
      const updated = await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() })
        .where(and(eq(orders.id, o.id), sql`${orders.status} IN ('pending','confirmed')`)).returning({ id: orders.id });
      if (!updated.length) throw new Error("Cette commande ne peut plus être annulée.");
      await restockOrder(tx, o.id, me.id);
      await reverseLoyaltyForOrder(tx, o, `Annulation commande ${o.number}`);
      await restoreSpentLoyalty(tx, o);
      await addOrderEvent(tx, o.id, "cancelled", "Annulée par le client", me.id);
      return true;
    });
    if (!res) return fail(MESSAGES.generic);
    await audit(me.id, "order.cancel", "order", orderId);
    revalidatePath("/compte/commandes");
    return ok(undefined, "Commande annulée. Les articles ont été remis en stock.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : MESSAGES.generic);
  }
}

/*
 * Returns live in one workflow only: `createReturnRequestAction` (src/actions/shop.ts),
 * which writes a `return_requests` row plus its support ticket. The historical
 * event-based duplicate was removed so the timeline, the account page and the
 * back-office all read the same ledger.
 */
