import "server-only";

/**
 * THE COURIER — the thin, single door to Brevo.
 *
 * Only this file knows the provider. Application code asks `transmit`
 * (in ./send) to send a letter; whether the letter leaves by Brevo or is
 * posted to the local `.emails/` folder is a configuration detail.
 *
 * The API key lives server-side only. The SDK is imported lazily so a
 * machine without a key never loads it.
 */

export type BrevoConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  replyTo: string;
};

export function brevoConfig(): BrevoConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    senderEmail: process.env.BREVO_SENDER_EMAIL || "bonjour@cleopatre.tn",
    senderName: process.env.BREVO_SENDER_NAME || "Cléopâtre",
    replyTo: process.env.BREVO_REPLY_TO || "bonjour@cleopatre.tn",
  };
}

let brevoModule: Awaited<typeof import("@getbrevo/brevo")> | null = null;
async function getBrevo() {
  if (!brevoModule) brevoModule = await import("@getbrevo/brevo");
  return brevoModule;
}

export type BrevoSendArgs = {
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  text?: string;
  /** Deterministic key — Brevo uses it to dedupe an identical retried send. */
  idempotencyKey?: string | null;
  tags?: string[];
};

export type BrevoSendResult = { ok: true; messageId: string | null } | { ok: false; error: string };

/**
 * Send one rendered letter through Brevo's transactional API.
 *
 * `htmlContent` is rendered in-house (React Email) — Brevo is the carrier,
 * not the template host: the design lives in this repository, versioned and
 * reviewed with the rest of the house.
 */
export async function sendBrevoEmail(args: BrevoSendArgs): Promise<BrevoSendResult> {
  const cfg = brevoConfig();
  if (!cfg) return { ok: false, error: "BREVO_API_KEY is not configured" };
  try {
    const { BrevoClient } = await getBrevo();
    const client = new BrevoClient({ apiKey: cfg.apiKey });
    const res = await client.transactionalEmails.sendTransacEmail({
      to: [{ email: args.to, ...(args.toName ? { name: args.toName } : {}) }],
      sender: { email: cfg.senderEmail, name: cfg.senderName },
      subject: args.subject,
      htmlContent: args.html,
      ...(args.text ? { textContent: args.text } : {}),
      replyTo: { email: cfg.replyTo },
      tags: ["cleopatre", ...(args.tags ?? [])],
      ...(args.idempotencyKey ? { headers: { "Idempotency-Key": args.idempotencyKey } } : {}),
    });
    return { ok: true, messageId: res.messageId ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message.slice(0, 500) };
  }
}

/** True when a real key is configured (the admin health panel reads this). */
export function brevoEnabled(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}
