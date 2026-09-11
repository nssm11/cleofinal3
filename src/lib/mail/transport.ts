import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, MAIL_CONFIGURED } from "@/lib/env";
import { log } from "@/lib/logger";

/**
 * LE COURRIER — one door out, and it never blocks the shop.
 *
 * With `RESEND_API_KEY` set, mail goes to Resend over their REST API (a plain
 * `fetch`, so no SDK and no extra dependency). Without it, the message is
 * written to `.mail/` instead — which keeps development, tests and a first
 * deployment working, and gives the templates somewhere to be looked at.
 *
 * Every path swallows its own failure: a customer must never lose an order
 * because an e-mail provider had a bad minute. The order is the transaction;
 * the message is a courtesy.
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Resend tags — useful for filtering and for open/click reports. */
  tags?: { name: string; value: string }[];
};

export type MailResult = { ok: boolean; via: "resend" | "sink"; id?: string; error?: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function toSink(m: MailMessage): Promise<MailResult> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  // Statically scoped on purpose: Turbopack traces `process.cwd()` inside a
  // computed path as "the whole project" and refuses to build. The literal
  // `.mail` segment keeps the trace inside one folder.
  const dir = path.join(process.cwd(), ".mail", env.MAIL_SINK_DIR);
  await mkdir(dir, { recursive: true });
  const base = path.join(dir, `${stamp}-${slugify(m.subject)}`);
  await writeFile(`${base}.html`, m.html, "utf8");
  await writeFile(
    `${base}.json`,
    `${JSON.stringify({ to: m.to, subject: m.subject, from: env.MAIL_FROM, tags: m.tags ?? [], text: m.text ?? "" }, null, 2)}\n`,
    "utf8",
  );
  return { ok: true, via: "sink", id: path.basename(base) };
}

async function toResend(m: MailMessage): Promise<MailResult> {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [m.to],
      reply_to: env.MAIL_REPLY_TO,
      subject: m.subject,
      html: m.html,
      text: m.text,
      headers: { "X-Entity-Ref-ID": slugify(m.subject) },
      ...(m.tags?.length ? { tags: m.tags } : {}),
    }),
    // A hung provider must never hold a server action open.
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, via: "resend", error: `HTTP ${res.status} ${body.slice(0, 300)}` };
  }
  const json = (await res.json().catch(() => null)) as { id?: string } | null;
  return { ok: true, via: "resend", id: json?.id };
}

/**
 * Send one message. Never throws.
 *
 * `await`-ing this is safe: the caller is a server action that has already
 * committed the change the e-mail describes.
 */
export async function sendMail(m: MailMessage): Promise<MailResult> {
  if (!m.to || !m.subject) return { ok: false, via: "sink", error: "destinataire ou objet manquant" };
  try {
    if (!MAIL_CONFIGURED) return await toSink(m);
    const r = await toResend(m);
    if (!r.ok) log.warn("[mail] Resend refused the message, falling back to the local sink", { to: m.to, error: r.error });
    // A refused message is still worth keeping: the sink is the paper trail.
    return r.ok ? r : await toSink(m);
  } catch (e) {
    log.warn("[mail] sending failed, falling back to the local sink", { to: m.to, error: String(e) });
    try {
      return await toSink(m);
    } catch {
      return { ok: false, via: "sink", error: String(e) };
    }
  }
}

/** Fire-and-forget, for places where the action must not wait on the network. */
export function queueMail(m: MailMessage): void {
  void sendMail(m).then((r) => {
    if (!r.ok) log.warn("[mail] queued message could not be delivered", { to: m.to, error: r.error });
  });
}
