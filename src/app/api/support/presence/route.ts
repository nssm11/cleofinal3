import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setPresence, teamPresence } from "@/lib/support/bus";
import { isStaff } from "@/lib/support/chat";
import { asString, readJson, unauthorised } from "@/lib/support/api";
import type { PresenceStatus } from "@/lib/support/types";

export const dynamic = "force-dynamic";

/**
 * An agent declares their state — opening the inbox claims "online", the
 * operator can step to "away" or "offline", and the line prunes anyone who
 * stops answering. What the customer sees is exactly this map, nothing more.
 */
export async function POST(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();
  if (!isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await readJson(req);
  const raw = asString(b.status, 16);
  const status: PresenceStatus = raw === "away" ? "away" : raw === "offline" ? "offline" : "online";
  const name = `${user.firstName ?? "Conseiller"} ${user.lastName ?? ""}`.trim();
  const agent = setPresence(user.id, name, status);
  return NextResponse.json({ agent, agents: teamPresence() });
}
