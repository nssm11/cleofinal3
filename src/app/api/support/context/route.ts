import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/support/chat";
import { ticketContext } from "@/lib/support/queries";
import { asInt, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

/** The customer panel: who is on the other side + their recent business. Staff only. */
export async function GET(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ticketId = asInt(req.nextUrl.searchParams.get("ticketId"));
  if (!ticketId) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });
  const ctx = await ticketContext({ ticketId, viewer: user });
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(ctx);
}
