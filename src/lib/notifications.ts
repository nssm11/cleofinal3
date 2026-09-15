import "server-only";
import { EventEmitter } from "node:events";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, type Notification } from "@/db/schema";
import { log } from "@/lib/logger";
import {
  isNotificationCategory,
  isNotificationPriority,
  isSafeNotificationHref,
  type NotificationCategory,
  type NotificationPriority,
} from "@/lib/notification-meta";

/**
 * THE HOUSE WORD — the centralized customer notification ledger.
 *
 * Every customer-facing event worth surfacing (order movements, payments,
 * loyalty, restock, support replies, subscriptions, security…) is written
 * here by trusted server-side code — never by a client. Callers pass a
 * `dedupeKey` so retried transitions notify once, and an `href` that must
 * stay inside the house (relative paths only, enforced below).
 *
 * Realtime reuses the project's architecture: an in-process EventEmitter the
 * SSE stream (`/api/notifications/stream`) subscribes to — the same shape as
 * the concierge line. The database stays the authority; the line only syncs.
 */

export type { NotificationCategory, NotificationPriority };
export type { Notification };

/* ── Realtime line ─────────────────────────────────────────────────────── */

const g = globalThis as typeof globalThis & { __cleoNotifyBus?: EventEmitter };
const bus: EventEmitter = (g.__cleoNotifyBus ??= new EventEmitter());
bus.setMaxListeners(200);
export const NOTIFY_EVENT = "notify" as const;

export type NotifyFrame = {
  type: "notification";
  notification: {
    id: number;
    category: string;
    title: string;
    body: string | null;
    href: string | null;
    priority: string;
    createdAt: string;
  };
};

function broadcast(userId: number, n: Notification) {
  try {
    const frame: NotifyFrame = {
      type: "notification",
      notification: {
        id: n.id,
        category: n.category,
        title: n.title,
        body: n.body,
        href: n.href,
        priority: n.priority,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
      },
    };
    bus.emit(NOTIFY_EVENT, { userId, frame });
  } catch (e) {
    log.warn("notify broadcast failed", { error: e instanceof Error ? e.message : String(e) });
  }
}

export function onNotify(listener: (userId: number, frame: NotifyFrame) => void) {
  const wrapped = (evt: { userId: number; frame: NotifyFrame }) => listener(evt.userId, evt.frame);
  bus.on(NOTIFY_EVENT, wrapped);
  return () => {
    bus.off(NOTIFY_EVENT, wrapped);
  };
}

/* ── Writing — trusted server events only ─────────────────────────────── */

export type NotifyInput = {
  userId: number;
  category: string;
  title: string;
  body?: string | null;
  href?: string | null;
  priority?: string;
  /** Idempotency per customer: `order:412:shipped`, `loyalty:88:award`… */
  dedupeKey?: string | null;
};

/**
 * Write one notification and fan it to the customer's live tabs.
 * Never throws — a notification must never break the flow that earned it
 * (order transitions, payments, loyalty…). Failures are logged, not raised.
 */
export async function notify(input: NotifyInput): Promise<Notification | null> {
  try {
    const userId = Math.floor(Number(input.userId));
    if (!Number.isInteger(userId) || userId <= 0) return null;
    const category: NotificationCategory = isNotificationCategory(input.category) ? input.category : "account";
    const priority: NotificationPriority = isNotificationPriority(input.priority) ? input.priority : "normal";
    const title = String(input.title ?? "").trim().slice(0, 160);
    if (!title) return null;
    const body = input.body != null ? String(input.body).trim().slice(0, 400) || null : null;
    const href = isSafeNotificationHref(input.href) ? input.href : null;
    const dedupeKey = input.dedupeKey != null ? String(input.dedupeKey).trim().slice(0, 128) || null : null;

    const [row] = await db
      .insert(notifications)
      .values({ userId, category, title, body, href, priority, dedupeKey })
      .onConflictDoNothing()
      .returning();
    if (!row) return null; // a retried event — already told
    broadcast(userId, row);
    return row;
  } catch (e) {
    log.warn("notify failed", { error: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

/* ── Reading — always scoped to the session owner ─────────────────────── */

export const NOTIFICATION_PAGE_SIZE = 20;

export type ListNotificationsArgs = {
  category?: string | null;
  unreadOnly?: boolean;
  /** Cursor: return rows strictly older than this id. */
  beforeId?: number | null;
  limit?: number;
};

export async function listNotifications(
  userId: number,
  args: ListNotificationsArgs = {},
): Promise<{ items: Notification[]; hasMore: boolean }> {
  const limit = Math.min(Math.max(Math.floor(args.limit ?? NOTIFICATION_PAGE_SIZE), 1), 50);
  const conds = [eq(notifications.userId, userId)];
  if (args.category && isNotificationCategory(args.category)) conds.push(eq(notifications.category, args.category));
  if (args.unreadOnly) conds.push(isNull(notifications.readAt));
  if (args.beforeId && Number.isInteger(args.beforeId) && args.beforeId > 0) conds.push(lt(notifications.id, args.beforeId));
  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conds))
    .orderBy(desc(notifications.id))
    .limit(limit + 1);
  return { items: rows.slice(0, limit), hasMore: rows.length > limit };
}

export async function unreadNotificationCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function unreadCountByCategory(userId: number): Promise<Record<string, number>> {
  const rows = await db
    .select({ category: notifications.category, n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .groupBy(notifications.category);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.category] = r.n;
  return out;
}

/* ── Reads — ownership enforced in the WHERE, never trusted ────────────── */

export async function markNotificationRead(userId: number, id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) return false;
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return updated.length > 0;
}

export async function markAllNotificationsRead(userId: number, category?: string | null): Promise<number> {
  const conds = [eq(notifications.userId, userId), isNull(notifications.readAt)];
  if (category && isNotificationCategory(category)) conds.push(eq(notifications.category, category));
  const updated = await db.update(notifications).set({ readAt: new Date() }).where(and(...conds)).returning({ id: notifications.id });
  return updated.length;
}
