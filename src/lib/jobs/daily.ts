import "server-only";
import { and, eq, lte, or, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addresses,
  brands,
  orders,
  annualRewards,
  loyaltyTransactions,
  orderItems,
  passwordResets,
  products,
  rituals,
  subscriptionEvents,
  subscriptionItems,
  subscriptions,
  users,
} from "@/db/schema";
import { addOrderEvent, audit, recordMovement, reserveOrderNumber, generateAccessKey } from "@/lib/orders";
import { shippingFor } from "@/lib/money";
import { flushOutbox, sendOrQueueEmail } from "@/lib/email/send";
import { formatDate } from "@/lib/utils";
import { log } from "@/lib/logger";

/**
 * THE DAILY ROUND — what the house does at the top of every hour: deliver the
 * due letters, whisper the ritual reminders, run the subscription cycle, and
 * keep the birthday promise. Every step is idempotent, so the cron can fire
 * as often as the platform likes.
 */

export type DailyReport = {
  outbox: { processed: number };
  rituals: number;
  subscriptions: number;
  birthdays: number;
};

/** Today in Africa/Tunis — the house clock, with or without the host's TZ. */
export function tunisNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour"));
  const weekdayIdx = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { date, hour, weekday: weekdayIdx < 0 ? 0 : weekdayIdx };
}

async function dueRituals(today: string, hour: number, weekday: number) {
  const rows = await db
    .select({
      id: rituals.id,
      userId: rituals.userId,
      name: rituals.name,
      moment: rituals.moment,
      reminderHour: rituals.reminderHour,
      reminderDays: rituals.reminderDays,
      items: rituals.items,
      email: users.email,
      firstName: users.firstName,
      locale: users.locale,
    })
    .from(rituals)
    .innerJoin(users, eq(users.id, rituals.userId))
    .where(and(eq(rituals.reminderEnabled, true), sql`coalesce(${rituals.lastRemindedOn}, '') <> ${today}`));
  let sent = 0;
  for (const r of rows) {
    if (hour < r.reminderHour) continue;
    if (!(r.reminderDays & (1 << weekday))) continue;
    const ids = (r.items ?? []).map((x) => x.productId);
    let steps: { name: string; brandName: string | null }[] = [];
    if (ids.length) {
      const rows = await db
        .select({ id: products.id, name: products.name, brandName: brands.name })
        .from(products)
        .leftJoin(brands, eq(brands.id, products.brandId))
        .where(sql`${products.id} IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`);
      const byId = new Map(rows.map((x) => [x.id, x]));
      steps = ids.filter((id) => byId.has(id)).map((id) => ({ name: byId.get(id)!.name, brandName: byId.get(id)!.brandName }));
    }
    await sendOrQueueEmail({
      kind: "ritual_reminder",
      to: r.email,
      userId: r.userId,
      locale: r.locale,
      payload: {
        kind: "ritual_reminder",
        firstName: r.firstName,
        ritualName: r.name,
        moment: r.moment === "evening" ? "evening" : "morning",
        steps: [],
        locale: r.locale,
      } as never,
    });
    await db.update(rituals).set({ lastRemindedOn: today }).where(eq(rituals.id, r.id));
    sent++;
  }
  return sent;
}

