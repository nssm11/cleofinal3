import "server-only";
import { EventEmitter } from "node:events";
import type { PresenceOut, PresenceStatus, RoutedEvent, Routing, SupportData } from "./types";

/**
 * THE CONCIERGE LINE — the in-process realtime bus.
 *
 * The house runs ONE Node process (`next start`) on one database, so realtime
 * is an EventEmitter the SSE streams subscribe to. The database stays the
 * authority: everything broadcast here was already committed by a write, the
 * line only syncs it. No timers, no fake heartbeats pretending to be people.
 */
const g = globalThis as typeof globalThis & { __cleoSupportBus?: EventEmitter };
const bus: EventEmitter = (g.__cleoSupportBus ??= new EventEmitter());
bus.setMaxListeners(200);
export const supportBus = bus;
export const SUPPORT_EVENT = "support" as const;

/** Fan a committed change out to its audience(s). Never throws. */
export function broadcast(routes: Routing[], data: SupportData) {
  try {
    const evt: RoutedEvent = { routes, data };
    bus.emit(SUPPORT_EVENT, evt);
  } catch (e) {
    console.warn("[support] broadcast failed", e);
  }
}

/** A subscriber receives an event if any route matches its identity. */
export function routesMatch(routes: Routing[], viewer: { isStaff: boolean; userId: number }): boolean {
  return routes.some((r) => (viewer.isStaff ? r.to === "staff" : r.to === "customer" && r.userId === viewer.userId));
}

/* ── PRESENCE ─────────────────────────────────────────────────────────────
 * Real presence, or nothing: an agent is "online" only while a live session
 * has told the line so within the TTL. When the line goes quiet, everyone
 * prunes back to offline. Presence is per-process by design — one process,
 * one source of truth — and it is never invented for anyone.
 */
type PresenceRec = { name: string; status: PresenceStatus; since: number; lastSeen: number };
const PRESENCE_TTL_MS = 90_000;

const gp = globalThis as typeof globalThis & {
  __cleoSupportPresence?: Map<number, PresenceRec>;
  __cleoSupportPrune?: boolean;
};
const presence = (gp.__cleoSupportPresence ??= new Map<number, PresenceRec>());

function now() {
  return Date.now();
}
function prune() {
  const t = now();
  for (const [id, r] of presence) {
    if (r.status !== "offline" && t - r.lastSeen > PRESENCE_TTL_MS) {
      presence.set(id, { ...r, status: "offline" });
    }
  }
}
function startPrune() {
  if (gp.__cleoSupportPrune) return;
  gp.__cleoSupportPrune = true;
  const t = setInterval(prune, 30_000);
  if (typeof t.unref === "function") t.unref();
}

export function presenceOf(userId: number): PresenceOut | null {
  prune();
  const r = presence.get(userId);
  if (!r) return null;
  return { id: userId, name: r.name, status: r.status, since: r.since };
}

export function teamPresence(): PresenceOut[] {
  prune();
  const out: PresenceOut[] = [];
  for (const [id, r] of presence) out.push({ id, name: r.name, status: r.status, since: r.since });
  return out.sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === "online" ? -1 : b.status === "online" ? 1 : a.status === "away" ? -1 : 1));
}

export function anyAgentOnline(): boolean {
  prune();
  for (const r of presence.values()) if (r.status === "online" || r.status === "away") return true;
  return false;
}

/**
 * Activity proof: the agent just did something, so they exist on the line.
 * Bumps an offline/unregistered agent back to online; never overrides a
 * deliberate "away".
 */
export function touchPresence(userId: number, name: string): PresenceOut | null {
  startPrune();
  const prev = presence.get(userId);
  const status: PresenceStatus = !prev || prev.status === "offline" ? "online" : prev.status;
  const rec: PresenceRec = {
    name: name || prev?.name || `Conseiller ${userId}`,
    status,
    since: prev && prev.status !== "offline" && prev.status === status ? prev.since : now(),
    lastSeen: now(),
  };
  presence.set(userId, rec);
  const out: PresenceOut = { id: userId, name: rec.name, status: rec.status, since: rec.since };
  broadcast([{ to: "staff" }], { type: "presence", agent: out });
  return out;
}

/**
 * Register/refresh an agent's presence. `status: "online"` is claimed when
 * the agent opens the inbox or sends a heartbeat; the line keeps it until
 * the TTL lapses or the agent goes away/offline.
 */
export function setPresence(userId: number, name: string, status: PresenceStatus): PresenceOut {
  startPrune();
  const prev = presence.get(userId);
  const rec: PresenceRec = {
    name: name || prev?.name || `Conseiller ${userId}`,
    status,
    since: status !== "offline" && prev && prev.status !== "offline" && status === prev.status ? prev.since : now(),
    lastSeen: now(),
  };
  presence.set(userId, rec);
  const out: PresenceOut = { id: userId, name: rec.name, status: rec.status, since: rec.since };
  broadcast([{ to: "staff" }], { type: "presence", agent: out });
  return out;
}

/** True while at least one agent holds a live line. */
export { startPrune as ensurePresencePrune };
