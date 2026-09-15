import "server-only";
import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { loyaltyTransactions, orders, orderItems, subscriptions, supportTickets, ticketMessages, users } from "@/db/schema";
import type { SafeUser } from "@/lib/auth";
import { isStaff, toConversationOut, toMessageOut } from "./chat";
import type { ConversationOut, MessageOut } from "./types";

/**
 * The conciergerie's read models — every list the client and the inbox
 * render, built from committed rows only.
 */

/** Customer's conversations, newest first, with unread counts. */
export async function customerConversations(user: SafeUser, limit = 30): Promise<ConversationOut[]> {
  const rows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, user.id))
    .orderBy(sql`${supportTickets.lastMessageAt} desc nulls last`, desc(supportTickets.id))
    .limit(limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const unreadRows = await db
    .select({ ticketId: ticketMessages.ticketId, n: count() })
    .from(ticketMessages)
    .where(and(inArray(ticketMessages.ticketId, ids), or(isNull(ticketMessages.senderId), sql`${ticketMessages.senderId} <> ${user.id}`), isNull(ticketMessages.readAt), inArray(ticketMessages.kind, ["message", "system"])))
    .groupBy(ticketMessages.ticketId);
  const unread = new Map(unreadRows.map((r) => [r.ticketId, r.n]));
  return rows.map((r) => toConversationOut(r, null, unread.get(r.id) ?? 0));
}

export type InboxFilter = "all" | "waiting" | "mine" | "unread" | "active" | "resolved" | "closed";

/**
 * The team inbox. `q` searches customers, subjects, order numbers and the
 * message threads themselves; every count is a real row, never a guess.
 */
