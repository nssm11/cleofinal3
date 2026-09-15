"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  diagnostics,
  orders,
  restockAlerts,
  rituals,
  products,
  subscriptionEvents,
  subscriptionItems,
  subscriptions,
  supportTickets,
  ticketMessages,
  users,
  wishlistShares,
  wishlistItems,
} from "@/db/schema";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { fail, MESSAGES, ok, type ActionResult } from "@/lib/api";
import { clientKey, checkOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { audit, track } from "@/lib/orders";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { sendSubscriptionCancelledEmail, sendTicketEmail } from "@/lib/email/triggers";
import { sendOrQueueEmail } from "@/lib/email/send";

/* helpers ───────────────────────────────────────────────────────────────── */
async function currentLocale() {
  const jar = await cookies();
  const c = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const me = await getCurrentUser();
  return me?.locale ?? "fr";
}

const isStaffHour = () => {
  // Africa/Tunis is UTC+1 year-round — no DST to chase.
  const now = new Date();
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Tunis",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = t.find((x) => x.type === "weekday")?.value ?? "Mon";
  const hour = Number(t.find((x) => x.type === "hour")?.value ?? "0");
  const dayOk = weekday !== "Sun";
  return dayOk && hour >= 9 && hour < 20;
};

/* ══ 1 · Diagnostic ═══════════════════════════════════════════════════════ */

const quizSchema = z.object({
  skin: z.enum(["dry", "oily", "mixed", "sensitive", "normal"]),
  concern: z.string().min(2).max(60),
  hair: z.string().min(2).max(60),
  texture: z.enum(["light", "rich", "oil", "any"]),
  budget: z.enum(["s", "m", "l", "xl"]),
});

export async function saveDiagnosticAction(input: { answers: unknown; productIds: number[] }): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  const parsed = quizSchema.safeParse(input.answers);
  if (!parsed.success) return fail(MESSAGES.invalid);
  const ids = (input.productIds ?? []).filter((n) => Number.isInteger(n) && n > 0).slice(0, 12);
  await db.insert(diagnostics).values({ userId: me.id, answers: parsed.data as unknown as Record<string, string | string[]>, productIds: ids });
  await track("diagnostic.saved", {}, me.id);
  revalidatePath("/compte");
  return ok(undefined);
}

/** Compute the quiz's curated shelf on demand (client answers → server picks). */
export async function getRecommendationsAction(answers: unknown): Promise<
  ActionResult<
    | {
        id: number;
        slug: string;
        name: string;
        brandName: string | null;
        shortDescription: string | null;
        priceMillimes: number;
        compareAtMillimes: number | null;
        image: string | null;
        stock: number;
        volume: string | null;
        why: string;
      }[]
  >
> {
  const parsed = quizSchema.safeParse(answers);
  if (!parsed.success) return fail(MESSAGES.invalid);
  const locale = await currentLocale();
  const { recommendForQuiz } = await import("@/lib/experience");
  const picks = await recommendForQuiz(parsed.data, locale);
  return ok(picks.map(({ score, ...p }) => p));
}

/** Live product search for the ritual & subscription builders (id + caption). */
export async function searchCatalogAction(q: string): Promise<
  ActionResult<{ id: number; slug: string; name: string; brandName: string | null; priceMillimes: number; image: string | null; stock: number }[]>
> {
  const query = (q ?? "").trim().slice(0, 60);
  if (query.length < 2) return ok([]);
  const { quickSearch } = await import("@/lib/catalog");
  const rows = await quickSearch(query, 8);
  return ok(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      brandName: r.brandName,
      priceMillimes: r.priceMillimes,
      image: r.image,
      stock: r.stock,
    })),
  );
}

/* ══ 2 · Mon Rituel ════════════════════════════════════════════════════════ */

const ritualItemsSchema = z.array(z.object({ productId: z.number().int().positive(), note: z.string().max(200).optional() })).max(12);
const ritualSchema = z.object({
  name: z.string().trim().min(2).max(120),
  moment: z.enum(["morning", "evening"]),
  season: z.string().trim().max(40).optional(),
  items: ritualItemsSchema,
  reminderEnabled: z.boolean(),
  reminderHour: z.number().int().min(5).max(23),
  reminderDays: z.number().int().min(1).max(127),
});

