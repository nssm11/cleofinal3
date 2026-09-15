import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/notifications";
import { isNotificationCategory } from "@/lib/notification-meta";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The customer's own notifications — cursor-paginated.
 * Identity comes from the session alone; there is no user id to pass, so
 * no other customer's ledger can be reached.
 */
export async function GET(req: NextRequest) {
  let me = null;
  try {
    me = await getCurrentUser();
  } catch {
    me = null;
  }
  if (!me) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!(await rateLimit(`notif-list:${me.id}`, 60, 60_000))) {
    return NextResponse.json({ error: "slow_down" }, { status: 429 });
  }
  const sp = req.nextUrl.searchParams;
  const rawCategory = sp.get("category");
  const category = rawCategory && isNotificationCategory(rawCategory) ? rawCategory : null;
  const unreadOnly = sp.get("unread") === "1";
  const beforeRaw = Number(sp.get("before"));
  const beforeId = Number.isInteger(beforeRaw) && beforeRaw > 0 ? beforeRaw : null;
  const { items, hasMore } = await listNotifications(me.id, { category, unreadOnly, beforeId });
  return NextResponse.json(
    {
      items: items.map((n) => ({
        id: n.id,
        category: n.category,
        title: n.title,
        body: n.body,
        href: n.href,
        priority: n.priority,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
      })),
      hasMore,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
