import "server-only";
import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { careFollowUps, orderItems, orders, products, restockAlerts, type OrderStatus } from "@/db/schema";
import { PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/orders";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { url } from "./brand";
import { CARE_FEEDBACK_MAIL, CARE_FOLLOWUP_MAIL, ORDER_MAIL_COPY, RESTOCK_MAIL } from "./copy";
import { htmlToText } from "./render";
import { t, type Locale } from "@/i18n";
import { sendMail, type MailResult } from "./transport";
import { welcomeEmail } from "./templates/welcome";
import { orderStatusEmail } from "./templates/order-status";
import { passwordResetEmail } from "./templates/password-reset";
import { ticketCreatedEmail, ticketReplyEmail, ticketResolvedEmail } from "./templates/ticket";
import { restockEmail } from "./templates/restock";
import { careFeedbackEmail, careFollowUpEmail } from "./templates/care";
import type { MailOrder, MailTicket } from "./types";

/**
 * LE BUREAU DU COURRIER — the only module the rest of the app talks to.
 *
 * Actions call one function per letter; each renders its template, derives the
 * plain-text twin and hands the message to the transport. Nothing here throws,
 * so a mail failure can never roll back the change it was meant to announce.
 */

export { MAIL_CONFIGURED } from "@/lib/env";
export { ORDER_MAIL_COPY };
export type { MailOrder, MailOrderLine, MailTicket } from "./types";
export type { MailResult };

/** Every status the shop can announce, for callers that want to iterate. */
export const MAILABLE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

type Letter = { subject: string; html: string };
const withText = (l: Letter) => ({ ...l, text: htmlToText(l.html) });

/* ── 01 · Bienvenue ────────────────────────────────────────────────────── */

/**
 * La lettre de bienvenue.
 *
 * `subject` et `preheader` viennent de la couche de langue : c'est la seule
 * partie du texte qui soit aujourd'hui traduite, le corps reste français. Le
 * reste suivra sans que l'appelant change — il donne déjà la langue.
 */
export function sendWelcomeEmail(
  to: { email: string; firstName: string },
  locale: Locale = "fr",
): Promise<MailResult> {
  return sendMail({
    ...withText(
      welcomeEmail({
        firstName: to.firstName,
        subject: t(locale, "mail.welcomeSubject"),
        preheader: t(locale, "mail.welcomePreheader"),
      }),
    ),
    to: to.email,
    tags: [{ name: "kind", value: "welcome" }],
  });
}

/* ── 02 · Suivi de commande (7 statuts) ────────────────────────────────── */

function mailOrderFrom(o: typeof orders.$inferSelect, items: (typeof orderItems.$inferSelect)[]): MailOrder {
  const firstName = o.shippingAddress?.fullName?.trim().split(/\s+/)[0] || "bonjour";
  const key = o.accessKey
    ? `?n=${encodeURIComponent(o.number)}&k=${encodeURIComponent(o.accessKey)}`
    : `?n=${encodeURIComponent(o.number)}&e=${encodeURIComponent(o.email)}`;
  return {
    number: o.number,
    email: o.email,
    firstName,
    status: o.status,
    total: formatDT(o.totalMillimes),
    shippingLabel: SHIPPING_LABELS[o.shippingMethod],
    paymentLabel: PAYMENT_LABELS[o.paymentMethod],
    placedAt: formatDate(o.createdAt),
    trackingCode: o.trackingCode,
    lines: items.map((l) => ({
      name: l.name,
      brandName: l.brandName,
      quantity: l.quantity,
      lineTotal: formatDT(l.lineTotalMillimes),
    })),
    links: {
      tracking: url(`/suivi${key}`),
      shop: url("/boutique"),
      support: url("/aide"),
      account: url("/compte/commandes"),
    },
  };
}

/**
 * Read an order into the shape the template needs. Returns `null` when the
 * order is gone, so the caller skips the letter instead of sending an empty one.
 */
export async function loadMailOrder(orderId: number): Promise<MailOrder | null> {
  const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  return mailOrderFrom(o, items);
}

/** Send the letter that matches the order's current status. */
export function sendOrderStatusEmail(order: MailOrder): Promise<MailResult> {
  const letter = orderStatusEmail(order);
  return sendMail({
    ...withText(letter),
    to: order.email,
    tags: [{ name: "kind", value: `order-${order.status}` }],
  });
}

/** Convenience: load then send, in one call from an action. */
export async function sendOrderStatusForId(orderId: number): Promise<MailResult | null> {
  const order = await loadMailOrder(orderId);
  return order ? sendOrderStatusEmail(order) : null;
}

/* ── 03 · Mot de passe oublié ──────────────────────────────────────────── */

export function sendPasswordResetEmail(
  to: { email: string },
  resetHref: string,
  expiresInMinutes = 60,
): Promise<MailResult> {
  return sendMail({
    ...withText(passwordResetEmail({ resetHref, expiresInMinutes })),
    to: to.email,
    tags: [{ name: "kind", value: "password-reset" }],
  });
}

/* ── 04 · Support ──────────────────────────────────────────────────────── */

export function sendTicketCreatedEmail(t: MailTicket): Promise<MailResult> {
  return sendMail({ ...withText(ticketCreatedEmail(t)), to: t.email, tags: [{ name: "kind", value: "ticket-created" }] });
}

export function sendTicketReplyEmail(t: MailTicket): Promise<MailResult> {
  return sendMail({ ...withText(ticketReplyEmail(t)), to: t.email, tags: [{ name: "kind", value: "ticket-reply" }] });
}

export function sendTicketResolvedEmail(t: MailTicket): Promise<MailResult> {
  return sendMail({ ...withText(ticketResolvedEmail(t)), to: t.email, tags: [{ name: "kind", value: "ticket-resolved" }] });
}

/* The subject lines are derived inside the templates; exported for callers
   that want to log or preview what a given letter will say. */
export const MAIL_SUBJECTS = {
  welcome: "Bienvenue chez Cléopâtre ✨",
  order: (s: OrderStatus, number: string) => ORDER_MAIL_COPY[s].subject.replace("{number}", number),
  passwordReset: "Réinitialiser votre mot de passe",
};

/* ── 13 · De retour en stock ───────────────────────────────────────────── */

export { RESTOCK_MAIL, CARE_FEEDBACK_MAIL, CARE_FOLLOWUP_MAIL };

/**
 * Prévenir une personne : la référence est revenue.
 *
 * Appelée par `notifyRestockQueue`, mais exportée aussi pour qu'un réassort
 * saisi à la main puisse ne prévenir qu'une seule cliente.
 */
export function sendRestockAlertEmail(
  to: { email: string },
  o: { productName: string; brandName?: string | null; productHref: string; imageHref?: string | null; imageAlt?: string; priceLabel?: string; stock?: number | null },
): Promise<MailResult> {
  return sendMail({
    ...withText(restockEmail(o)),
    to: to.email,
    tags: [{ name: "kind", value: "restock" }],
  });
}

/**
 * Vider la file d'attente d'une référence qui vient d'être réapprovisionnée.
 *
 * Les comptes connectés passent en premier — c'est la contrepartie annoncée
 * d'avoir un espace — puis les autres, dans l'ordre des inscriptions. Chaque
 * ligne est marquée `notifiedAt` **avant** l'envoi : si l'envoi échoue, la
 * ligne reste dans la file pour un prochain passage plutôt que d'être perdue.
 *
 * Ne lève jamais d'exception : un réassort saisi en back office ne doit pas
 * échouer parce qu'un e-mail n'est pas parti.
 */
export async function notifyRestockQueue(productId: number, limit = 50): Promise<number> {
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.status, "active")),
    columns: { id: true, name: true, stock: true, slug: true, image: true, priceMillimes: true },
    with: { brand: { columns: { name: true } } },
  });
  if (!product || product.stock <= 0) return 0;

  const queue = await db
    .select()
    .from(restockAlerts)
    .where(and(eq(restockAlerts.productId, productId), isNull(restockAlerts.notifiedAt)))
    .orderBy(sql`CASE WHEN ${restockAlerts.userId} IS NULL THEN 1 ELSE 0 END`, restockAlerts.createdAt)
    .limit(limit);
  if (queue.length === 0) return 0;

  const { formatDT } = await import("@/lib/money");
  let sent = 0;
  for (const row of queue) {
    await db.update(restockAlerts).set({ notifiedAt: new Date() }).where(eq(restockAlerts.id, row.id));
    if (row.channel !== "email") continue; // WhatsApp : même file, autre transport — à brancher
    const result = await sendRestockAlertEmail({ email: row.email }, {
      productName: product.name,
      brandName: product.brand?.name ?? null,
      productHref: url(`/produit/${product.slug}`),
      imageHref: product.image ? url(product.image) : null,
      imageAlt: product.name,
      priceLabel: formatDT(product.priceMillimes),
      stock: product.stock,
    });
    if (result.ok) sent++;
  }
  return sent;
}