export async function saveRitualAction(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult<{ id: number }>> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  let items: unknown[] = [];
  try {
    items = JSON.parse(String(form.get("items") || "[]"));
  } catch {
    return fail(MESSAGES.invalid, { items: "Items JSON invalide." });
  }
  const parsed = ritualSchema.safeParse({
    name: form.get("name"),
    moment: form.get("moment") || "morning",
    season: String(form.get("season") || "").trim() || undefined,
    items,
    reminderEnabled: form.get("reminderEnabled") === "on",
    reminderHour: Number(form.get("reminderHour") || 8),
    reminderDays: Number(form.get("reminderDays") || 127),
  });
  if (!parsed.success) return fail(MESSAGES.invalid);
  // Keep only real, visible products, in the submitted order.
  const ids = parsed.data.items.map((i) => i.productId);
  const known = ids.length
    ? await db.select({ id: products.id }).from(products).where(and(inArray(products.id, ids), eq(products.status, "active")))
    : [];
  const valid = new Set(known.map((k) => Number(k.id)));
  const itemsClean = parsed.data.items.filter((i) => valid.has(i.productId));
  const id = Number(form.get("id") || 0);
  if (id) {
    const [r] = await db
      .update(rituals)
      .set({
        name: parsed.data.name,
        moment: parsed.data.moment,
        season: parsed.data.season ?? null,
        items: itemsClean,
        reminderEnabled: parsed.data.reminderEnabled,
        reminderHour: parsed.data.reminderHour,
        reminderDays: parsed.data.reminderDays,
        updatedAt: new Date(),
      })
      .where(and(eq(rituals.id, id), eq(rituals.userId, me.id)))
      .returning({ id: rituals.id });
    if (!r) return fail(MESSAGES.notFound);
    revalidatePath("/compte/rituels");
    return ok({ id: r.id });
  }
  const [r] = await db
    .insert(rituals)
    .values({
      userId: me.id,
      name: parsed.data.name,
      moment: parsed.data.moment,
      season: parsed.data.season ?? null,
      items: itemsClean,
      reminderEnabled: parsed.data.reminderEnabled,
      reminderHour: parsed.data.reminderHour,
      reminderDays: parsed.data.reminderDays,
    })
    .returning({ id: rituals.id });
  revalidatePath("/compte/rituels");
  return ok({ id: r.id });
}

export async function deleteRitualAction(id: number): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  await db.delete(rituals).where(and(eq(rituals.id, id), eq(rituals.userId, me.id)));
  revalidatePath("/compte/rituels");
  return ok(undefined);
}

/* ══ 3 · Restock alerts ═══════════════════════════════════════════════════ */

const emailSchema = z.string().trim().toLowerCase().email();

export async function subscribeRestockAction(input: { productId: number; email: string; channel?: "email" | "whatsapp" }): Promise<ActionResult<{ created: boolean }>> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  if (!(await rateLimit(`restock:${await clientKey()}`, 6, 600_000))) return fail(MESSAGES.rateLimited);
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return fail(MESSAGES.invalid, { email: "Adresse e-mail invalide." });
  const known = await db.select({ id: products.id, stock: products.stock }).from(products).where(eq(products.id, input.productId)).limit(1);
  if (!known.length) return fail(MESSAGES.notFound);
  if (known[0].stock > 0) return ok({ created: false }, "in-stock");
  const me = await getCurrentUser();
  const locale = await currentLocale();
  const [row] = await db
    .insert(restockAlerts)
    .values({
      productId: input.productId,
      email: parsed.data,
      userId: me?.id ?? null,
      channel: input.channel === "whatsapp" ? "whatsapp" : "email",
      locale,
    })
    .onConflictDoNothing()
    .returning({ id: restockAlerts.id });
  if (!row) return ok({ created: false }, "already");
  await audit(me?.id ?? null, "restock.subscribe", "product", input.productId);
  return ok({ created: true });
}

