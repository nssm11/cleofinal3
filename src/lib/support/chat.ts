import "server-only";
import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, supportTickets, ticketMessages, users } from "@/db/schema";
import type { SafeUser } from "@/lib/auth";
import { audit } from "@/lib/orders";
import { sendOrQueueEmail } from "@/lib/email/send";
import { sendTicketEmail } from "@/lib/email/triggers";
import { log } from "@/lib/logger";
import { anyAgentOnline, broadcast, ensurePresencePrune } from "./bus";
import type { ConversationOut, MessageKind, MessageOut, Routing } from "./types";

/**
 * THE CONCIERGERIE — domain writes.
 *
 * Every function here is a committed change: it validates the ACTUAL viewer
 * (never a client-supplied identity), writes to the database, then fans the
 * result out on the bus and — when the other party is plausibly away —
 * posts a letter through the existing outbox.
 */

export const HOUSE_NAME = "Cléopâtre Support";
const TICKET_TYPES = ["product_question", "return_request", "exchange", "order", "delivery", "damaged_product", "complaint", "pharmacist_advice", "other"] as const;
const STAFF_ROLES = ["support", "admin"] as const;
/** A reply letter goes out when the customer has been quiet this long (away, not reading live). */
const REPLY_MAIL_QUIET_MS = 30 * 60 * 1000;

export function isStaff(user: Pick<SafeUser, "role">): boolean {
  return (STAFF_ROLES as readonly string[]).includes(user.role);
}

/* ── shapes ──────────────────────────────────────────────────────────── */

type TicketRow = typeof supportTickets.$inferSelect;
type MessageRow = typeof ticketMessages.$inferSelect;

export function toMessageOut(m: MessageRow, customerId: number | null): MessageOut {
  let senderType: MessageOut["senderType"];
  if (m.kind === "system" || m.isBot) senderType = "system";
  else if (m.kind === "note") senderType = "support";
  else if (m.senderId != null && customerId != null && m.senderId === customerId) senderType = "customer";
  else if (m.senderId != null) senderType = "support";
  else senderType = "support";
  return {
    id: m.id,
    ticketId: m.ticketId,
    kind: m.kind as MessageKind,
    senderType,
    senderId: m.senderId,
    senderName: m.authorName,
    body: m.body,
    attachment: m.attachment ?? null,
    status: m.status === "read" ? "read" : "sent",
    readAt: m.readAt ? new Date(m.readAt).toISOString() : null,
    createdAt: new Date(m.createdAt).toISOString(),
  };
}

export function toConversationOut(t: TicketRow, assignedName?: string | null, unread = 0): ConversationOut {
  return {
    id: t.id,
    subject: t.subject,
    status: t.status as ConversationOut["status"],
    priority: t.priority as ConversationOut["priority"],
    type: t.type,
    createdAt: new Date(t.createdAt).toISOString(),
    lastMessageAt: t.lastMessageAt ? new Date(t.lastMessageAt).toISOString() : null,
    lastMessageBody: t.lastMessageBody ?? null,
    lastMessageAuthor: t.lastMessageAuthor ?? null,
    customerId: t.userId,
    customerName: t.name,
    customerEmail: t.email,
    orderId: t.orderId ?? null,
    orderNumber: t.orderNumber ?? null,
    assignedSupportId: t.assignedSupportId,
    assignedSupportName: assignedName ?? null,
    rating: t.rating,
    ratedAt: t.ratedAt ? new Date(t.ratedAt).toISOString() : null,
    unread,
    typingBy: null,
  };
}

/* ── rate limiting (12 messages / minute per user) ───────────────────── */

const gr = globalThis as typeof globalThis & { __cleoSupportRl?: Map<number, { n: number; t: number }> };
const rl = (gr.__cleoSupportRl ??= new Map<number, { n: number; t: number }>());
export function rateLimited(userId: number, max = 12): boolean {
  const t = Date.now();
  const r = rl.get(userId);
  if (!r || t - r.t > 60_000) {
    rl.set(userId, { n: 1, t });
    return false;
  }
  r.n += 1;
  return r.n > max;
}

/* ── small helpers ───────────────────────────────────────────────────── */

async function getTicket(id: number): Promise<TicketRow | null> {
  const [t] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return t ?? null;
}

/**
 * Fetch a ticket the viewer is allowed to see — staff see all, a customer
 * sees only their own. Anything else is a 404, never a 403 that leaks
 * existence.
 */
