import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { renderAsync } from "@react-email/render";
import { db } from "@/db";
import { orderItems, products, restockAlerts, subscriptions, users, type Order } from "@/db/schema";
import { SITE_URL } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { sendImmediateEmail, sendOrQueueEmail } from "./send";
import { renderEmailElement, type EmailKind, type EmailPayload } from "./registry";
import { emailLocale } from "./theme";
import { issueOtp } from "./otp";
import type { OrderEmailKind } from "./templates/orders";
import { OtpEmail, otpEmailSubject, type OtpData } from "./templates/otp";
import { log } from "@/lib/logger";

/**
 * Who gets which letter, built from live rows — so a template never has to
 * query, and a query never has to know about templates. Every trigger here is
 * fire-and-forget for the customer flow: an e-mail failure may never break an
 * order transition, so each call swallows its errors after logging them.
 */

async function send(
  kind: EmailKind,
  payload: Record<string, unknown> & { locale: string },
  opts: { to: string; userId?: number | null; sendAt?: Date },
) {
  try {
    return await sendOrQueueEmail({
      kind,
      payload: payload as unknown as EmailPayload,
      to: opts.to,
      locale: payload.locale || "fr",
      userId: opts.userId ?? null,
      sendAt: opts.sendAt,
    });
  } catch (e) {
    log.warn("email enqueue failed", { kind, error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

async function propsFor(userId: number | null, fallbackEmail?: string) {
  if (userId) {
    const u = await db.select({ locale: users.locale, optIn: users.emailOptIn, firstName: users.firstName }).from(users).where(eq(users.id, userId)).limit(1);
    if (u[0]) return { locale: u[0].locale, optIn: u[0].optIn, firstName: u[0].firstName };
  }
  void fallbackEmail;
  return { locale: "fr", optIn: true, firstName: null as string | null };
}

/* ── Accounts ────────────────────────────────────────────────────────────── */

export async function sendWelcomeEmail(userId: number) {
  const u = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u[0]) return;
  await send("welcome", { kind: "welcome", firstName: u[0].firstName, locale: u[0].locale }, { to: u[0].email, userId });
}

/** Password-reset letter. The caller decides whether the account exists; this never reveals it. */
export async function sendPasswordResetEmail(email: string, token: string, userId: number, locale: string, firstName: string) {
  await send(
    "password_reset",
    {
      kind: "password_reset",
      firstName,
      resetUrl: `${SITE_URL}/reinitialiser-mot-de-passe/${encodeURIComponent(token)}`,
      expiresInMinutes: 60,
      locale,
    },
    { to: email, userId },
  );
}

/**
 * The verification key. The code travels ONLY in this in-memory render —
 * the outbox row stores the OTP id, never the secret, and the send is
 * immediate and single-shot (a retry could not re-derive the code).
 */
export async function sendOtpEmail(userId: number): Promise<{ sent: boolean; reason?: string }> {
  const u = await db.select({ id: users.id, email: users.email, firstName: users.firstName, locale: users.locale }).from(users).where(eq(users.id, userId)).limit(1);
  const row = u[0];
  if (!row) return { sent: false, reason: "missing_user" };
  const issued = await issueOtp(userId);
  if ("error" in issued) return { sent: false, reason: issued.error };
  const locale = emailLocale(row.locale);
  const payload: OtpData & { kind: "email_otp" } = {
    kind: "email_otp",
    firstName: row.firstName ?? "",
    otpId: issued.otpId,
    code: issued.code,
    locale,
  };
  const storedPayload: EmailPayload = { kind: "email_otp", firstName: row.firstName ?? "", otpId: issued.otpId, locale };
  const subject = otpEmailSubject(locale);
  const html = await renderAsync(renderEmailElement("email_otp", payload, locale), { pretty: false });
  try {
    await sendImmediateEmail({
      kind: "email_otp",
      payload: storedPayload,
      to: row.email,
      toName: row.firstName || undefined,
      locale: row.locale,
      html,
      userId,
    });
    return { sent: true };
  } catch (e) {
    log.warn("otp letter failed", { userId, error: e instanceof Error ? e.message : String(e) });
    return { sent: false, reason: "send_failed" };
  }
}

/** Credentials changed — the customer must hear it from the house, not from a guess. */
export async function sendSecurityChangeEmail(userId: number, whenIso: string) {
  const u = await db.select({ email: users.email, firstName: users.firstName, locale: users.locale }).from(users).where(eq(users.id, userId)).limit(1);
  const row = u[0];
  if (!row) return;
  const locale = emailLocale(row.locale);
  const when = formatDate(whenIso);
  await send(
    "security_change",
    { kind: "security_change", firstName: row.firstName ?? "", when, locale: locale },
    { to: row.email, userId },
  );
}

/** Offline payment settled by hand — the money is in, the order moves. */
export async function sendPaymentConfirmedEmail(order: Order, amountMillimes: number, paymentMethodLabel: string) {
  const loc = await propsFor(order.userId, order.email);
  await send(
    "payment_confirmed",
    {
      kind: "payment_confirmed",
      firstName: order.shippingAddress?.fullName?.split(" ")[0] || order.email.split("@")[0],
      orderNumber: order.number,
      amountMillimes,
      paymentMethodLabel,
      locale: loc.locale,
    },
    { to: order.email, userId: order.userId },
  );
}

/** Subscription stopped — the quiet closure, with the date that will not come. */
export async function sendSubscriptionCancelledEmail(userId: number, subscriptionId: number) {
  const u = await db.select({ email: users.email, firstName: users.firstName, locale: users.locale }).from(users).where(eq(users.id, userId)).limit(1);
  const row = u[0];
  if (!row) return;
  const s = await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, subscriptionId) });
  if (!s) return;
  const locale = emailLocale(row.locale);
  const isTn = locale !== "fr";
  await send(
    "subscription_cancelled",
    {
      kind: "subscription_cancelled",
      firstName: row.firstName ?? "",
      frequencyLabel: isTn ? `Kol ${s.frequencyDays} youm` : `Tous les ${s.frequencyDays} jours`,
      // The last delivery date is the cycle step before the one that will not come.
      lastDeliveryAt: formatDate(new Date(s.nextDueAt.getTime() - s.frequencyDays * 86_400_000)),
      nextWasDueAt: formatDate(s.nextDueAt),
      locale,
    },
    { to: row.email, userId },
  );
}