export async function unsubscribeRestockAction(productId: number): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  await db.delete(restockAlerts).where(and(eq(restockAlerts.productId, productId), eq(restockAlerts.userId, me.id)));
  revalidatePath("/produit");
  return ok(undefined);
}

/* ══ 4 · Wishlist sharing & gift ══════════════════════════════════════════ */

export async function createWishlistShareAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult<{ token: string }>> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const label = String(form.get("label") || "").trim().slice(0, 120) || "Ma liste Cléopâtre";
  const message = String(form.get("message") || "").trim().slice(0, 400) || null;
  const token = randomBytes(24).toString("base64url");
  await db.insert(wishlistShares).values({ userId: me.id, token, label, message });
  revalidatePath("/compte/favoris");
  return ok({ token });
}

export async function revokeWishlistShareAction(id: number): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  await db.update(wishlistShares).set({ revokedAt: new Date() }).where(and(eq(wishlistShares.id, id), eq(wishlistShares.userId, me.id)));
  revalidatePath("/compte/favoris");
  return ok(undefined);
}

export async function setWishNoteAction(productId: number, note: string): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const clean = note.trim().slice(0, 200);
  if (!clean) {
    await db.update(wishlistItems).set({ note: null }).where(and(eq(wishlistItems.userId, me.id), eq(wishlistItems.productId, productId)));
  } else {
    await db.update(wishlistItems).set({ note: clean }).where(and(eq(wishlistItems.userId, me.id), eq(wishlistItems.productId, productId)));
  }
  revalidatePath("/compte/favoris");
  return ok(undefined);
}

/* ══ 5 · Subscriptions ════════════════════════════════════════════════════ */

const freqSchema = z.number().int().refine((v) => [21, 30, 45, 60, 90].includes(v));

export async function createSubscriptionAction(input: { productIds: number[]; frequencyDays: number }): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const ids = [...new Set((input.productIds ?? []).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 8);
  const freq = freqSchema.safeParse(input.frequencyDays);
  if (!ids.length) return fail(MESSAGES.invalid, { products: "empty" });
  if (!freq.success) return fail(MESSAGES.invalid, { frequencyDays: "invalid" });
  const real = await db.select({ id: products.id }).from(products).where(and(inArray(products.id, ids), eq(products.status, "active"))).limit(ids.length);
  if (real.length !== ids.length) return fail(MESSAGES.invalid);
  const nextDue = new Date(Date.now() + freq.data * 86_400_000);
  const [sub] = await db
    .insert(subscriptions)
    .values({ userId: me.id, frequencyDays: freq.data, nextDueAt: nextDue, status: "active" })
    .returning({ id: subscriptions.id });
  await db.insert(subscriptionItems).values(ids.map((id) => ({ subscriptionId: sub.id, productId: id, quantity: 1 })));
  await db.insert(subscriptionEvents).values({ subscriptionId: sub.id, type: "created", detail: `${ids.length} référence(s), ${freq.data} jours` });
  await audit(me.id, "subscription.create", "subscription", sub.id);
  revalidatePath("/compte/abonnement");
  return ok(undefined, `sub-${sub.id}`);
}

async function ownSubscription(me: { id: number }, id: number) {
  return db.query.subscriptions.findFirst({ where: and(eq(subscriptions.id, id), eq(subscriptions.userId, me.id)) });
}

export async function setSubscriptionStatusAction(id: number, status: "paused" | "active" | "cancelled"): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const s = await ownSubscription(me, id);
  if (!s) return fail(MESSAGES.notFound);
  if (status === "active" && s.status === "cancelled") return fail("Cet abonnement est terminé — composez-en un nouveau.");
  await db.update(subscriptions).set({ status, updatedAt: new Date() }).where(eq(subscriptions.id, id));
  await db.insert(subscriptionEvents).values({ subscriptionId: id, type: status === "active" ? "resumed" : status, detail: null });
  // The quiet closure — the customer must hear the end from the house.
  if (status === "cancelled") void sendSubscriptionCancelledEmail(me.id, id);
  revalidatePath("/compte/abonnement");
  return ok(undefined);
}

