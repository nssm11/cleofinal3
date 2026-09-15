"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { categoryMeta, isSafeNotificationHref } from "@/lib/notification-meta";
import { NotificationGlyph } from "./notification-glyph";

/**
 * ONE WORD FROM THE HOUSE — the shared notification row.
 *
 * Unread rows carry a champagne edge and a filled dot; read rows recede.
 * The destination is server-generated, but the guard runs again here — a
 * row whose href ever fails renders as plain text, never as a link out.
 */

export type NotificationItem = {
  id: number;
  category: string;
  title: string;
  body: string | null;
  href: string | null;
  priority: string;
  readAt: string | null;
  createdAt: string;
};

export function timeAgo(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  const tag = locale === "tn-arab" ? "ar-TN" : "fr";
  try {
    const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    if (s < 60) return rtf.format(-s, "second");
    const m = Math.floor(s / 60);
    if (m < 60) return rtf.format(-m, "minute");
    const h = Math.floor(m / 60);
    if (h < 24) return rtf.format(-h, "hour");
    const d = Math.floor(h / 24);
    if (d < 7) return rtf.format(-d, "day");
    return formatDateTime(iso);
  } catch {
    return formatDateTime(iso);
  }
}

export function NotificationRow({
  item,
  locale,
  markLabel,
  onOpen,
  onMarkRead,
}: {
  item: NotificationItem;
  locale: string;
  markLabel: string;
  onOpen?: (item: NotificationItem) => void;
  onMarkRead?: (item: NotificationItem) => void;
}) {
  const unread = !item.readAt;
  const meta = categoryMeta(item.category);
  const safeHref = isSafeNotificationHref(item.href) ? item.href : null;
  const high = item.priority === "high";

  const inner = (
    <>
      <span
        aria-hidden
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
          unread ? "border-champagne-2/50 bg-champagne-soft/70 text-champagne-2" : "border-stone/70 bg-cream/60 text-muted-2",
        )}
      >
        <NotificationGlyph icon={meta.icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", unread ? "text-champagne-2" : "text-muted-2")}>
            {meta.label}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-2" title={formatDateTime(item.createdAt)}>
            {timeAgo(item.createdAt, locale)}
          </span>
        </span>
        <span className={cn("mt-1.5 block font-display text-[16.5px] leading-snug", unread ? "text-ink" : "text-charcoal")}>
          {item.title}
        </span>
        {item.body && <span className="mt-1 block text-[13px] leading-relaxed text-muted">{item.body}</span>}
      </span>
      <span className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch py-0.5">
        <span
          aria-hidden
          className={cn(
            "h-[7px] w-[7px] rounded-full transition-colors duration-300",
            unread ? (high ? "bg-terra" : "bg-champagne-2") : "bg-stone-2/70",
          )}
        />
        {unread && onMarkRead && (
          <span
            role="button"
            tabIndex={0}
            aria-label={markLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead(item);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(item);
              }
            }}
            className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-muted-2 opacity-0 transition-all duration-300 hover:text-ink focus-visible:opacity-100 group-hover/row:opacity-100"
          >
            {markLabel}
          </span>
        )}
      </span>
    </>
  );

  const cls = cn(
    "group/row relative flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-300 sm:px-6",
    unread ? "bg-ivory hover:bg-champagne-soft/40" : "hover:bg-cream/60",
  );
  const edge = unread && (
    <span aria-hidden className="absolute inset-y-3 left-0 w-[2px] bg-champagne-2/80" />
  );

  if (safeHref) {
    return (
      <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Link href={safeHref} className={cls} onClick={() => onOpen?.(item)}>
          {edge}
          {inner}
        </Link>
      </motion.li>
    );
  }
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={cls}>
      {edge}
      {inner}
    </motion.li>
  );
}