/* ── Orders ──────────────────────────────────────────────────────────────── */

export async function orderLetterPayload(order: Order, kind: OrderEmailKind, locale: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const addr = order.shippingAddress;
  return {
    kind,
    orderNumber: order.number,
    firstName: addr?.fullName?.split(" ")[0] || order.email.split("@")[0],
    placedAt: formatDate(order.createdAt),
    items: items.map((i) => ({ name: i.name, brandName: i.brandName, quantity: i.quantity, lineTotalMillimes: i.lineTotalMillimes, image: i.image })),
    totalMillimes: order.totalMillimes,
    refundAmountMillimes: kind === "order_refunded" ? order.totalMillimes : null,
    loyaltyEarned: kind === "order_delivered" ? order.loyaltyEarned : null,
    address: addr ? `${addr.fullName} — ${addr.line1}${addr.line2 ? `, ${addr.line2}` : ""}, ${addr.city}, ${addr.governorate}` : null,
    trackingCode: order.trackingCode,
    carrierUrl: order.trackingCode ? `https://t.17track.net/en#nums=${encodeURIComponent(order.trackingCode)}` : null,
    locale,
  };
}

export const STATUS_TO_EMAIL: Partial<Record<string, OrderEmailKind>> = {
  confirmed: "order_confirmed",
  preparing: "order_preparing",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
  returned: "order_refunded",
};

export async function sendOrderStatusEmail(order: Order, kind: OrderEmailKind) {
  const loc = await propsFor(order.userId, order.email);
  const payload = await orderLetterPayload(order, kind, loc.locale);
  await send(kind, payload, { to: order.email, userId: order.userId });
}