export async function skipNextDeliveryAction(id: number): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const s = await ownSubscription(me, id);
  if (!s) return fail(MESSAGES.notFound);
  const next = new Date(s.nextDueAt.getTime() + s.frequencyDays * 86_400_000);
  await db.update(subscriptions).set({ nextDueAt: next, updatedAt: new Date() }).where(eq(subscriptions.id, id));
  await db.insert(subscriptionEvents).values({ subscriptionId: id, type: "skipped", detail: "Prochain envoi passé par la cliente" });
  revalidatePath("/compte/abonnement");
  return ok(undefined);
}

export async function setSubscriptionFrequencyAction(id: number, frequencyDays: number): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const s = await ownSubscription(me, id);
  if (!s) return fail(MESSAGES.notFound);
  const freq = freqSchema.safeParse(frequencyDays);
  if (!freq.success) return fail(MESSAGES.invalid);
  const next = new Date(Date.now() + freq.data * 86_400_000);
  await db.update(subscriptions).set({ frequencyDays: freq.data, nextDueAt: next, updatedAt: new Date() }).where(eq(subscriptions.id, id));
  await db.insert(subscriptionEvents).values({ subscriptionId: id, type: "swapped", detail: `Cadence → ${freq.data} jours` });
  revalidatePath("/compte/abonnement");
  return ok(undefined);
}

export async function swapSubscriptionItemAction(subscriptionId: number, fromProductId: number, toProductId: number): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const s = await ownSubscription(me, subscriptionId);
  if (!s) return fail(MESSAGES.notFound);
  const target = await db.select({ id: products.id }).from(products).where(and(eq(products.id, toProductId), eq(products.status, "active"))).limit(1);
  if (!target.length) return fail(MESSAGES.invalid);
  await db
    .update(subscriptionItems)
    .set({ productId: toProductId })
    .where(and(eq(subscriptionItems.subscriptionId, subscriptionId), eq(subscriptionItems.productId, fromProductId)));
  await db.insert(subscriptionEvents).values({ subscriptionId, type: "swapped", detail: `Référence échangée ${fromProductId} → ${toProductId}` });
  revalidatePath("/compte/abonnement");
  return ok(undefined);
}

/* ══ 6 · « J'ai un problème » — order-linked ticket ═══════════════════════ */

export async function createOrderIssueTicketAction(input: { orderNumber: string; email?: string; message: string; locale: string }): Promise<ActionResult<{ number: string }>> {
  if (!(await rateLimit(`order-ticket:${await clientKey()}`, 4, 600_000))) return fail(MESSAGES.rateLimited);
  if ((input.message ?? "").trim().length < 10) return fail(MESSAGES.invalid, { message: "too-short" });
  const me = await getCurrentUser();
  const order = await db.query.orders.findFirst({ where: eq(orders.number, input.orderNumber.trim().toUpperCase()) });
  if (!order) return fail(MESSAGES.notFound);
  // Ownership: either the signed-in owner, or the guest who proved the e-mail.
  const email = (me?.email ?? input.email ?? "").toLowerCase();
  const owns = me ? order.userId === me.id : order.email.toLowerCase() === email;
  if (!owns) return fail(MESSAGES.forbidden);
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId: me?.id ?? null,
      email: order.email,
      name: me ? `${me.firstName} ${me.lastName}` : order.shippingAddress.fullName,
      type: "order",
      priority: "high",
      subject: `Commande ${order.number} — problème signalé depuis le suivi`,
      message: input.message.trim().slice(0, 2000),
      orderNumber: order.number,
      status: "open",
    })
    .returning();
  await db.insert(ticketMessages).values({
    ticketId: ticket.id,
    userId: me?.id ?? null,
    authorName: ticket.name,
    body: input.message.trim().slice(0, 2000),
    isBot: false,
  });
  void sendTicketEmail(ticket, "ticket_created");
  await audit(me?.id ?? null, "ticket.from-tracking", "order", order.number);
  const number = `#${String(ticket.id).padStart(5, "0")}`;
  revalidatePath("/admin/support");
  return ok({ number }, number);
}

/* ══ 7 · Concierge chat ═══════════════════════════════════════════════════ */

