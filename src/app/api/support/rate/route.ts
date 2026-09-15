import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rateTicket } from "@/lib/support/chat";
import { asInt, readJson, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

/** A customer rates a resolved conversation, once. Stored, never guessed. */
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
  const rating = asInt(b.rating);
  if (!ticketId || !rating) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  try {
    await rateTicket({ user, ticketId, rating });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message ?? "error" }, { status: err.status ?? 500 });
  }
}
