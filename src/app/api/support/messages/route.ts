import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff, visibleTicket } from "@/lib/support/chat";
import { messagePage } from "@/lib/support/queries";
import { asInt, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

/**
 * A page of a thread, newest first. A customer can only pull their own
 * threads, and internal notes are filtered out server-side — they are never
 * shipped to a customer regardless of what the client asks for.
 */
export async function GET(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();
  const p = req.nextUrl.searchParams;
  const ticketId = asInt(p.get("ticketId"));
  if (!ticketId) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });

  const ticket = await visibleTicket(user, ticketId);
  if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const beforeId = asInt(p.get("beforeId"));
  const limit = asInt(p.get("limit")) ?? 40;
  const { messages, hasMore } = await messagePage({
    ticketId,
    beforeId: beforeId ?? undefined,
    limit,
    excludeNotes: !isStaff(user),
  });
  return NextResponse.json({ messages, hasMore });
}
