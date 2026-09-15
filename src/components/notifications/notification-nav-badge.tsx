"use client";

import { cn } from "@/lib/utils";
import { useNotifications } from "./use-notifications";

/** The unread count on the account rail — the server's number, kept live. */
export function NotificationNavBadge({ className }: { className?: string }) {
  const { total } = useNotifications();
  if (total <= 0) return null;
  return (
    <span
      aria-label={`${total} notification${total > 1 ? "s" : ""} non lue${total > 1 ? "s" : ""}`}
      className={cn(
        "flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-champagne-2 px-1 text-[8.5px] font-bold leading-none text-paper",
        className,
      )}
    >
      {total > 9 ? "9+" : total}
    </span>
  );
}
