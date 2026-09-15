import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { randomInt, createHash } from "node:crypto";
import { db } from "@/db";
import { emailOtps, users } from "@/db/schema";

/**
 * The six-digit key of the house — signup e-mail verification.
 *
 * Discipline, identical to password resets:
 *  - the code is generated with a CSPRNG and stored ONLY as its SHA-256 hash
 *    — a database leak can never be replayed as a valid code;
 *  - a code is single-use (consumed), short-lived (10 minutes) and bounded
 *    in attempts (5), after which the row is burned;
 *  - re-issuing supersedes: the previous live code is consumed immediately,
 *    with a 60-second cooldown and a per-hour cap against spam loops.
 *
 * The plaintext code is returned ONCE, in memory, to the caller that sends
 * the letter. It is never logged and never written to the outbox payload —
 * the ledger holds only the OTP row id (`otpId`), and the template resolves
 * a codeless row as an honest « no longer valid » letter.
 */

export const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_ISSUES_PER_HOUR = 5;

function codeHash(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export type FreshOtp = { otpId: number; code: string };
export type IssueError = "cooldown" | "limit" | "missing_user" | "already_verified";

/**
 * Generate and store a fresh code; the previous live one (same purpose) is
 * superseded in the same operation.
 */
export async function issueOtp(userId: number, purpose: "signup" = "signup"): Promise<FreshOtp | { error: IssueError }> {
  const [u] = await db.select({ id: users.id, verified: users.emailVerifiedAt }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return { error: "missing_user" };
  if (u.verified) return { error: "already_verified" };

  const now = Date.now();
  const last = await db
    .select({ id: emailOtps.id, consumedAt: emailOtps.consumedAt, createdAt: emailOtps.createdAt })
    .from(emailOtps)
    .where(and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose)))
    .orderBy(sql`${emailOtps.id} desc`)
    .limit(1);
  const lastRow = last[0];
  if (lastRow) {
    if (now - new Date(lastRow.createdAt).getTime() < RESEND_COOLDOWN_MS) return { error: "cooldown" };
    const hourCount = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(emailOtps)
      .where(and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose), sql`${emailOtps.createdAt} > now() - interval '1 hour'`))
      .limit(1);
    if ((hourCount[0]?.n ?? 0) >= MAX_ISSUES_PER_HOUR) return { error: "limit" };
    if (!lastRow.consumedAt) {
      await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, lastRow.id));
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const [row] = await db
    .insert(emailOtps)
    .values({ userId, purpose, codeHash: codeHash(code), expiresAt: new Date(now + OTP_TTL_MS) })
    .returning({ id: emailOtps.id });
  return { otpId: row.id, code };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "wrong" | "too_many" };

/**
 * Check a 6-digit code against the newest live OTP of the user. Wrong codes
 * count as attempts; five strikes burn the row (a re-send is the only way
 * back in). The plaintext code is compared in memory and never persisted.
 */
export async function verifyOtp(userId: number, rawCode: string, purpose: "signup" = "signup"): Promise<VerifyResult> {
  const code = (rawCode ?? "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "wrong" };

  const rows = await db
    .select()
    .from(emailOtps)
    .where(and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose), isNull(emailOtps.consumedAt)))
    .orderBy(sql`${emailOtps.id} desc`)
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, reason: "not_found" };
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, row.id));
    return { ok: false, reason: "expired" };
  }
  if (row.codeHash !== codeHash(code)) {
    const attempts = row.failedAttempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.update(emailOtps).set({ consumedAt: new Date(), failedAttempts: attempts }).where(eq(emailOtps.id, row.id));
      return { ok: false, reason: "too_many" };
    }
    await db.update(emailOtps).set({ failedAttempts: attempts }).where(eq(emailOtps.id, row.id));
    return { ok: false, reason: "wrong" };
  }
  await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, row.id));
  return { ok: true };
}

/** How long the newest live code stays valid — drives the on-page countdown. */
export async function otpRemainingMs(userId: number, purpose: "signup" = "signup"): Promise<number> {
  const rows = await db
    .select({ expiresAt: emailOtps.expiresAt })
    .from(emailOtps)
    .where(and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose), isNull(emailOtps.consumedAt)))
    .orderBy(sql`${emailOtps.id} desc`)
    .limit(1);
  const row = rows[0];
  if (!row) return 0;
  return Math.max(0, new Date(row.expiresAt).getTime() - Date.now());
}
