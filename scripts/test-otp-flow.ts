/* End-to-end OTP flow test against the real code (no Brevo key → .emails/).
 * Run with the server stopped: npx tsx scripts/test-otp-flow.ts */
import "dotenv/config";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { emailOtps, emailOutbox, users } from "../src/db/schema";
import { issueOtp, verifyOtp, otpRemainingMs } from "../src/lib/email/otp";
import { sendOtpEmail } from "../src/lib/email/triggers";

const EMAIL_DIR = path.resolve(process.cwd(), ".emails");
const TEST_EMAIL = "otp-flow-test@example.tn";
let failures = 0;
function check(label: string, cond: boolean, extra = "") {
  console.log(`${cond ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

function codeFromLetter(html: string): string {
  // The code is rendered one digit per cell — strip tags, find the first
  // standalone 6-digit run.
  const stripped = html.replace(/<[^>]+>/g, " ");
  return (stripped.match(/\b\d{6}\b/g) ?? [])[0] ?? "";
}

async function main() {
  // Idempotent: a crashed earlier run may have left test rows behind.
  for (const em of [TEST_EMAIL, "otp-flow-test-2@example.tn"]) {
    const stale = await db.select({ id: users.id }).from(users).where(eq(users.email, em));
    for (const row of stale) {
      await db.delete(emailOtps).where(eq(emailOtps.userId, row.id));
      await db.delete(emailOutbox).where(eq(emailOutbox.userId, row.id));
      await db.delete(users).where(eq(users.id, row.id));
    }
  }
  const [a] = await db
    .insert(users)
    .values({ firstName: "Test", lastName: "OTP", email: TEST_EMAIL, passwordHash: "scrypt$00$00", role: "customer" })
    .returning({ id: users.id });
  check("test user created", !!a);

  // 1. The letter leaves with its one and only code.
  const sent = await sendOtpEmail(a.id);
  check("sendOtpEmail sent", sent.sent === true, JSON.stringify(sent));
  const files = readdirSync(EMAIL_DIR).filter((f) => f.includes("otp_flow_test"));
  check("letter written to .emails/", files.length >= 1, files.join(", "));
  const letter = readFileSync(path.join(EMAIL_DIR, files[files.length - 1]), "utf8");
  const code = codeFromLetter(letter);
  check("letter carries a 6-digit code", /^\d{6}$/.test(code), code);

  // 2. The ledger holds the otp id — never the secret.
  const [ob] = await db.select().from(emailOutbox).where(eq(emailOutbox.to, TEST_EMAIL)).orderBy(emailOutbox.id).limit(1);
  const payloadStr = JSON.stringify(ob?.payload ?? {});
  check("outbox row exists (terminal single-shot)", !!ob, `status=${ob?.status}`);
  check("outbox payload has no code", !payloadStr.includes(code), `has otpId=${payloadStr.includes("otpId")}`);

  // 3. Wrong code rejected; countdown reflects the live code.
  const wrong = await verifyOtp(a.id, String((Number(code) + 1) % 1_000_000).padStart(6, "0"));
  const wrongReason = wrong.ok ? "verified" : wrong.reason;
  check("wrong code rejected", !wrong.ok && (wrongReason === "wrong" || wrongReason === "too_many"), wrongReason);
  const remaining = await otpRemainingMs(a.id);
  check("countdown reflects live code", remaining > 0 && remaining <= 10 * 60 * 1000, `${Math.round(remaining / 1000)}s left`);

  // 4. Right code verifies; single-use.
  const good = await verifyOtp(a.id, code);
  check("correct code verifies", good.ok === true);
  const replay = await verifyOtp(a.id, code);
  const replayReason = replay.ok ? "verified" : replay.reason;
  check("code is single-use", !replay.ok && replayReason === "not_found", replayReason);

  // 5. Immediate re-issue hits the cooldown.
  const cooldown = await issueOtp(a.id);
  check("cooldown blocks immediate re-issue", "error" in cooldown && cooldown.error === "cooldown", "error" in cooldown ? cooldown.error : "");

  // 6. A fresh user: the in-memory hand-off contract.
  const [b] = await db
    .insert(users)
    .values({ firstName: "Test", lastName: "OTP2", email: "otp-flow-test-2@example.tn", passwordHash: "scrypt$00$00", role: "customer" })
    .returning({ id: users.id });
  const fresh = await issueOtp(b.id);
  check("issueOtp hands the code over in memory", "code" in fresh && /^\d{6}$/.test(fresh.code) && fresh.otpId > 0, `otpId=${"otpId" in fresh ? fresh.otpId : "-"}`);

  // cleanup
  await db.delete(emailOtps).where(eq(emailOtps.userId, a.id));
  await db.delete(emailOtps).where(eq(emailOtps.userId, b.id));
  await db.delete(emailOutbox).where(eq(emailOutbox.to, TEST_EMAIL));
  await db.delete(users).where(eq(users.id, a.id));
  await db.delete(users).where(eq(users.id, b.id));
  for (const f of files) rmSync(path.join(EMAIL_DIR, f), { force: true });
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
