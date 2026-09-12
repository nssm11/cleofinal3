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

/**
 * THE POSTAL ROOM.
 *
 * Nothing calls Resend directly — everything goes through the outbox table,
 * which is also the ledger: `pending` rows with a future `sendAt` are the
 * delayed letters (care sequences, restock priority waves, ritual reminders),
 * and every send marks its row `sent` or `failed`. Without RESEND_API_KEY the
 * house keeps its mail inside: the rendered letter is written to `.emails/`
 * and logged, which is exactly what development wants.
 */

async function renderLetter(kind: EmailKind, payload: EmailPayload, locale: string) {
  const el = emailLocale(locale);
  const subject = emailSubject(kind, payload as unknown as Record<string, unknown>, locale);
  const html = await renderAsync(renderEmailElement(kind, payload, el), { pretty: false });
  return { subject, html };
}

let resendModule: Awaited<typeof import("resend")> | null = null;
async function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendModule) resendModule = await import("resend");
  return new resendModule.Resend(key);
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Cléopâtre <bonjour@cleopatre.tn>";

async function transmit(subject: string, html: string, to: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getResend();
  if (client) {
    try {
      const { error } = await client.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        replyTo: process.env.EMAIL_REPLY_TO ?? "bonjour@cleopatre.tn",
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "resend error" };
    }
  }
  // Dev fallback: the letter is "posted" to the filesystem.
  try {
    const dir = join(process.cwd(), ".emails");
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${Date.now()}-${to.replace(/[^a-z0-9]/gi, "_")}.html`);
    await writeFile(file, html, "utf8");
    log.info("email dev delivery", { to, subject, file });
  } catch (e) {
    log.warn("email dev file write failed", { error: e instanceof Error ? e.message : String(e) });
  }
  return { ok: true };
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
  await db.update(emailOutbox).set({ attempts: sql`${emailOutbox.attempts} + 1` }).where(eq(emailOutbox.id, row.id));
  try {
    const { html } = await renderLetter(row.kind as EmailKind, row.payload as EmailPayload, row.locale);
    const res = await transmit(row.subject, html, row.to);
    if (res.ok) {
      await db.update(emailOutbox).set({ status: "sent", sentAt: new Date(), error: null }).where(eq(emailOutbox.id, row.id));
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
