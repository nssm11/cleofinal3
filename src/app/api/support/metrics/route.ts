import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/support/chat";
import { supportMetrics } from "@/lib/support/queries";
import { unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

/** The inbox ledger — counts and averages computed from stored rows only. */
export async function GET(_req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const m = await supportMetrics(user);
  return NextResponse.json(m);
}