/** The two letters of the post-purchase care sequence, queued from delivery. */
export async function queueCareSequence(order: Order) {
  const loc = await propsFor(order.userId, order.email);
  if (!loc.optIn) return;
  const isTn = loc.locale !== "fr";
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const first = items[0];
  const [prod] = first?.productId ? await db.select().from(products).where(eq(products.id, first.productId)).limit(1) : [];
  const plainItems = items.map((i) => ({ name: i.name, brandName: i.brandName, quantity: i.quantity, lineTotalMillimes: i.lineTotalMillimes }));
  const firstName = order.shippingAddress?.fullName?.split(" ")[0] || order.email.split("@")[0];

  await send(
    "care_feedback",
    {
      kind: "care_feedback",
      firstName,
      orderNumber: order.number,
      items: plainItems,
      tips:
        prod?.howToUse ??
        (isTn
          ? "Kellou 3la jeld net, b ṭabqa r9î9a, we stenna 60 tsâniya 9bel el produit el li ya3doû. El istimrâr yetghleb el qowwa."
          : "Appliquez sur peau propre, en couche fine, et attendez une minute avant le produit suivant. La régularité bat l'intensité."),
      locale: loc.locale,
    },
    { to: order.email, userId: order.userId, sendAt: new Date(Date.now() + 2 * 86_400_000) },
  );

  // The invited witness (+4 days): one product, one honest ask.
  if (first?.productId) {
    await send(
      "review_request",
      {
        kind: "review_request",
        firstName,
        productName: first.name,
        productImage: first.image ?? null,
        productSlug: prod?.slug ?? "",
        locale: loc.locale,
      },
      { to: order.email, userId: order.userId, sendAt: new Date(Date.now() + 4 * 86_400_000) },
    );
  }

  // Follow-up (+11 days): one complementary suggestion from the same universe,
  // never a reference already ordered.
  if (prod?.universeId) {
    const orderedIds = items.map((i) => i.productId).filter((x): x is number => !!x);
    const [sug] = await db
      .select({ name: products.name, slug: products.slug, shortDescription: products.shortDescription })
      .from(products)
      .where(
        and(
          eq(products.universeId, prod.universeId),
          eq(products.status, "active"),
          sql`${products.stock} > 0`,
          ...(orderedIds.length ? [sql`${products.id} NOT IN (${sql.join(orderedIds.map((id) => sql`${id}`), sql`, `)})`] : []),
        ),
      )
      .orderBy(desc(products.salesCount))
      .limit(1);
    if (sug) {
      await send(
        "care_followup",
        {
          kind: "care_followup",
          firstName,
          orderNumber: order.number,
          advice: isTn
            ? "Nakmlou er-rotîne mouch bel 7azâra: el 3inâya hedhi tejaweb 3la el li el mte3ek yessebloû na9eṣ."
            : "On complète rarement une routine par hasard : ce soin-ci répond à ce que le vôtre laisse de côté.",
          suggestion: sug,
          locale: loc.locale,
        },
        { to: order.email, userId: order.userId, sendAt: new Date(Date.now() + 11 * 86_400_000) },
      );
    }
  }
}

/* ── Support tickets ─────────────────────────────────────────────────────── */

export async function sendTicketEmail(
  ticket: { id: number; email: string; name: string; subject: string; userId: number | null },
  kind: "ticket_created" | "ticket_reply" | "ticket_resolved",
  reply?: string,
) {
  const loc = await propsFor(ticket.userId, ticket.email);
  await send(
    kind,
    {
      kind,
      ticketId: ticket.id,
      ticketNumber: `#${String(ticket.id).padStart(5, "0")}`,
      firstName: (ticket.name || "").split(" ")[0] || ticket.email.split("@")[0],
      subject: ticket.subject,
      reply: reply ?? null,
      locale: loc.locale,
    },
    { to: ticket.email, userId: ticket.userId },
  );
}

/** Restock letters — logged-in watchers first, guests +24 h later. */
export async function enqueueRestockAlerts(productId: number) {
  const [prod] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!prod) return 0;
  const watchers = await db.select().from(restockAlerts).where(and(eq(restockAlerts.productId, productId), isNull(restockAlerts.notifiedAt)));
  let n = 0;
  for (const w of watchers) {
    const loc = await propsFor(w.userId, w.email);
    await send(
      "restock_available",
      {
        kind: "restock_available",
        firstName: loc.firstName ?? "",
        productSlug: prod.slug,
        productName: prod.name,
        locale: w.locale || loc.locale,
      },
      { to: w.email, userId: w.userId, sendAt: w.userId ? new Date() : new Date(Date.now() + 24 * 3_600_000) },
    );
    await db.update(restockAlerts).set({ notifiedAt: new Date() }).where(eq(restockAlerts.id, w.id));
    // Account holders hear it in the house too — guests only get the letter.
    if (w.userId) {
      const { restockNotified } = await import("@/lib/notify-events");
      void restockNotified(w.userId, prod.slug, prod.name, w.id);
    }
    n++;
  }
  return n;
}
