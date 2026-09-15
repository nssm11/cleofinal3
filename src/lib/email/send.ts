import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, lte, sql } from "drizzle-orm";
import { renderAsync } from "@react-email/render";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";
import { emailSubject, renderEmailElement, type EmailKind, type EmailPayload } from "./registry";
import { emailLocale } from "./theme";
import { log } from "@/lib/logger";
import { brevoConfig, sendBrevoEmail } from "./brevo";

/**
 * THE POSTAL ROOM.
 *
 * Nothing calls the provider directly — everything goes through the outbox
 * table, which is also the ledger: `pending` rows with a future `sendAt` are
 * the delayed letters (care sequences, restock priority waves, ritual
 * reminders), and every send marks its row `sent` or `failed`. The carrier is
 * Brevo (./brevo); without BREVO_API_KEY the house keeps its mail inside —
 * the rendered letter is written to `.emails/` and logged, which is exactly
 * what development wants.
 *
 * Delivery telemetry comes back through /api/brevo/webhook and is written on
 * the same row: sent → delivered → opened / clicked / bounced, keyed by the
 * provider message id captured at send time.
 */

async function renderLetter(kind: EmailKind, payload: EmailPayload, locale: string) {
  const el = emailLocale(locale);
  const subject = emailSubject(kind, payload as unknown as Record<string, unknown>, locale);
  const html = await renderAsync(renderEmailElement(kind, payload, el), { pretty: false });
  return { subject, html };
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Cléopâtre <bonjour@cleopatre.tn>";

/**
 * Hand the rendered letter to the courier. Returns the provider message id
 * when one exists — the webhook correlates every later event on it.
 */
async function transmit(args: {
  rowId: number;
  kind: string;
  subject: string;
  html: string;
  to: string;
  toName?: string | null;
}): Promise<{ ok: boolean; error?: string; messageId?: string | null }> {
  if (brevoConfig()) {
    const res = await sendBrevoEmail({
      to: args.to,
      toName: args.toName,
      subject: args.subject,
      html: args.html,
      idempotencyKey: `outbox-${args.rowId}`,
      tags: [args.kind],
    });
    return res.ok
      ? { ok: true, messageId: res.messageId }
      : { ok: false, error: res.error };
  }
  // Dev fallback: the letter is "posted" to the filesystem.
  try {
    const dir = join(process.cwd(), ".emails");
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${Date.now()}-${args.to.replace(/[^a-z0-9]/gi, "_")}.html`);
    await writeFile(file, args.html, "utf8");
    log.info("email dev delivery", { to: args.to, subject: args.subject, file });
  } catch (e) {
    log.warn("email dev file write failed", { error: e instanceof Error ? e.message : String(e) });
  }
  return { ok: true, messageId: null };
}

/**
 * Send a letter whose content cannot be re-derived from the ledger — the
 * OTP letter, whose code lives only in this call. The stored payload holds
 * the OTP row id, never the code; the pre-rendered `html` is the only copy.
 * A failure is terminal: retrying could not recover the secret, so the row
 * is marked failed and the customer re-requests a new code.
 */
export async function sendImmediateEmail(args: {
  kind: EmailKind;
  payload: EmailPayload;
  to: string;
  toName?: string | null;
  locale: string;
  html: string;
  userId?: number | null;
}): Promise<number> {
  const [row] = await db
    .insert(emailOutbox)
    .values({
      kind: args.kind,
      to: args.to,
      userId: args.userId ?? null,
      locale: args.locale,
      subject: emailSubject(args.kind, args.payload as unknown as Record<string, unknown>, args.locale),
      payload: args.payload as unknown as Record<string, unknown>,
      sendAt: new Date(),
      status: "pending",
    })
    .returning();
  await db.update(emailOutbox).set({ attempts: 1 }).where(eq(emailOutbox.id, row.id));
  const res = await transmit({
    rowId: row.id,
    kind: row.kind,
    subject: row.subject,
    html: args.html,
    to: row.to,
    toName: args.toName ?? null,
  });
  if (res.ok) {
    await db
      .update(emailOutbox)
      .set({ status: "sent", sentAt: new Date(), error: null, ...(res.messageId ? { providerMessageId: res.messageId } : {}) })
      .where(eq(emailOutbox.id, row.id));
  } else {
    await db.update(emailOutbox).set({ status: "failed", error: res.error ?? "send error" }).where(eq(emailOutbox.id, row.id));
    log.warn("immediate email failed (terminal — secret not re-derivable)", { id: row.id, kind: row.kind, error: res.error });
  }
  return row.id;
}

/** Insert into the outbox and dispatch now when it is due (fire-and-forget safe). */
export async function sendOrQueueEmail(args: {
  kind: EmailKind;
  payload: EmailPayload;
  to: string;
  locale: string;
  userId?: number | null;
  sendAt?: Date;
}) {
  const [row] = await db
    .insert(emailOutbox)
    .values({
      kind: args.kind,
      to: args.to,
      userId: args.userId ?? null,
      locale: args.locale,
      subject: emailSubject(args.kind, args.payload as unknown as Record<string, unknown>, args.locale),
      payload: args.payload as unknown as Record<string, unknown>,
      sendAt: args.sendAt ?? new Date(),
      status: "pending",
    })
    .returning();
  if (!args.sendAt || args.sendAt <= new Date()) await flushRow(row.id).catch(() => undefined);
  return row.id;
}

async function flushRow(id: number) {
  const [row] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id)).limit(1);
  if (!row || row.status !== "pending") return;
  await dispatchRow(row);
}

async function dispatchRow(row: typeof emailOutbox.$inferSelect) {
  // The OTP letter is sent exactly once, with its in-memory code. A pending
  // row reaching the queue means the immediate send never ran: the code
  // cannot be re-derived, so the letter is abandoned (the customer re-asks).
  if (row.kind === "email_otp") {
    await db
      .update(emailOutbox)
      .set({ status: "failed", error: "OTP not sent immediately — code no longer available, please re-request." })
      .where(eq(emailOutbox.id, row.id));
    return;
  }
  await db.update(emailOutbox).set({ attempts: sql`${emailOutbox.attempts} + 1` }).where(eq(emailOutbox.id, row.id));
  try {
    const { html } = await renderLetter(row.kind as EmailKind, row.payload as EmailPayload, row.locale);
    const toName = (row.payload as Record<string, unknown>).firstName as string | undefined;
    const res = await transmit({
      rowId: row.id,
      kind: row.kind,
      subject: row.subject,
      html,
      to: row.to,
      toName: toName ?? null,
    });
    if (res.ok) {
      await db
        .update(emailOutbox)
        .set({ status: "sent", sentAt: new Date(), error: null, ...(res.messageId ? { providerMessageId: res.messageId } : {}) })
        .where(eq(emailOutbox.id, row.id));
    } else {
      await db.update(emailOutbox).set({ status: "failed", error: res.error ?? "send error" }).where(eq(emailOutbox.id, row.id));
    }
  } catch (e) {
    // A malformed payload (e.g. an old row after a template change) must not
    // wedge the queue forever: give up loudly after 4 attempts.
    const giveUp = row.attempts >= 4;
    await db
      .update(emailOutbox)
      .set({ status: giveUp ? "failed" : "pending", error: e instanceof Error ? e.message : String(e) })
      .where(eq(emailOutbox.id, row.id));
    log.warn("email dispatch failed", { id: row.id, kind: row.kind, error: e instanceof Error ? e.message : String(e) });
  }
}

/** Called by the cron route and after insertions that are already due. */
export async function flushOutbox(limit = 30) {
  const due = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(and(eq(emailOutbox.status, "pending"), lte(emailOutbox.sendAt, new Date())))
    .orderBy(emailOutbox.sendAt)
    .limit(limit);
  let sent = 0;
  for (const { id } of due) {
    await flushRow(id);
    sent++;
  }
  return { processed: sent };
}

/** Render a letter to HTML without sending — the admin preview & the .eml dump. */
export async function renderEmailPreview(kind: EmailKind, payload: EmailPayload, locale: string) {
  const subject = emailSubject(kind, payload as unknown as Record<string, unknown>, locale);
  const html = await renderAsync(renderEmailElement(kind, payload, emailLocale(locale)), { pretty: false });
  return { subject, html };
}
