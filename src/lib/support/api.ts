import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser, type SafeUser } from "@/lib/auth";
import { isStaff } from "./chat";
import { teamPresence, touchPresence } from "./bus";

/** Shared plumbing for the conciergerie routes. */

export async function routeUser(req: NextRequest): Promise<SafeUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export function unauthorised() {
  return NextResponse.json({ error: "unauthorised" }, { status: 401 });
}

export function isStaffUser(user: SafeUser): boolean {
  return isStaff(user);
}

/** Read a JSON body, capped, forgiving of non-objects. */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const raw = await req.text();
    if (raw.length > 64_000) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function asString(v: unknown, max = 4000): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function asInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Activity refresh: a staff action proves the agent is at the desk. */
export function staffActivity(user: SafeUser) {
  const name = `${user.firstName ?? "Conseiller"} ${user.lastName ?? ""}`.trim();
  touchPresence(user.id, name);
}

export { teamPresence };