/* ── 14 & 15 · La suite d'une livraison ──────────────────────────────────── */

/** Jours entre la livraison et chaque lettre. */
export const CARE_DELAY_DAYS = { feedback: 2, care: 10 } as const;

/**
 * Programmer la suite d'une commande livrée.
 *
 * Appelé quand une commande passe à `delivered`. Les deux lignes sont écrites
 * en `onConflictDoNothing` sur (commande, type) : si le statut est rejoué, ou
 * si deux transitions arrivent en même temps, la commande ne reçoit jamais
 * deux fois la même lettre.
 */
export async function scheduleCareFollowUps(orderId: number, deliveredAt: Date = new Date()): Promise<number> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true, status: true, email: true, userId: true },
  });
  if (!order || order.status !== "delivered") return 0;

  const rows = (Object.keys(CARE_DELAY_DAYS) as Array<keyof typeof CARE_DELAY_DAYS>).map((kind) => ({
    orderId,
    userId: order.userId,
    kind,
    dueAt: new Date(deliveredAt.getTime() + CARE_DELAY_DAYS[kind] * 86_400_000),
  }));

  const inserted = await db
    .insert(careFollowUps)
    .values(rows)
    .onConflictDoNothing({ target: [careFollowUps.orderId, careFollowUps.kind] })
    .returning({ id: careFollowUps.id });
  return inserted.length;
}

