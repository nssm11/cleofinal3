import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { customerSend, isStaff, staffSend } from "@/lib/support/chat";
import { asInt, asString, readJson, staffActivity, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

type AttachmentMeta = { name: string; mime: string; size: number; key: string };

function parseAttachment(v: unknown): AttachmentMeta | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  if (typeof a.name !== "string" || typeof a.mime !== "string" || typeof a.key !== "string" || typeof a.size !== "number") return null;
  return { name: a.name, mime: a.mime, size: a.size, key: a.key };
}

/**
 * One message onto the line. The viewer is the sender — always. A customer
 * can only write into their own conversations (or open a new one); the house
 * writes as itself, or as an internal note that no customer can ever see.
 */
export async function POST(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();

  const b = await readJson(req);
  const body = asString(b.body, 4000).trim();
  if (body.length < 2 || body.length > 2000) {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  const ticketId = asInt(b.ticketId);
  const attachment = parseAttachment(b.attachment);

  try {
    if (isStaff(user)) {
      if (!ticketId) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });
      const res = await staffSend({
        user,
        ticketId,
        body,
        kind: b.kind === "note" ? "note" : "message",
        attachment,
      });
      staffActivity(user);
      return NextResponse.json(res);
    }
    const res = await customerSend({
      user,
      ticketId: ticketId ?? null,
      body,
      subject: asString(b.subject, 200),
      type: asString(b.type, 40) || undefined,
      orderNumber: asString(b.orderNumber, 24) || undefined,
      attachment,
    });
    return NextResponse.json(res);
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json({ error: err.message ?? "error" }, { status: err.status ?? 500 });
  }
}
