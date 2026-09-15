"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationItem } from "./notification-row";

/**
 * THE HOUSE WORD, LIVE — unread count + arrival stream for one tab.
 *
 * The count is the server's truth (`/api/notifications/unread`), re-read on
 * every arrival frame, on tab focus, and when the stream recovers — the badge
 * can never drift from what the ledger holds. Arrivals are handed to the
 * caller (toast, list prepend) via `onArrive`.
 */

type UnreadPayload = { total: number; byCategory: Record<string, number> };
type ArriveFrame = { type: string; notification?: NotificationItem };

export function useNotifications({
  enabled = true,
  onArrive,
}: {
  enabled?: boolean;
  onArrive?: (n: NotificationItem) => void;
} = {}) {
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [live, setLive] = useState(false);
  const arriveRef = useRef(onArrive);
  useEffect(() => {
    arriveRef.current = onArrive;
  });

  const refresh = useCallback(() => {
    fetch("/api/notifications/unread", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: UnreadPayload | null) => {
        if (!d) return;
        setTotal(Math.max(0, Number(d.total) || 0));
        setByCategory(d.byCategory && typeof d.byCategory === "object" ? d.byCategory : {});
      })
      .catch(() => {
        /* offline — the last known count stays on screen */
      });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    let es: EventSource | null = null;
    let disposed = false;
    try {
      es = new EventSource("/api/notifications/stream");
    } catch {
      return;
    }
    es.onopen = () => {
      if (!disposed) setLive(true);
    };
    es.onmessage = (e) => {
      if (disposed) return;
      try {
        const d = JSON.parse(e.data) as ArriveFrame;
        if (d.type === "notification" && d.notification) {
          refresh();
          arriveRef.current?.(d.notification);
        }
      } catch {
        /* a bad frame is dropped, never fatal */
      }
    };
    es.onerror = () => {
      if (!disposed) setLive(false);
    };
    return () => {
      disposed = true;
      es?.close();
    };
  }, [enabled, refresh]);

  return { total, byCategory, live, refresh };
}