const BOT_ANSWERS: { re: RegExp; fr: string; tn: string }[] = [
  {
    re: /commande|statut|cammand|kamand/i,
    fr: "Pour suivre votre commande, rendez-vous sur la page « Suivre ma commande » : numéro + e-mail suffisent. Elle passe en « Expédiée » le jour même si vous commandez avant 14 h.",
    tn: "Bech tetbe3 commande mte3ek: 3la page « Suivre ma commande », numéro + e-mail kafhin. Ki techri 9bel 14h, tetb3ath nafs ennehâr.",
  },
  {
    re: /livraison|d[ée]lai|wessel|liwsoun|delai/i,
    fr: "Livraison 24–72 h partout en Tunisie, offerte dès 99 DT ; retrait en boutique sous 2 h à Ezzahra ou Hammam-Lif.",
    tn: "El livraison 24–72 sâ3a fi kol Toûns, behda men 99 DT; men el boutique fi 2 sâ3ât.",
  },
  {
    re: /retour|rembours|redde|stegja/i,
    fr: "Les produits non ouverts se retournent sous 7 jours ; les produits ouverts ne sont pas repris pour des raisons d'hygiène, sauf défaut — dans ce cas, nous remplaçons.",
    tn: "Les produits mouch miftou7in yetreddoû fi 7 youm; el miftou7 mouch mechkoul ken fi 3ib — fel 3ib nebaddloû.",
  },
  {
    re: /promo|code|reduc|remise|kad/i,
    fr: "Les codes du moment sont sur la page Promotions : BIENVENUE10 (−10 % première commande), SOLAIRE15, LIVRAISON (livraison offerte dès 40 DT).",
    tn: "El codes fi page Promotions: BIENVENUE10 (−10 % el awwel commande), SOLAIRE15, LIVRAISON.",
  },
  {
    re: /ouvert|horaire|s3a|heure|wa9t/i,
    fr: "Le comptoir est ouvert du lundi au samedi, 8 h 30 – 20 h 30 (Ezzahra) et 8 h 30 – 20 h (Hammam-Lif). Dimanche 9 h – 14 h.",
    tn: "El comptoir meftou7 el ethnin-es-sabt 8h30-20h30, el ḥammâm-lif 8h30-20h. El ḥad 9h-14h.",
  },
];

function botAnswer(text: string, locale: string): string {
  const isTn = locale !== "fr";
  const hit = BOT_ANSWERS.find((b) => b.re.test(text));
  if (hit) return isTn ? hit.tn : hit.fr;
  return isTn
    ? "El question testahel jawâb mte3 3ârfa — el pharmasienne tjaweblek ghda men 8h30. Tenjem t7allî message hna wel yewsselhoum lina bel awweliya."
    : "Votre question mérite une réponse de pharmacienne — nos conseillères vous répondent dès 8 h 30 demain. Votre message leur est déjà transmis en priorité.";
}

export async function sendConciergeMessageAction(input: { text: string; ticketId?: number | null }): Promise<ActionResult<{ ticketId: number; ticketNumber: string; open: boolean; botReply?: string }>> {
  const me = await getCurrentUser();
  const text = (input.text ?? "").trim().slice(0, 2000);
  if (text.length < 3) return fail(MESSAGES.invalid, { text: "too-short" });
  if (!(await rateLimit(`chat:${me?.id ?? (await clientKey())}`, 20, 600_000))) return fail(MESSAGES.rateLimited);
  const locale = await currentLocale();
  let ticketId = input.ticketId ?? null;
  let ticketNumber = "";
  let ticketForMail: { id: number; email: string; name: string; subject: string; userId: number | null } | null = null;

  if (!ticketId) {
    const [t] = await db
      .insert(supportTickets)
      .values({
        userId: me?.id ?? null,
        email: me?.email ?? "",
        name: me ? `${me.firstName} ${me.lastName}` : "Visiteur du site",
        type: "other",
        priority: "normal",
        subject: "Conciergerie — question en direct",
        message: text,
        status: "open",
      })
      .returning();
    ticketId = t.id;
    ticketNumber = `#${String(t.id).padStart(5, "0")}`;
    ticketForMail = t;
  } else {
    const t = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) });
    if (!t) return fail(MESSAGES.notFound);
    ticketId = t.id;
    ticketNumber = `#${String(t.id).padStart(5, "0")}`;
    // Guests continue a thread only via its id being in their client state.
  }

  await db.insert(ticketMessages).values({
    ticketId,
    userId: me?.id ?? null,
    authorName: me ? `${me.firstName} ${me.lastName}` : "Visiteur",
    body: text,
    isBot: false,
  });

  const open = isStaffHour();
  let botReply: string | undefined;
  if (!open) {
    botReply = botAnswer(text, locale);
    await db.insert(ticketMessages).values({
      ticketId,
      userId: null,
      authorName: locale !== "fr" ? "Sâmes el leyl" : "Le veilleur de nuit",
      body: botReply,
      isBot: true,
    });
  }
  if (ticketForMail && !open) void sendTicketEmail(ticketForMail, "ticket_created");
  await audit(me?.id ?? null, "chat.message", "ticket", ticketId, { open });
  return ok({ ticketId, ticketNumber, open, botReply });
}

