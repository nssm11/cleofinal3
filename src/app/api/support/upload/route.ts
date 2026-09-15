import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff, visibleTicket } from "@/lib/support/chat";
import { attachmentError, saveAttachment } from "@/lib/support/attachments";
import { unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

/**
 * Store one attachment for a conversation. `ticketId` is the real id, or
 * "new" when a customer is opening a brand-new conversation (the file is
 * staged under `0/` and moved into place when the ticket is created).
 * Type and size are validated here, at the door.
 */
export async function POST(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });

  const ticketRaw = String(form.get("ticketId") ?? "new").trim();
  let ticketId = 0;
  if (ticketRaw === "new") {
    ticketId = 0;
  } else {
    const id = Number(ticketRaw);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad_ticket" }, { status: 400 });
    const t = await visibleTicket(user, id);
    if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
    ticketId = id;
  }

  try {
    const meta = await saveAttachment(file, ticketId);
    return NextResponse.json({ attachment: meta });
  } catch (e) {
    if (attachmentError(e)) {
      const status = e === "too_big" ? 413 : 400;
      return NextResponse.json({ error: e }, { status });
    }
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }
}
