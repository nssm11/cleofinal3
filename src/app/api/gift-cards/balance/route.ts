import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getGiftCardByCode } from "@/lib/gift-cards";
import { liveStatus } from "@/lib/gift-cards-client";
import { rateLimit } from "@/lib/rate-limit";
import { clientKey } from "@/lib/origin";

/**
 * Gift-card balance, code-only.
 *
 * No identity, no PII: the code is the credential, and the answer reveals
 * only whether the code exists, plus its balance, status and expiry.
 * Guessing is defeated by the code entropy (~60 bits) multiplied by the
 * strict throttle below — not by hiding the unknown/known distinction,
 * which the balance checker needs to tell a typo from an empty card.
 */
const bodySchema = z.object({ code: z.string().trim().min(8).max(32) });

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`gift-balance:${await clientKey()}`, 10, 600_000))) {
    return NextResponse.json({ error: "slow_down" }, { status: 429 });
  }
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  const card = await getGiftCardByCode(parsed.data.code);
  if (!card) return NextResponse.json({ ok: true, known: false });
  return NextResponse.json({
    ok: true,
    known: true,
    balanceMillimes: card.balanceMillimes,
    status: liveStatus(card),
    expiresAt: card.expiresAt ? card.expiresAt.toISOString() : null,
  });
}