/**
 * Envoyer les lettres venues à échéance.
 *
 * Rien dans cette application ne tourne en tâche de fond : il faut donc un
 * déclencheur extérieur (`npm run care:followups`, branché sur un
 * ordonnanceur) pour que les échéances soient tenues à l'heure. Cette fonction
 * est idempotente et ne lève jamais — un échec d'envoi laisse la ligne non
 * marquée, donc à renvoyer au prochain passage, plutôt que de la perdre.
 *
 * Renvoie le nombre de lettres réellement parties.
 */
export async function runDueCareFollowUps(now: Date = new Date(), limit = 50): Promise<number> {
  const due = await db
    .select()
    .from(careFollowUps)
    .where(and(isNull(careFollowUps.sentAt), lte(careFollowUps.dueAt, now)))
    .orderBy(careFollowUps.dueAt)
    .limit(limit);

  let sent = 0;
  for (const row of due) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, row.orderId),
      columns: { id: true, number: true, email: true, status: true },
      with: { items: true },
    });
    if (!order) continue;
    // Une commande annulée ou retournée après coup ne doit plus recevoir de
    // « comment se passe votre soin ? » : ce serait une lettre sourde.
    if (order.status !== "delivered") {
      await db.update(careFollowUps).set({ sentAt: now }).where(eq(careFollowUps.id, row.id));
      continue;
    }
    const first = order.items[0];
    const productName = first?.name ?? "votre soin";
    // Les lignes de commande gardent un `productId`, pas un slug : on le
    // retrouve, et sans référence lisible on renvoie vers l'espace compte
    // plutôt que de fabriquer une adresse qui ne mène nulle part.
    const product = first?.productId
      ? await db.query.products.findFirst({ where: eq(products.id, first.productId), columns: { slug: true } })
      : null;
    const productHref = product ? url(`/produit/${product.slug}`) : url("/compte/commandes");
    const reviewHref = product ? url(`/produit/${product.slug}#avis`) : url("/compte/commandes");

    const result =
      row.kind === "feedback"
        ? await sendMail({
            ...withText(careFeedbackEmail({ productName, reviewHref })),
            to: order.email,
            tags: [{ name: "kind", value: "care-feedback" }],
          })
        : await sendMail({
            ...withText(careFollowUpEmail({ productName, productHref })),
            to: order.email,
            tags: [{ name: "kind", value: "care-followup" }],
          });

    if (result.ok) {
      await db.update(careFollowUps).set({ sentAt: new Date() }).where(eq(careFollowUps.id, row.id));
      sent++;
    }
  }
  return sent;
}
