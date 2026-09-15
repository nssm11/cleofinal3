import { promises as fsp } from "node:fs";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff, visibleTicket } from "@/lib/support/chat";
import { resolveAttachment } from "@/lib/support/attachments";
import { unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

const NO_SNIFF = { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" };

/**
 * Deliver a stored attachment — but only to someone who may see it. A
 * customer gets their own conversation's files; staff get any. The file
 * must physically live under the attachments root, and it is served with
 * its true content type and nosniff, never with a guessed executable one.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ ticketId: string; file: string }> },
) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();

  const { ticketId: rawId, file } = await ctx.params;
  const ticketId = Number(rawId);
  if (!Number.isInteger(ticketId) || ticketId <= 0) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });

  const ticket = await visibleTicket(user, ticketId);
  if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const resolved = await resolveAttachment(ticketId, file);
  if (!resolved) return NextResponse.json({ error: "bad_key" }, { status: 400 });
  try {
    const st = await fsp.stat(resolved.path);
    if (!st.isFile()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Attachments are capped at 5 MB — a buffer keeps the route simple.
  const buf = await fsp.readFile(resolved.path);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": resolved.mime, ...NO_SNIFF } });
}
