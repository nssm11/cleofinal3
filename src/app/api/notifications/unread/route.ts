import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unreadCountByCategory, unreadNotificationCount } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** The badge number — and its per-shelf split for the center's filters. */
export async function GET() {
  let me = null;
  try {
    me = await getCurrentUser();
  } catch {
    me = null;
  }
  if (!me) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!(await rateLimit(`notif-unread:${me.id}`, 120, 60_000))) {
    return NextResponse.json({ error: "slow_down" }, { status: 429 });
  }
  const [total, byCategory] = await Promise.all([unreadNotificationCount(me.id), unreadCountByCategory(me.id)]);
  return NextResponse.json({ total, byCategory }, { headers: { "Cache-Control": "private, no-store" } });
}
