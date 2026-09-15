import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailOutbox, users } from "@/db/schema";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";

/**
 * POST /api/brevo/webhook — Brevo's transactional event feed.
 *
 * Brevo posts one JSON object per event (sent, delivered, opened, clicked,
 * bounces, complaint, error…). We correlate it to the outbox row through the
 * provider message id captured at send time, so the ledger shows the whole
 * life of a letter.
 *
 * Brevo does not sign transactional webhooks, so the door is guarded the
 * only way it can be: a shared secret presented as a query token
 * (`?brevo_token=…`) or an `x-brevo-token` header — fail-closed, unset the
 * endpoint refuses everything. Event handling is idempotent: each timestamp
 * is written at most once, so a retried delivery can never double-log.
 */
export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set([
  "sent",
  "delivered",
  "opened",
  "clicked",
  "soft_bounce",
  "hard_bounce",
  "invalid",
  "deferred",
  "complaint",
  "unsubscribed",
  "blocked",
  "error",
]);

const FAILURE_EVENTS = new Set(["soft_bounce", "hard_bounce", "invalid", "blocked", "error"]);

function tokenProvided(req: NextRequest): boolean {
  const secret = env.BREVO_WEBHOOK_SECRET;
  if (!secret) return false;
  const candidates = [
    req.nextUrl.searchParams.get("brevo_token"),
    req.headers.get("x-brevo-token"),
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
  ];
  for (const given of candidates) {
    if (!given) continue;
    if (given.length !== secret.length) continue;
    try {
      if (timingSafeEqual(Buffer.from(given), Buffer.from(secret))) return true;
    } catch {
      /* fall through */
    }
  }
  return false;
}

/** Brevo may send the id with angle brackets — normalise for the lookup. */
function normalizeMessageId(raw: string): string {
  return raw.replace(/[<>\s]/g, "");
}

export async function POST(req: NextRequest) {
  if (!env.BREVO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "webhook not configured (set BREVO_WEBHOOK_SECRET)" }, { status: 400 });
  }
  if (!tokenProvided(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : typeof body.status === "string" ? body.status : "";
  if (!VALID_EVENTS.has(event)) {
    // Unknown shape: acknowledge, ignore — Brevo retries the rest.
    return NextResponse.json({ ok: true, ignored: true });
  }
  const messageIdRaw =
    (typeof body.message_id === "string" && body.message_id) ||
    (typeof body.messageIds === "string" && body.messageIds) ||
    "";
  if (!messageIdRaw) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  const messageId = normalizeMessageId(messageIdRaw);

  const rows = await db
    .select({ id: emailOutbox.id, userId: emailOutbox.userId })
    .from(emailOutbox)
    .where(sql`normalize(${emailOutbox.providerMessageId}) = ${messageId}`)
    .limit(1);
  const row = rows[0];
  if (!row) {
    // A letter we did not send (or a pre-webhook introduction row) —
    // acknowledge and move on, never 5xx the carrier.
    log.info("brevo webhook: unknown message id", { event, messageId });
    return NextResponse.json({ ok: true, known: false });
  }

  const now = new Date().toISOString();
  const stamp: Record<string, string | undefined> = {
    delivered: "deliveredAt",
    opened: "openedAt",
    clicked: "clickedAt",
    soft_bounce: "failedAt",
    hard_bounce: "failedAt",
    invalid: "failedAt",
    blocked: "failedAt",
    error: "failedAt",
  };

  const patch: Record<string, unknown> = {
    // jsonb arrays append with || (array_cat is anyarray-only)
    webhookEvents: sql`(${emailOutbox.webhookEvents}) || ${JSON.stringify([{ event, at: now, detail: typeof body.message === "string" ? body.message.slice(0, 200) : null }])}::jsonb`,
  };
  const col = stamp[event];
  if (col) patch[col] = new Date();
  if (event === "sent") patch.sentAt = new Date();
  if (FAILURE_EVENTS.has(event)) patch.status = "failed";
  if (col || event === "sent") {
    // Only write when absent — a retried webhook must not rewind time.
    const [cur] = await db
      .select({
        sentAt: emailOutbox.sentAt,
        deliveredAt: emailOutbox.deliveredAt,
        openedAt: emailOutbox.openedAt,
        clickedAt: emailOutbox.clickedAt,
        failedAt: emailOutbox.failedAt,
      })
      .from(emailOutbox)
      .where(eq(emailOutbox.id, row.id))
      .limit(1);
    if (cur) {
      if (cur.sentAt) delete patch.sentAt;
      if (cur.deliveredAt) delete patch.deliveredAt;
      if (cur.openedAt) delete patch.openedAt;
      if (cur.clickedAt) delete patch.clickedAt;
      if (cur.failedAt) delete patch.failedAt;
    }
  }
  await db.update(emailOutbox).set(patch).where(eq(emailOutbox.id, row.id));

  // A complaint or unsubscription is a legal un-subscribe: the house stops
  // the marketing letters (transactional letters may still reach the order).
  if (event === "complaint" || event === "unsubscribed") {
    if (row.userId) {
      await db.update(users).set({ emailOptIn: false, updatedAt: new Date() }).where(eq(users.id, row.userId));
    }
    log.warn("brevo webhook: recipient unsubscribed", { event, userId: row.userId });
  }

  return NextResponse.json({ ok: true });
}

/** Brevo validates the endpoint with a plain GET on some panels. */
export async function GET(req: NextRequest) {
  if (!tokenProvided(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  return NextResponse.json({ ok: true, service: "cleopatre email webhook" });
}
