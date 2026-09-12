import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireStaff } from "@/lib/auth";
import { env } from "@/lib/env";
import { runDailyRound } from "@/lib/jobs/daily";
import { log } from "@/lib/logger";

/**
 * POST (or GET) /api/cron/outbox — the heartbeat.
 *
 * Authorized two ways: the shared `CRON_SECRET` as a Bearer token (for
 * external schedulers — Vercel Cron, a crontab, any curl) or an admin/support
 * session, so the shop can run the round by hand from the back-office.
 */
export const dynamic = "force-dynamic";

function tokenOk(header: string | null): boolean {
  const secret = env.CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const given = header.replace(/^Bearer\s+/i, "");
  if (given.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}
export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  const authorized = tokenOk(req.headers.get("authorization"));
  if (!authorized) {
    try {
      await requireStaff();
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const report = await runDailyRound();
    log.info("cron outbox", { ...report });
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    log.error("cron outbox failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "cron failed" }, { status: 500 });
  }
}