/** Customer continues one of their own tickets (the thread stays open). */
export async function replyOwnTicketAction(input: { ticketId: number; text: string }): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const text = (input.text ?? "").trim().slice(0, 2000);
  if (text.length < 3) return fail(MESSAGES.invalid, { text: "short" });
  const t = await db.query.supportTickets.findFirst({ where: and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, me.id)) });
  if (!t) return fail(MESSAGES.notFound);
  await db.insert(ticketMessages).values({ ticketId: t.id, userId: me.id, authorName: `${me.firstName} ${me.lastName}`, body: text, isBot: false });
  await db.update(supportTickets).set({ status: "open", message: t.message ? `${t.message}\n\n— relancé : ${text.slice(0, 200)}` : text, updatedAt: new Date() }).where(eq(supportTickets.id, t.id));
  revalidatePath("/compte/support");
  revalidatePath("/admin/support");
  return ok(undefined);
}

/** Poll: any staff reply since the client's cursor. */
export async function getConciergeRepliesAction(ticketId: number, sinceId: number): Promise<ActionResult<{ id: number; body: string; authorName: string; isBot: boolean; at: string }[]>> {
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  const t = await db.query.supportTickets.findFirst({ where: eq(supportTickets.id, ticketId) });
  if (!t || (t.userId && t.userId !== me.id)) return fail(MESSAGES.forbidden);
  const rows = await db
    .select()
    .from(ticketMessages)
    .where(and(eq(ticketMessages.ticketId, ticketId), sql`${ticketMessages.id} > ${sinceId}`, sql`(${ticketMessages.userId} IS NULL OR ${ticketMessages.userId} <> ${me.id})`))
    .orderBy(ticketMessages.id)
    .limit(10);
  return ok(
    rows.map((m) => ({ id: m.id, body: m.body, authorName: m.authorName, isBot: m.isBot, at: m.createdAt.toISOString() })),
  );
}

/* ══ 8 · VIP / birthday ═══════════════════════════════════════════════════ */

export async function saveBirthDateAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  const raw = String(form.get("birthDate") || "").trim();
  if (!raw) {
    await db.update(users).set({ birthDate: null }).where(eq(users.id, me.id));
    revalidatePath("/compte/fidelite");
    return ok(undefined);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900) return fail(MESSAGES.invalid, { birthDate: "Date invalide." });
  await db.update(users).set({ birthDate: d }).where(eq(users.id, me.id));
  // The gift itself is granted by the daily round on the day — nothing to fake here.
  revalidatePath("/compte/fidelite");
  return ok(undefined);
}

/* ══ 9 · Care opt-in on profile ══════════════════════════════════════════ */

export async function setEmailOptInAction(on: boolean): Promise<ActionResult> {
  const me = await requireUser().catch(() => null);
  if (!me) return fail(MESSAGES.unauthorized);
  await db.update(users).set({ emailOptIn: on }).where(eq(users.id, me.id));
  revalidatePath("/compte/profil");
  return ok(undefined);
}