export async function visibleTicket(user: SafeUser, id: number): Promise<TicketRow | null> {
  const t = await getTicket(id);
  if (!t) return null;
  if (!isStaff(user) && t.userId !== user.id) return null;
  return t;
}

async function activeTicketFor(userId: number): Promise<TicketRow | null> {
  const [t] = await db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.userId, userId), inArray(supportTickets.status, ["open", "in_progress"])))
    .orderBy(desc(supportTickets.lastMessageAt), desc(supportTickets.id))
    .limit(1);
  return t ?? null;
}

function customerNameOf(user: SafeUser): string {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email.split("@")[0] || "Client";
}

function routesFor(kind: MessageKind, ticket: TicketRow): Routing[] {
  if (kind === "note") return [{ to: "staff" }]; // internal — never leaves the team
  const routes: Routing[] = [{ to: "staff" }];
  if (ticket.userId != null) routes.push({ to: "customer", userId: ticket.userId });
  return routes;
}

/** Last customer message on the ticket — for the reply-letter rule. */
async function lastCustomerMessageAt(ticket: TicketRow): Promise<Date | null> {
  if (ticket.userId == null) return null;
  const [r] = await db
    .select({ at: sql<Date>`max(${ticketMessages.createdAt})` })
    .from(ticketMessages)
    .where(and(eq(ticketMessages.ticketId, ticket.id), eq(ticketMessages.senderId, ticket.userId), eq(ticketMessages.kind, "message")))
    .limit(1);
  // PGlite may hand back timestamptz as an ISO string — normalize.
  return r?.at ? new Date(r.at as unknown as string | number | Date) : null;
}

type AttachmentMeta = { name: string; mime: string; size: number; key: string };

/**
 * Trust only attachments the server itself stored: the key must name a file
 * under this ticket (or the `0/` staging folder for brand-new conversations).
 */
async function prepareAttachment(meta: AttachmentMeta | null | undefined, ticketId: number): Promise<AttachmentMeta | null> {
  if (!meta || typeof meta.key !== "string" || !meta.key || meta.key.length > 64) return null;
  if (typeof meta.mime !== "string" || typeof meta.name !== "string") return null;
  if (typeof meta.size !== "number" || meta.size <= 0 || meta.size > 5 * 1024 * 1024) return null;
  const { keyValid, rehomeAttachment } = await import("./attachments");
  if (meta.key.startsWith("0/")) return await rehomeAttachment(meta, ticketId);
  return keyValid(meta.key, ticketId) ? { ...meta, name: meta.name.slice(0, 120) } : null;
}

