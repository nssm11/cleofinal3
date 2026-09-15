import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assignTicket, isStaff } from "@/lib/support/chat";
import { asInt, readJson, staffActivity, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

/** Assign / reassign / unassign a conversation. Staff only, audited. */
export async function POST(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await readJson(req);
  const ticketId = asInt(b.ticketId);
  const supportId = asInt(b.supportId);
  if (!ticketId) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });
  try {
    await assignTicket({ actor: user, ticketId, supportId: supportId ?? null });
    staffActivity(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message ?? "error" }, { status: err.status ?? 500 });
  }
}
