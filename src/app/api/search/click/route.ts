import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { track } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { clientKey } from "@/lib/origin";

/**
 * Search analytics — which suggestion a query turned into.
 *
 * Records only the query, the bucket and the public reference (a slug or an
 * id). No personal data beyond the session's own user id, which the existing
 * analytics table already carries for every other event.
 */
const clickSchema = z.object({
  q: z.string().trim().min(1).max(120),
  kind: z.enum(["product", "brand", "category", "concern", "all"]),
  ref: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`search-click:${await clientKey()}`, 60, 60_000))) {
    return NextResponse.json({ error: "slow_down" }, { status: 429 });
  }
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }
  const parsed = clickSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_body" }, { status: 400 });
  let me = null;
  try {
    me = await getCurrentUser();
  } catch {
    me = null;
  }
  // Control characters are stripped: the query is analytics, never markup.
  const q = parsed.data.q.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 120);
  await track("search.click", { q, kind: parsed.data.kind, ref: parsed.data.ref || null }, me?.id ?? null);
  return NextResponse.json({ ok: true });
}
