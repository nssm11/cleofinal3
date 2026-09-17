"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PresenceOut, SupportData } from "@/lib/support/wire";

/* ── connection state ─────────────────────────────────────────────────── */
export type Conn = "connecting" | "open" | "reconnecting" | "closed";

/**
 * The concierge line on the client. A single EventSource per tab; the server
 * is the only source of truth. On a recovered connection the parent is told
 * via `onRecovered` so it can re-fetch whatever happened while the line was
 * down — the stream itself never claims to have delivered anything it didn't.
 */
export function useSupportStream(onData: (d: SupportData) => void, onRecovered?: () => void) {
  const [conn, setConn] = useState<Conn>("connecting");
  const dataRef = useRef(onData);
  const recoveredRef = useRef(onRecovered);
  useEffect(() => {
    dataRef.current = onData;
  });
  useEffect(() => {
    recoveredRef.current = onRecovered;
  });

  useEffect(() => {
    let es: EventSource | null = null;
    let disposed = false;
    let everOpen = false;
    let dropped = false;
    es = new EventSource("/api/support/stream");
    es.onopen = () => {
      if (disposed) return;
      setConn("open");
      if (dropped) {
        dropped = false;
        // The line came back — the server re-sent its hello, the parent
        // reconciles whatever happened while it was down.
        recoveredRef.current?.();
      }
      everOpen = true;
    };
    es.onmessage = (e) => {
      if (disposed) return;
      try {
        dataRef.current(JSON.parse(e.data) as SupportData);
      } catch {
        /* keep the line; a bad frame is dropped, not fatal */
      }
    };
    es.onerror = () => {
      if (disposed) return;
      if (es && es.readyState === EventSource.CLOSED) {
        setConn("closed");
        return;
      }
      dropped = true;
      setConn(everOpen ? "reconnecting" : "connecting");
    };
    return () => {
      disposed = true;
      es?.close();
    };
  }, []);

  return conn;
}

/* ── multi-tab dedupe ─────────────────────────────────────────────────── */
/**
 * Only one tab should chime / raise a browser notification for a given
 * event. A short-lived claim is posted on a shared channel; a tab that finds
 * a fresh claim for the same key stays quiet. Falls back to localStorage if
 * BroadcastChannel is unavailable.
 */
type ClaimChannel = BroadcastChannel & { __recent?: Record<string, number> };

export function claimOnce(key: string, ttlMs = 4000): boolean {
  if (typeof window === "undefined") return true;
  const now = Date.now();
  try {
    const bc = (window as unknown as { __cleoClaim?: ClaimChannel }).__cleoClaim;
    if (bc) {
      const taken = bc.__recent?.[key];
      if (taken && now - taken < ttlMs) return false;
      bc.__recent = { ...(bc.__recent ?? {}), [key]: now };
      bc.postMessage({ key, at: now });
      return true;
    }
  } catch {
    /* fall through to storage */
  }
  try {
    const raw = localStorage.getItem("cleo_claim");
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    if (map[key] && now - map[key] < ttlMs) return false;
    map[key] = now;
    for (const k of Object.keys(map)) if (now - map[k] > ttlMs) delete map[k];
    localStorage.setItem("cleo_claim", JSON.stringify(map));
    return true;
  } catch {
    return true;
  }
}

// Shared channel instance (created lazily in a browser).
if (typeof window !== "undefined") {
  const g = window as unknown as { __cleoClaim?: ClaimChannel };
  if (!g.__cleoClaim) {
    try {
      const bc = new BroadcastChannel("cleo_claim") as ClaimChannel;
      bc.__recent = {};
      bc.onmessage = (e) => {
        const m = e.data as { key?: string; at?: number };
        if (m && m.key && m.at) bc.__recent = { ...(bc.__recent ?? {}), [m.key]: m.at };
      };
      g.__cleoClaim = bc;
    } catch {
      /* no channel; storage fallback only */
    }
  }
}

/* ── presence helpers ─────────────────────────────────────────────────── */
export function anyOnline(agents: PresenceOut[]): boolean {
  return agents.some((a) => a.status === "online" || a.status === "away");
}

export function presenceDot(status: PresenceOut["status"]): string {
  return status === "online" ? "bg-ok" : status === "away" ? "bg-amber" : "bg-ops-faint";
}

/* ── time formatting (house locale) ───────────────────────────────────── */
const timeFmt = new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit" });
export function fmtTime(iso: string): string {
  try {
    return timeFmt.format(new Date(iso));
  } catch {
    return "";
  }
}
export function dayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yest.toDateString()) return "Hier";
    return new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "short" }).format(d);
  } catch {
    return "";
  }
}
export function agoLabel(iso: string | null): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

/* ── a subtle chime, only when permitted and the tab is hidden ────────── */
let audioCtx: AudioContext | null = null;
export function chime(): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!document.hidden) return; // a visible tab gets a toast, not a sound
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.04, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.32);
    });
  } catch {
    /* silence is acceptable */
  }
}

/** Ask for notification permission (only on an explicit user gesture). */
export async function askNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function notify(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, icon: "/icon.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* some browsers require a service worker; a toast is enough */
  }
}
