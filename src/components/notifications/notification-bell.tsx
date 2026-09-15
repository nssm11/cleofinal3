"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BellIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/client";
import { useNotifications } from "./use-notifications";
import { NotificationRow, type NotificationItem } from "./notification-row";
import { markNotificationReadAction } from "@/actions/notifications";

/**
 * THE KNOCK — the header bell for signed-in customers.
 *
 * A count, a dropdown of the latest words, one door into the center. The
 * dropdown reads the same API as the center, so it can never disagree with
 * it; opening a row marks it read and the badge settles immediately.
 */
export function NotificationBell({ onDark }: { onDark: boolean }) {
  const { locale, copy } = useLocale();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<NotificationItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Loading is derived: the dropdown is fetching exactly while it is open
  // with no page yet and no failure on record.
  const loading = open && recent === null && !failed;
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = copy.notifications;

  const load = useCallback(() => {
    fetch("/api/notifications", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items: NotificationItem[] } | null) => {
        if (!d || !Array.isArray(d.items)) {
          setFailed(true);
          return;
        }
        setRecent(d.items.slice(0, 6));
      })
      .catch(() => setFailed(true));
  }, []);

  const { total, refresh } = useNotifications({
    onArrive: (n) => setRecent((prev) => [n, ...(prev ?? []).filter((p) => p.id !== n.id)].slice(0, 6)),
  });

  useEffect(() => {
    if (open && recent === null && !failed) load();
  }, [open, recent, failed, load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const markOne = useCallback(
    async (item: NotificationItem) => {
      if (item.readAt) return;
      setRecent((prev) => (prev ?? []).map((p) => (p.id === item.id ? { ...p, readAt: new Date().toISOString() } : p)));
      try {
        await markNotificationReadAction(item.id);
      } catch {
        /* the row re-reads on next open */
      }
      refresh();
    },
    [refresh],
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => {
          if (!open) {
            setFailed(false);
            setRecent(null);
          }
          setOpen((o) => !o);
        }}
        aria-label={total > 0 ? `${t.title} — ${total}` : t.title}
        aria-expanded={open}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center transition-colors",
          onDark ? "text-cine-ivory/90 hover:text-cine-gold" : "text-ink/80 hover:text-champagne-2",
        )}
      >
        <BellIcon size={18} strokeWidth={1.4} rung={total > 0} />
        <AnimatePresence>
          {total > 0 && (
            <motion.span
              key={total}
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              aria-hidden
              className={cn(
                "absolute -right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center px-1 text-[9px] font-bold tabular-nums",
                onDark ? "bg-cine-gold text-cine-noir" : "bg-champagne-2 text-paper",
              )}
            >
              {total > 99 ? "99+" : total}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-label={t.title}
            className="absolute end-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden border border-stone/70 bg-ivory shadow-[0_24px_60px_-24px_rgba(34,28,19,0.45)]"
          >
            <div className="flex items-center justify-between border-b border-stone/60 px-5 py-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">{t.kicker}</p>
              <Link
                href="/compte/notifications"
                onClick={() => setOpen(false)}
                className="text-[10px] font-bold uppercase tracking-[0.16em] text-champagne-2 transition-colors hover:text-ink"
              >
                {t.viewAll}
              </Link>
            </div>
            {loading ? (
              <ul className="animate-pulse px-5 py-4" aria-label={t.loading}>
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-3 py-2.5">
                    <span className="h-9 w-9 shrink-0 rounded-full bg-marble" />
                    <span className="flex-1 space-y-2 py-1">
                      <span className="block h-2.5 w-3/4 bg-marble" />
                      <span className="block h-2 w-1/2 bg-cream" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : failed ? (
              <div className="px-6 py-8 text-center">
                <p className="text-[13px] text-muted">{t.failed}</p>
                <button
                  onClick={() => {
                    setFailed(false);
                    setRecent(null);
                  }}
                  className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-champagne-2 hover:text-ink"
                >
                  {t.retry}
                </button>
              </div>
            ) : (recent ?? []).length === 0 ? (
              <p className="px-6 py-9 text-center font-display text-[15px] italic text-muted">{t.empty}</p>
            ) : (
              <ul className="max-h-[26rem] divide-y divide-stone/50 overflow-y-auto">
                {(recent ?? []).map((n) => (
                  <NotificationRow
                    key={n.id}
                    item={n}
                    locale={locale}
                    markLabel={t.markRead}
                    onOpen={(it) => {
                      setOpen(false);
                      markOne(it);
                    }}
                    onMarkRead={markOne}
                  />
                ))}
              </ul>
            )}
            <Link
              href="/compte/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-stone/60 bg-cream/50 px-5 py-3.5 text-center text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-champagne-soft/50"
            >
              {t.openCenter}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