async function runDueSubscriptions(todayIso: string) {
  const due = await db
    .select({ s: subscriptions, user: users })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(and(eq(subscriptions.status, "active"), lte(subscriptions.nextDueAt, new Date())));
  let count = 0;
  for (const { s, user } of due) {
    const items = await db
      .select({
        id: subscriptionItems.id,
        productId: subscriptionItems.productId,
        quantity: subscriptionItems.quantity,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        priceMillimes: products.priceMillimes,
        stock: products.stock,
        image: products.image,
      })
      .from(subscriptionItems)
      .innerJoin(products, eq(products.id, subscriptionItems.productId))
      .where(eq(subscriptionItems.subscriptionId, s.id));
    const active = items.filter((i) => i.stock > 0 && i.priceMillimes > 0);
    const addr = await db.query.addresses.findFirst({ where: eq(addresses.userId, s.userId), orderBy: sql`${addresses.isDefault} DESC, ${addresses.createdAt} ASC` });
    const nextDue = new Date(s.nextDueAt.getTime() + s.frequencyDays * 86_400_000);
    if (!active.length || !addr) {
      await db.insert(subscriptionEvents).values({
        subscriptionId: s.id,
        type: "skipped",
        detail: !addr ? "Aucune adresse enregistrée" : "Références indisponibles au réassort",
      });
      await db.update(subscriptions).set({ nextDueAt: nextDue, updatedAt: new Date() }).where(eq(subscriptions.id, s.id));
      continue;
    }
    const subtotal = active.reduce((a, i) => a + i.priceMillimes * i.quantity, 0);
    const discount = Math.round(subtotal * 0.05); // l'avantage abonnée : 5 %
    const shipping = shippingFor(subtotal - discount, "standard");
    const total = subtotal - discount + shipping;
    const idem = `sub-${s.id}-${formatDate(new Date()).replace(/\D/g, "")}`;
    try {
      const result = await db.transaction(async (tx) => {
        const number = await reserveOrderNumber(tx);
        const [o] = await tx
          .insert(orders)
          .values({
            number,
            accessKey: generateAccessKey(),
            idempotencyKey: idem,
            userId: s.userId,
            email: user.email,
            phone: addr.phone,
            status: "confirmed",
            paymentMethod: "cod",
            paymentStatus: "pending",
            shippingMethod: "standard",
            shippingAddress: { fullName: addr.fullName, phone: addr.phone, line1: addr.line1, line2: addr.line2 ?? undefined, city: addr.city, governorate: addr.governorate, postalCode: addr.postalCode ?? undefined },
            subtotalMillimes: subtotal,
            discountMillimes: discount,
            shippingMillimes: shipping,
            totalMillimes: total,
            promoCode: null,
            customerNote: `Abonnement Cléopâtre n° ${s.id} — réassort automatique (−5 % abonnée).`,
          })
          .returning();
        await tx.insert(orderItems).values(
          active.map((i) => ({
            orderId: o.id,
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            unitPriceMillimes: i.priceMillimes,
            quantity: i.quantity,
            lineTotalMillimes: i.priceMillimes * i.quantity,
          })),
        );
        for (const i of active) {
          await recordMovement(tx, { productId: i.productId, type: "sale", quantity: -i.quantity, reason: `Abonnement ${s.id}`, orderId: o.id, userId: s.userId });
        }
        await addOrderEvent(tx, o.id, "confirmed", `Réassort automatique — abonnement n° ${s.id}.`);
        return { id: o.id, number: o.number };
      });
      await db.insert(subscriptionEvents).values({ subscriptionId: s.id, type: "ordered", detail: `Commande ${result.number}`, orderId: result.id });
      await sendOrQueueEmail({
        kind: "subscription_order",
        to: user.email,
        userId: s.userId,
        locale: user.locale,
        payload: {
          kind: "subscription_order",
          firstName: user.firstName,
          orderNumber: result.number,
          items: active.map((i) => ({ name: i.name, quantity: i.quantity, lineTotalMillimes: i.priceMillimes * i.quantity })),
          totalMillimes: total,
          nextDueAt: formatDate(nextDue),
          locale: user.locale,
        } as never,
      });
    } catch (e) {
      log.warn("subscription cycle failed", { sub: s.id, error: e instanceof Error ? e.message : String(e) });
      await audit(null, "subscription.cycle-error", "subscription", s.id, { error: String(e) });
    }
    await db.update(subscriptions).set({ status: "active", nextDueAt: nextDue, updatedAt: new Date() }).where(eq(subscriptions.id, s.id));
    count++;
  }
  return count;
}

async function birthdayCeremony(nowIso: string) {
  const month = nowIso.slice(5, 7);
  const day = nowIso.slice(8, 10);
  const year = Number(nowIso.slice(0, 4));
  const candidates = await db
    .select({ id: users.id, email: users.email, firstName: users.firstName, locale: users.locale })
    .from(users)
    .where(
      and(
        sql`to_char(${users.birthDate} at time zone 'UTC', 'MM-DD') = ${month + "-" + day}`,
        sql`NOT EXISTS (SELECT 1 FROM annual_rewards ar WHERE ar.user_id = ${users.id} AND ar.kind = 'birthday' AND ar.year = ${year})`,
      ),
    )
    .limit(50);
  let n = 0;
  for (const u of candidates) {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(annualRewards).values({ userId: u.id, kind: "birthday", year, points: 500 });
        await tx.insert(loyaltyTransactions).values({ userId: u.id, points: 500, kind: "award", reason: "Cadeau d'anniversaire Cléopâtre" });
        await tx.update(users).set({ loyaltyPoints: sql`${users.loyaltyPoints} + 500` }).where(eq(users.id, u.id));
      });
      await sendOrQueueEmail({
        kind: "vip_birthday",
        to: u.email,
        userId: u.id,
        locale: u.locale,
        payload: { kind: "vip_birthday", firstName: u.firstName, locale: u.locale } as never,
      });
      n++;
    } catch (e) {
      log.warn("birthday grant failed", { user: u.id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return n;
}

export async function runDailyRound(): Promise<DailyReport> {
  const { date, hour, weekday } = tunisNow();
  const outbox = await flushOutbox(40);
  const rit = await dueRituals(date, hour, weekday);
  const subs = await runDueSubscriptions(date);
  const bir = await birthdayCeremony(new Date().toISOString());
  // Housekeeping: expired reset tokens and stale outbox errors.
  await db.delete(passwordResets).where(or(lte(passwordResets.expiresAt, new Date(Date.now() - 86_400_000)), isNull(passwordResets.expiresAt)));
  return { outbox, rituals: rit, subscriptions: subs, birthdays: bir };
}
