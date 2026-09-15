"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { fail, MESSAGES, ok, type ActionResult } from "@/lib/api";
import { checkOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";
import { isNotificationCategory } from "@/lib/notification-meta";

/**
 * Reads are the only customer-writable side of notifications — and even they
 * are scoped: the user id always comes from the session, never the client,
 * and the UPDATE carries it in the WHERE clause.
 */
export async function markNotificationReadAction(id: number): Promise<ActionResult> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  if (!(await rateLimit(`notif-read:${me.id}`, 60, 60_000))) return fail(MESSAGES.rateLimited);
  await markNotificationRead(me.id, Math.floor(Number(id)));
  revalidatePath("/compte/notifications");
  return ok(undefined);
}

export async function markAllNotificationsReadAction(category?: string): Promise<ActionResult<{ read: number }>> {
  if (!(await checkOrigin())) return fail(MESSAGES.badOrigin);
  const me = await getCurrentUser();
  if (!me) return fail(MESSAGES.unauthorized);
  if (!(await rateLimit(`notif-read:${me.id}`, 60, 60_000))) return fail(MESSAGES.rateLimited);
  if (typeof category === "string" && category.length > 0 && !isNotificationCategory(category)) return fail(MESSAGES.invalid);
  const read = await markAllNotificationsRead(me.id, typeof category === "string" ? category : null);
  revalidatePath("/compte/notifications");
  return ok({ read });
}
