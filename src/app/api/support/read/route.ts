import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markRead } from "@/lib/support/chat";
import { asInt, readJson, staffActivity, unauthorised } from "@/lib/support/api";
import { isStaff } from "@/lib/support/chat";

export const dynamic = "force-dynamic";

/** A read is a real, persisted acknowledgement — it moves ✓ to ✓✓ (read). */
export async function POST(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();
  const b = await readJson(req);
  const ticketId = asInt(b.ticketId);
  const upToId = asInt(b.upToId);
  if (!ticketId || !upToId) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  try {
    await markRead({ user, ticketId, upToId });
    if (isStaff(user)) staffActivity(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { status?: number };
    return NextResponse.json({ error: "error" }, { status: err.status ?? 500 });
  }
}
