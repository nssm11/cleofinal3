"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSupportStream } from "@/components/support/hooks";
import type { SupportData } from "@/lib/support/wire";

/**
 * The concierge's knock — a live unread count on the account rail.
 *
 * The number is the server's truth: it is read from the stored threads and
 * re-checked whenever the line reports a message from the house, so the badge
 * can never be ahead of (or behind) what the conciergerie actually holds.
 */
export function SupportUnreadBadge({ className }: { className?: string }) {
  const [n, setN] = useState(0);
  const [armed, setArmed] = useState(false);

  const refresh = useCallback(() => {
    fetch("/api/support/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.tickets)) {
          setN((d.tickets as { unread?: number }[]).reduce((a, t) => a + (t.unread ?? 0), 0));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  useSupportStream((d: SupportData) => {
    if (!armed) setArmed(true);
    if (d.type === "message" && d.message.senderType !== "customer") refresh();
    if (d.type === "conversation") refresh();
  });

  if (n <= 0) return null;
  return (
    <span
      aria-label={`${n} message${n > 1 ? "s" : ""} non lu${n > 1 ? "s" : ""}`}
      className={cn(
        "flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-ink px-1 text-[8.5px] font-bold leading-none text-porcelain",
        className,
      )}
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}