export async function supportInbox(opts: {
  me: SafeUser;
  filter?: InboxFilter;
  priority?: "high" | "urgent" | null;
  q?: string;
  limit?: number;
}): Promise<ConversationOut[]> {
  const { me } = opts;
  const filter: InboxFilter = opts.filter ?? "all";
  const limit = Math.min(opts.limit ?? 60, 100);
  const conditions: ReturnType<typeof sql>[] = [];

  const active = inArray(supportTickets.status, ["open", "in_progress"]);
  switch (filter) {
    case "waiting":
      conditions.push(isNull(supportTickets.assignedSupportId), eq(supportTickets.status, "open"));
      break;
    case "mine":
      conditions.push(eq(supportTickets.assignedSupportId, me.id), active);
      break;
    case "active":
      conditions.push(eq(supportTickets.status, "in_progress"));
      break;
    case "resolved":
      conditions.push(eq(supportTickets.status, "resolved"));
      break;
    case "closed":
      conditions.push(eq(supportTickets.status, "closed"));
      break;
    case "unread":
      conditions.push(active, sql`exists (
        select 1 from ticket_messages m
        where m.ticket_id = support_tickets.id
          and m.sender_id = support_tickets.user_id
          and m.kind = 'message'
          and m.read_at is null
      )`);
      break;
    case "all":
    default:
      conditions.push(sql`${supportTickets.status} <> 'closed'`);
      break;
  }
  if (opts.priority) conditions.push(eq(supportTickets.priority, opts.priority));
  if (opts.q) {
    const q = opts.q.trim().slice(0, 80);
    if (q) {
      conditions.push(
        sql`(
          ${supportTickets.subject} ilike '%' || ${q} || '%'
          or ${supportTickets.name} ilike '%' || ${q} || '%'
          or ${supportTickets.email} ilike '%' || ${q} || '%'
          or ${supportTickets.orderNumber} ilike '%' || ${q} || '%'
          or ${supportTickets.lastMessageBody} ilike '%' || ${q} || '%'
          or exists (select 1 from ticket_messages m where m.ticket_id = support_tickets.id and m.body ilike '%' || ${q} || '%')
        )`,
      );
    }
  }

  const rows = await db
    .select()
    .from(supportTickets)
    .where(and(...conditions))
    .orderBy(sql`${supportTickets.lastMessageAt} desc nulls last`, desc(supportTickets.id))
    .limit(limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [unreadRows, agents] = await Promise.all([
    db
      .select({ ticketId: ticketMessages.ticketId, n: count() })
      .from(ticketMessages)
      .where(and(inArray(ticketMessages.ticketId, ids), sql`ticket_messages.sender_id = (select st2.user_id from support_tickets st2 where st2.id = ticket_messages.ticket_id)`, isNull(ticketMessages.readAt), eq(ticketMessages.kind, "message")))
      .groupBy(ticketMessages.ticketId),
    db.select({ id: users.id, n: sql<string>`${users.firstName} ${users.lastName}` }).from(users).where(eq(users.role, "support")),
  ]);
  const unread = new Map(unreadRows.map((r) => [r.ticketId, r.n]));
  const agentName = new Map(agents.map((a) => [a.id, a.n]));
  return rows.map((r) => toConversationOut(r, r.assignedSupportId != null ? agentName.get(r.assignedSupportId) ?? null : null, unread.get(r.id) ?? 0));
}

/** One page of a thread (newest first). `excludeNotes` keeps internal notes on the staff side only. */
export async function messagePage(args: {
  ticketId: number;
  beforeId?: number;
  limit?: number;
  excludeNotes: boolean;
}): Promise<{ messages: MessageOut[]; hasMore: boolean }> {
  const limit = Math.min(args.limit ?? 40, 60);
  const conditions: ReturnType<typeof sql>[] = [eq(ticketMessages.ticketId, args.ticketId)];
  if (args.beforeId) conditions.push(sql`${ticketMessages.id} < ${args.beforeId}`);
  if (args.excludeNotes) conditions.push(sql`${ticketMessages.kind} <> 'note'`);
  const rows = await db.select().from(ticketMessages).where(and(...conditions)).orderBy(desc(ticketMessages.id)).limit(limit + 1);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  // senderType needs the customer id of the conversation.
  const [t] = await db.select({ userId: supportTickets.userId }).from(supportTickets).where(eq(supportTickets.id, args.ticketId)).limit(1);
  const customerId = t?.userId ?? null;
  return { messages: page.map((m) => toMessageOut(m, customerId)), hasMore };
}

export type TicketContext = {
  ticket: ConversationOut;
  customer: { id: number | null; name: string; email: string; since: string | null; loyaltyPoints: number; orderCount: number; orderTotalMillimes: number; subscription: boolean; conversationCount: number; recentOrders: { id: number; number: string; status: string; totalMillimes: number; createdAt: string }[] };
  order: { id: number; number: string; status: string; paymentStatus: string; totalMillimes: number; createdAt: string; items: { name: string; quantity: number }[] } | null;
};

/** The customer panel: who is on the other side, and their recent business. */
export async function ticketContext(args: { ticketId: number; viewer: SafeUser }): Promise<TicketContext | null> {
  const [t] = await db.select().from(supportTickets).where(eq(supportTickets.id, args.ticketId)).limit(1);
  if (!t) return null;
  if (!isStaff(args.viewer) && t.userId !== args.viewer.id) return null;

  let customer: TicketContext["customer"] = {
    id: null,
    name: t.name,
    email: t.email,
    since: null,
    loyaltyPoints: 0,
    orderCount: 0,
    orderTotalMillimes: 0,
    subscription: false,
    conversationCount: 0,
    recentOrders: [],
  };
  let order: TicketContext["order"] = null;

  if (t.userId != null) {
    const [u] = await db.select().from(users).where(eq(users.id, t.userId)).limit(1);
    if (u) {
      const [stats] = await db
        .select({ n: count(), total: sql<number>`coalesce(sum(${orders.totalMillimes}), 0)::int` })
        .from(orders)
        .where(eq(orders.userId, t.userId));
      const recent = await db
        .select({ id: orders.id, number: orders.number, status: orders.status, totalMillimes: orders.totalMillimes, createdAt: orders.createdAt })
        .from(orders)
        .where(eq(orders.userId, t.userId))
        .orderBy(desc(orders.createdAt))
        .limit(3);
      const [sub] = await db.select({ n: count() }).from(subscriptions).where(and(eq(subscriptions.userId, t.userId), inArray(subscriptions.status, ["active", "paused"]))).limit(1);
      const [convos] = await db.select({ n: count() }).from(supportTickets).where(eq(supportTickets.userId, t.userId)).limit(1);
      customer = {
        id: t.userId,
        name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || t.name,
        email: u.email,
        since: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        loyaltyPoints: u.loyaltyPoints ?? 0,
        orderCount: stats?.n ?? 0,
        orderTotalMillimes: stats?.total ?? 0,
        subscription: (sub?.n ?? 0) > 0,
        conversationCount: (convos?.n ?? 0) > 1 ? (convos?.n ?? 0) - 1 : 0,
        recentOrders: recent.map((o) => ({ id: o.id, number: o.number, status: o.status, totalMillimes: o.totalMillimes, createdAt: new Date(o.createdAt).toISOString() })),
      };
    }
  }

  if (t.orderId != null) {
    const [o] = await db.select().from(orders).where(eq(orders.id, t.orderId)).limit(1);
    if (o) {
      const items = await db.select({ name: orderItems.name, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, o.id));
      order = { id: o.id, number: o.number, status: o.status, paymentStatus: o.paymentStatus, totalMillimes: o.totalMillimes, createdAt: new Date(o.createdAt).toISOString(), items: items.map((i) => ({ name: i.name, quantity: i.quantity })) };
    }
  }

  const [agentRow] = t.assignedSupportId != null ? await db.select({ n: sql<string>`${users.firstName} ${users.lastName}` }).from(users).where(eq(users.id, t.assignedSupportId)).limit(1) : [null];
  const out = toConversationOut(t, agentRow?.n ?? null);
  return { ticket: out, customer, order };
}

export type SupportMetrics = {
  waiting: number;
  active: number;
  mine: number;
  unread: number;
  resolved24h: number;
  open: number;
  avgFirstResponseMin: number | null;
  avgResolutionMin: number | null;
  ratingAvg: number | null;
  team: { id: number; name: string; active: number; mine: number; resolved24h: number; avgFirstResponseMin: number | null }[];
};

/**
 * Live metrics, computed from stored rows only — if a number is not in the
 * database, it is null, not a guess.
 */
export async function supportMetrics(me: SafeUser): Promise<SupportMetrics> {
  const active = inArray(supportTickets.status, ["open", "in_progress"]);
  const dayAgo = sql<Date>`now() - interval '24 hours'`;
  const [waitingR, activeR, mineR, unreadR, resolved24R, openNR] = await Promise.all([
    db.select({ n: count() }).from(supportTickets).where(and(isNull(supportTickets.assignedSupportId), eq(supportTickets.status, "open"))).limit(1),
    db.select({ n: count() }).from(supportTickets).where(active).limit(1),
    db.select({ n: count() }).from(supportTickets).where(and(eq(supportTickets.assignedSupportId, me.id), active)).limit(1),
    db
      .select({ n: count() })
      .from(supportTickets)
      .where(and(active, sql`exists (
        select 1 from ticket_messages m
        where m.ticket_id = support_tickets.id
          and m.sender_id = support_tickets.user_id
          and m.kind = 'message'
          and m.read_at is null
      )`))
      .limit(1),
    db.select({ n: count() }).from(supportTickets).where(and(eq(supportTickets.status, "resolved"), sql`${supportTickets.resolvedAt} > ${dayAgo}`)).limit(1),
    db.select({ n: count() }).from(supportTickets).where(and(active, eq(supportTickets.priority, "urgent"))).limit(1),
  ]);
  const [waiting, activeN, mine, unread, resolved24, openN] = [waitingR, activeR, mineR, unreadR, resolved24R, openNR].map((r) => r[0]);

  // Average first response: ticket created → first house message (30 days).
  const [fr] = await db
    .select({ avg: sql<number>`avg(extract(epoch from (first_reply.at - "support_tickets".created_at)) / 60.0)` })
    .from(supportTickets)
    .innerJoin(
      sql`(select ticket_id, min(created_at) as at from ticket_messages where kind = 'message' and is_bot = false and (sender_id is null or sender_id <> (select user_id from support_tickets st3 where st3.id = ticket_messages.ticket_id)) group by ticket_id) first_reply`,
      sql`${supportTickets.id} = first_reply.ticket_id`,
    )
    .where(sql`${supportTickets.createdAt} > now() - interval '30 days'`)
    .limit(1);
  // Average resolution: created → resolved (30 days).
  const [res] = await db
    .select({ avg: sql<number>`avg(extract(epoch from ("support_tickets".resolved_at - "support_tickets".created_at)) / 60.0)` })
    .from(supportTickets)
    .where(and(eq(supportTickets.status, "resolved"), sql`${supportTickets.createdAt} > now() - interval '30 days'`))
    .limit(1);
  const [rat] = await db.select({ avg: sql<number>`avg(${supportTickets.rating})` }).from(supportTickets).where(sql`${supportTickets.rating} is not null`).limit(1);

  const agents = await db.select().from(users).where(eq(users.role, "support"));
  const team: SupportMetrics["team"] = [];
  for (const a of agents) {
    const [aActive] = await db.select({ n: count() }).from(supportTickets).where(and(eq(supportTickets.assignedSupportId, a.id), active)).limit(1);
    const [aRes] = await db.select({ n: count() }).from(supportTickets).where(and(eq(supportTickets.assignedSupportId, a.id), eq(supportTickets.status, "resolved"), sql`${supportTickets.resolvedAt} > ${dayAgo}`)).limit(1);
    const [aFr] = await db
      .select({ avg: sql<number>`avg(extract(epoch from (first_reply.at - "support_tickets".created_at)) / 60.0)` })
      .from(supportTickets)
      .innerJoin(
        sql`(select ticket_id, min(created_at) as at from ticket_messages m2 where m2.kind = 'message' and m2.is_bot = false and m2.sender_id = ${a.id} group by ticket_id) first_reply`,
        sql`${supportTickets.id} = first_reply.ticket_id`,
      )
      .where(sql`${supportTickets.createdAt} > now() - interval '30 days'`)
      .limit(1);
    team.push({
      id: a.id,
      name: `${a.firstName ?? "Conseiller"} ${a.lastName ?? ""}`.trim(),
      active: aActive?.n ?? 0,
      mine: a.id === me.id ? aActive?.n ?? 0 : 0,
      resolved24h: aRes?.n ?? 0,
      avgFirstResponseMin: aFr?.avg != null ? Math.round(aFr.avg) : null,
    });
  }

  return {
    waiting: waiting?.n ?? 0,
    active: activeN?.n ?? 0,
    mine: mine?.n ?? 0,
    unread: unread?.n ?? 0,
    resolved24h: resolved24?.n ?? 0,
    open: openN?.n ?? 0,
    avgFirstResponseMin: fr?.avg != null ? Math.round(fr.avg) : null,
    avgResolutionMin: res?.avg != null ? Math.round(res.avg) : null,
    ratingAvg: rat?.avg != null ? Math.round(rat.avg * 10) / 10 : null,
    team,
  };
}

/** Recent loyalty movement for the customer panel (last 6). */
export async function recentLoyalty(userId: number) {
  return db
    .select({ points: loyaltyTransactions.points, reason: loyaltyTransactions.reason, createdAt: loyaltyTransactions.createdAt })
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.userId, userId))
    .orderBy(desc(loyaltyTransactions.id))
    .limit(6);
}