/** Point the conversation cursor (last_message_*) at the newest message. */
async function refreshCursor(ticketId: number) {
  const [m] = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(desc(ticketMessages.id))
    .limit(1);
  if (!m) return;
  await db
    .update(supportTickets)
    .set({ lastMessageAt: m.createdAt, lastMessageBody: m.body.slice(0, 300), lastMessageAuthor: m.authorName, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
}

async function sendTeamLetter(ticket: TicketRow, preview: string) {
  try {
    const agents = await db
      .select({ id: users.id, email: users.email, name: sql`${users.firstName} ${users.lastName}` })
      .from(users)
      .where(eq(users.role, "support"));
    for (const a of agents) {
      if (!a.email) continue;
      await sendOrQueueEmail({
        kind: "ticket_incoming",
        payload: {
          kind: "ticket_incoming",
          firstName: ticket.name.split(" ")[0] ?? "Client",
          customerName: ticket.name,
          ticketId: ticket.id,
          ticketNumber: `#${String(ticket.id).padStart(5, "0")}`,
          subject: ticket.subject,
          preview: preview.slice(0, 280),
        },
        to: a.email,
        locale: "fr",
        userId: a.id,
      });
    }
  } catch (e) {
    log.warn("support team letter failed", { error: e instanceof Error ? e.message : String(e) });
  }
}

/* ── the conversation ────────────────────────────────────────────────── */

export type SendResult = { ticket: ConversationOut; message: MessageOut; created: boolean; reopened: boolean };

/**
 * Customer → the house. Reuses the customer's active conversation, or opens
 * a new one. `orderNumber` is a CLAIM only — it is honoured when the order
 * actually belongs to this customer, and ignored otherwise.
 */
export async function customerSend(args: {
  user: SafeUser;
  ticketId?: number | null;
  body: string;
  subject?: string;
  type?: string;
  orderNumber?: string;
  attachment?: { name: string; mime: string; size: number; key: string } | null;
}): Promise<SendResult> {
  ensurePresencePrune();
  const { user } = args;
  const body = (args.body ?? "").trim();
  if (body.length < 2 || body.length > 2000) throw Object.assign(new Error("bad_body"), { status: 400 });
  if (rateLimited(user.id)) throw Object.assign(new Error("slow_down"), { status: 429 });

  let ticket = args.ticketId ? await getTicket(args.ticketId) : null;
  if (ticket && ticket.userId !== user.id) throw Object.assign(new Error("not_found"), { status: 404 });

  let reopened = false;
  let created = false;

  if (!ticket) {
    ticket = await activeTicketFor(user.id);
    if (!ticket) {
      // Order context: trust the claim only when the row proves ownership.
      let orderId: number | null = null;
      let orderNumber: string | null = null;
      const claim = (args.orderNumber ?? "").trim().slice(0, 24);
      if (claim) {
        const [o] = await db.select().from(orders).where(and(eq(orders.number, claim), eq(orders.userId, user.id))).limit(1);
        if (o) {
          orderId = o.id;
          orderNumber = o.number;
        }
      }
      const subject = ((args.subject ?? "").trim() || body.slice(0, 80)).slice(0, 200);
      const type = (TICKET_TYPES as readonly string[]).includes(args.type ?? "") ? (args.type as (typeof TICKET_TYPES)[number]) : "other";
      const welcome = anyAgentOnline()
        ? `Bonjour ${user.firstName || "cher client"}, votre message est bien reçu — un membre de l'équipe vous répond dans un instant.`
        : `Bonjour ${user.firstName || "cher client"}, votre message est bien reçu — l'équipe vous répond dès l'ouverture du comptoir.`;
      [ticket] = await db
        .insert(supportTickets)
        .values({
          userId: user.id,
          name: customerNameOf(user),
          email: user.email,
          type,
          priority: "normal",
          subject,
          message: body,
          status: "open",
          orderId,
          orderNumber,
        })
        .returning();
      await db.insert(ticketMessages).values({
        ticketId: ticket.id,
        kind: "system",
        authorName: HOUSE_NAME,
        body: welcome,
        isBot: true,
      });
      if (orderId != null) {
        const [o] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (o)
          await db.insert(ticketMessages).values({
            ticketId: ticket.id,
            kind: "system",
            authorName: HOUSE_NAME,
            body: `Au sujet de la commande ${o.number}`,
            isBot: true,
          });
      }
      created = true;
      if (!anyAgentOnline()) void sendTeamLetter(ticket, body);
    }
  }

  const wasClosed = ticket.status === "resolved" || ticket.status === "closed";
  const [message] = await db
    .insert(ticketMessages)
    .values({
      ticketId: ticket.id,
      userId: user.id,
      senderId: user.id,
      authorName: customerNameOf(user),
      body,
      kind: "message",
      attachment: await prepareAttachment(args.attachment, ticket.id),
      isBot: false,
    })
    .returning();

  if (wasClosed) {
    reopened = true;
    await db.update(supportTickets).set({ status: "in_progress", resolvedAt: null, updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
    await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      kind: "system",
      authorName: HOUSE_NAME,
      body: "Conversation rouverte",
      isBot: true,
    });
    ticket = (await getTicket(ticket.id))!;
  }

  await refreshCursor(ticket.id);
  const fresh = (await getTicket(ticket.id))!;
  const msgOut = toMessageOut(message, fresh.userId);
  const ticketOut = toConversationOut(fresh);
  broadcast(routesFor("message", fresh), { type: "message", message: msgOut, ticket: ticketOut });
  return { ticket: ticketOut, message: msgOut, created, reopened };
}

/**
 * The house → the customer (or an internal note between staff).
 * `kind: "note"` is internal: it is stored, it reaches the team in realtime,
 * and it is invisible to the customer by construction.
 */
export async function staffSend(args: {
  user: SafeUser;
  ticketId: number;
  body: string;
  kind?: "message" | "note";
  attachment?: { name: string; mime: string; size: number; key: string } | null;
}): Promise<SendResult> {
  ensurePresencePrune();
  const { user } = args;
  if (!isStaff(user)) throw Object.assign(new Error("forbidden"), { status: 403 });
  const kind: "message" | "note" = args.kind === "note" ? "note" : "message";
  const body = (args.body ?? "").trim();
  if (body.length < 1 || body.length > 4000) throw Object.assign(new Error("bad_body"), { status: 400 });
  if (rateLimited(user.id)) throw Object.assign(new Error("slow_down"), { status: 429 });

  const ticket = await getTicket(args.ticketId);
  if (!ticket) throw Object.assign(new Error("not_found"), { status: 404 });

  const agentName = `${user.firstName ?? "Conseiller"} ${user.lastName ?? ""}`.trim();
  const [message] = await db
    .insert(ticketMessages)
    .values({
      ticketId: ticket.id,
      senderId: user.id,
      authorName: kind === "note" ? `${agentName} (note interne)` : HOUSE_NAME,
      body,
      kind,
      attachment: kind === "note" ? null : (await prepareAttachment(args.attachment, ticket.id)),
      isBot: false,
    })
    .returning();

  let reopened = false;
  if (kind === "message") {
    if (ticket.status === "open") {
      await db.update(supportTickets).set({ status: "in_progress", updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
    }
    await refreshCursor(ticket.id);
    // A reply letter, but only when the customer is plausibly away.
    if (ticket.userId != null) {
      const lastCust = await lastCustomerMessageAt(ticket);
      if (lastCust && Date.now() - lastCust.getTime() > REPLY_MAIL_QUIET_MS) {
        void sendTicketEmail(ticket, "ticket_reply", body);
      }
    }
  }

  const fresh = (await getTicket(ticket.id))!;
  const msgOut = toMessageOut(message, fresh.userId);
  const ticketOut = toConversationOut(fresh);
  broadcast(routesFor(kind, fresh), { type: "message", message: msgOut, ticket: ticketOut });
  return { ticket: ticketOut, message: msgOut, created: false, reopened };
}

/* ── reads, typing, presence ─────────────────────────────────────────── */

export async function markRead(args: { user: SafeUser; ticketId: number; upToId: number }) {
  ensurePresencePrune();
  const { user } = args;
  const ticket = await getTicket(args.ticketId);
  if (!ticket) throw Object.assign(new Error("not_found"), { status: 404 });
  if (!isStaff(user) && ticket.userId !== user.id) throw Object.assign(new Error("not_found"), { status: 404 });
  const upTo = Math.max(0, args.upToId | 0);
  const nowD = new Date();

  if (isStaff(user)) {
    if (ticket.userId != null) {
      await db
        .update(ticketMessages)
        .set({ readAt: nowD, status: "read" })
        .where(and(eq(ticketMessages.ticketId, ticket.id), sql`${ticketMessages.id} <= ${upTo}`, eq(ticketMessages.senderId, ticket.userId), inArray(ticketMessages.kind, ["message", "system"])));
    }
    await db.update(supportTickets).set({ supportReadAt: nowD, updatedAt: nowD }).where(eq(supportTickets.id, ticket.id));
    if (ticket.userId != null) broadcast([{ to: "customer", userId: ticket.userId }], { type: "read", ticketId: ticket.id, who: "support", upToId: upTo, at: nowD.toISOString() });
  } else {
    await db
      .update(ticketMessages)
      .set({ readAt: nowD, status: "read" })
      .where(and(eq(ticketMessages.ticketId, ticket.id), sql`${ticketMessages.id} <= ${upTo}`, or(isNull(ticketMessages.senderId), ne(ticketMessages.senderId, user.id)), inArray(ticketMessages.kind, ["message", "system"])));
    await db.update(supportTickets).set({ customerReadAt: nowD, readAt: nowD, updatedAt: nowD }).where(eq(supportTickets.id, ticket.id));
    broadcast([{ to: "staff" }], { type: "read", ticketId: ticket.id, who: "customer", upToId: upTo, at: nowD.toISOString() });
  }
}

export async function markTyping(args: { user: SafeUser; ticketId: number }) {
  ensurePresencePrune();
  const { user } = args;
  const ticket = await getTicket(args.ticketId);
  if (!ticket) throw Object.assign(new Error("not_found"), { status: 404 });
  if (!isStaff(user) && ticket.userId !== user.id) throw Object.assign(new Error("not_found"), { status: 404 });
  const who = isStaff(user) ? "support" : "customer";
  const name = isStaff(user) ? `${user.firstName ?? "Conseiller"} ${user.lastName ?? ""}`.trim() : customerNameOf(user);
  if (who === "customer") broadcast([{ to: "staff" }], { type: "typing", ticketId: ticket.id, who, name });
  else {
    const routes: Routing[] = [{ to: "staff" }];
    if (ticket.userId != null) routes.push({ to: "customer", userId: ticket.userId });
    broadcast(routes, { type: "typing", ticketId: ticket.id, who, name });
  }
}

/* ── management (staff only) ─────────────────────────────────────────── */

export async function assignTicket(args: { actor: SafeUser; ticketId: number; supportId: number | null }) {
  if (!isStaff(args.actor)) throw Object.assign(new Error("forbidden"), { status: 403 });
  const ticket = await getTicket(args.ticketId);
  if (!ticket) throw Object.assign(new Error("not_found"), { status: 404 });
  let supportId: number | null = args.supportId;
  if (supportId != null) {
    const [a] = await db.select().from(users).where(eq(users.id, supportId)).limit(1);
    if (!a || a.role !== "support") throw Object.assign(new Error("bad_agent"), { status: 400 });
  }
  const from = ticket.assignedSupportId;
  await db.update(supportTickets).set({ assignedSupportId: supportId, updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
  const [toName] = supportId != null ? await db.select({ n: sql<string>`${users.firstName} ${users.lastName}` }).from(users).where(eq(users.id, supportId)).limit(1) : [null];
  await audit(args.actor.id, "support.assign", "support_ticket", ticket.id, { from, to: supportId, by: args.actor.email });
  const fresh = (await getTicket(ticket.id))!;
  broadcast([{ to: "staff" }], { type: "conversation", ticket: toConversationOut(fresh, toName?.n ?? null) });
}

export async function setTicketStatus(args: { actor: SafeUser; ticketId: number; status: "open" | "in_progress" | "resolved" | "closed" }) {
  if (!isStaff(args.actor)) throw Object.assign(new Error("forbidden"), { status: 403 });
  const ticket = await getTicket(args.ticketId);
  if (!ticket) throw Object.assign(new Error("not_found"), { status: 404 });
  const next = args.status;
  if (ticket.status === next) return;
  await db
    .update(supportTickets)
    .set({ status: next, resolvedAt: next === "resolved" ? new Date() : null, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticket.id));
  await audit(args.actor.id, "support.status", "support_ticket", ticket.id, { from: ticket.status, to: next, by: args.actor.email });
  if (next === "resolved" && ticket.userId != null) void sendTicketEmail(ticket, "ticket_resolved");
  const fresh = (await getTicket(ticket.id))!;
  broadcast([{ to: "staff" }], { type: "conversation", ticket: toConversationOut(fresh) });
  if (ticket.userId != null) broadcast([{ to: "customer", userId: ticket.userId }], { type: "conversation", ticket: toConversationOut(fresh) });
}

export async function setPriority(args: { actor: SafeUser; ticketId: number; priority: "low" | "normal" | "high" | "urgent" }) {
  if (!isStaff(args.actor)) throw Object.assign(new Error("forbidden"), { status: 403 });
  const ticket = await getTicket(args.ticketId);
  if (!ticket) throw Object.assign(new Error("not_found"), { status: 404 });
  if (ticket.priority === args.priority) return;
  await db.update(supportTickets).set({ priority: args.priority, updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
  await audit(args.actor.id, "support.priority", "support_ticket", ticket.id, { from: ticket.priority, to: args.priority, by: args.actor.email });
  const fresh = (await getTicket(ticket.id))!;
  broadcast([{ to: "staff" }], { type: "conversation", ticket: toConversationOut(fresh) });
}

export async function rateTicket(args: { user: SafeUser; ticketId: number; rating: number }) {
  const { user } = args;
  const rating = args.rating;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw Object.assign(new Error("bad_rating"), { status: 400 });
  const ticket = await getTicket(args.ticketId);
  if (!ticket || ticket.userId !== user.id) throw Object.assign(new Error("not_found"), { status: 404 });
  if (ticket.status !== "resolved" && ticket.status !== "closed") throw Object.assign(new Error("not_rated_yet"), { status: 400 });
  if (ticket.ratedAt) throw Object.assign(new Error("already_rated"), { status: 400 });
  await db.update(supportTickets).set({ rating, ratedAt: new Date(), updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
  const fresh = (await getTicket(ticket.id))!;
  broadcast([{ to: "staff" }], { type: "conversation", ticket: toConversationOut(fresh) });
}
