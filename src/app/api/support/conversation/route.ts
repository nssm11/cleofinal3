import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff, setPriority, setTicketStatus } from "@/lib/support/chat";
import { asInt, asString, readJson, staffActivity, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

/** Move a conversation's lifecycle state or priority. Staff only, audited. */
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
  if (!ticketId) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });

  try {
    const status = asString(b.status, 16);
    const priority = asString(b.priority, 8);
    if (status && (STATUSES as readonly string[]).includes(status)) {
      await setTicketStatus({ actor: user, ticketId, status: status as (typeof STATUSES)[number] });
    }
    if (priority && (PRIORITIES as readonly string[]).includes(priority)) {
      await setPriority({ actor: user, ticketId, priority: priority as (typeof PRIORITIES)[number] });
    }
    if (!status && !priority) return NextResponse.json({ error: "nothing" }, { status: 400 });
    staffActivity(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message ?? "error" }, { status: err.status ?? 500 });
  }
}
