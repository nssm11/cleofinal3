"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import { BellIcon, CheckIcon } from "@/components/icons";
import { AccountCard } from "@/components/account/account-ui";
import { NOTIFICATION_CATEGORIES, categoryMeta } from "@/lib/notification-meta";
import { NotificationRow, type NotificationItem } from "./notification-row";
import { NotificationGlyph } from "./notification-glyph";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications";

/**
 * THE CENTER — the customer's shelf of house words.
 *
 * Server-rendered with the first page, then interactive: shelf filters,
 * unread-only, cursor paging, per-row and mark-all reads. Every mutation is
 * optimistic with a quiet re-read, so the shelf never disagrees with the
 * ledger for long.
 */
export function NotificationCenter({
  initial,
  initialHasMore,
  initialByCategory,
}: {
  initial: NotificationItem[];
  initialHasMore: boolean;
  initialByCategory: Record<string, number>;
}) {
  const { locale, copy } = useLocale();
  const t = copy.notifications;
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [category, setCategory] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState(false);
  const [failed, setFailed] = useState(false);
  const [byCategory, setByCategory] = useState(initialByCategory);

  const unreadTotal = useMemo(() => Object.values(byCategory).reduce((a, b) => a + b, 0), [byCategory]);

  const load = useCallback(
    async (cat: string | null, unread: boolean, before: number | null, append: boolean) => {
      if (append) setPaging(true);
      else setLoading(true);
      setFailed(false);
      try {
        const q = new URLSearchParams();
        if (cat) q.set("category", cat);
        if (unread) q.set("unread", "1");
        if (before) q.set("before", String(before));
        const r = await fetch(`/api/notifications?${q.toString()}`, { credentials: "same-origin" });
        if (!r.ok) throw new Error("bad");
        const d = (await r.json()) as { items: NotificationItem[]; hasMore: boolean };
        setItems((prev) => (append ? [...prev, ...d.items] : d.items));
        setHasMore(d.hasMore);
      } catch {
        if (!append) setItems([]);
        setFailed(true);
      } finally {
        setLoading(false);
        setPaging(false);
      }
    },
    [],
  );

  const refreshCounts = useCallback(() => {
    fetch("/api/notifications/unread", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { byCategory: Record<string, number> } | null) => {
        if (!d) return;
        setByCategory(d.byCategory && typeof d.byCategory === "object" ? d.byCategory : {});
      })
      .catch(() => {
        /* the shelf keeps its last counts */
      });
  }, []);

  // First user gesture re-reads so filters never show a stale page.
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const pickCategory = (cat: string | null) => {
    setCategory(cat);
    load(cat, unreadOnly, null, false);
  };
  const toggleUnread = () => {
    const next = !unreadOnly;
    setUnreadOnly(next);
    load(category, next, null, false);
  };

  const markOne = useCallback(
    async (item: NotificationItem) => {
      if (item.readAt) return;
      const now = new Date().toISOString();
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, readAt: now } : p)));
      setByCategory((prev) => ({ ...prev, [item.category]: Math.max(0, (prev[item.category] ?? 1) - 1) }));
      try {
        await markNotificationReadAction(item.id);
      } catch {
        /* re-read on next filter change */
      }
      refreshCounts();
    },
    [refreshCounts],
  );

  const markAll = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((p) => ({ ...p, readAt: p.readAt ?? now })));
    try {
      await markAllNotificationsReadAction(category ?? undefined);
    } catch {
      /* the counts re-read below */
    }
    refreshCounts();
    if (unreadOnly) load(category, true, null, false);
  }, [category, unreadOnly, load, refreshCounts]);

  const lastId = items.length ? items[items.length - 1].id : null;

  return (
    <div>
      {/* ── Shelves ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={t.title}>
        <FilterChip active={category === null} onClick={() => pickCategory(null)} label={t.all} count={unreadTotal} />
        {NOTIFICATION_CATEGORIES.map((c) => {
          const meta = categoryMeta(c);
          const n = byCategory[c] ?? 0;
          // Shelves with neither words nor history stay hidden — the center
          // only promises what the house has actually said.
          if (n === 0 && !items.some((i) => i.category === c) && category !== c) return null;
          return (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => pickCategory(category === c ? null : c)}
              label={meta.label}
              count={n}
              icon={<NotificationGlyph icon={meta.icon} size={12} />}
            />
          );
        })}
        <span className="mx-1 hidden h-5 w-px bg-stone/60 sm:block" aria-hidden />
        <button
          onClick={toggleUnread}
          aria-pressed={unreadOnly}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-300",
            unreadOnly ? "border-ink bg-ink text-paper" : "border-stone/70 bg-ivory/70 text-muted hover:text-ink",
          )}
        >
          <CheckIcon size={12} />
          {t.unreadOnly}
        </button>
        {unreadTotal > 0 && (
          <button
            onClick={markAll}
            className="ms-auto text-[10.5px] font-bold uppercase tracking-[0.16em] text-champagne-2 transition-colors hover:text-ink"
          >
            {t.markAll}
          </button>
        )}
      </div>

      {/* ── The shelf ───────────────────────────────────────────────── */}
      <AccountCard className="mt-6" hover={false}>
        {loading ? (
          <ul className="animate-pulse px-5 py-3 sm:px-6" aria-label={t.loading}>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex gap-4 border-b border-stone/50 py-4 last:border-0">
                <span className="h-10 w-10 shrink-0 rounded-full bg-marble" />
                <span className="flex-1 space-y-2.5 py-1">
                  <span className="block h-2.5 w-1/4 bg-marble" />
                  <span className="block h-3 w-3/4 bg-cream" />
                  <span className="block h-2.5 w-1/2 bg-cream" />
                </span>
              </li>
            ))}
          </ul>
        ) : failed ? (
          <div className="px-6 py-14 text-center" role="alert">
            <p className="font-display text-[19px] text-ink">{t.failed}</p>
            <button
              onClick={() => load(category, unreadOnly, null, false)}
              className="btn-secondary mt-6"
            >
              {t.retry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center sm:py-18">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-champagne-2/40 bg-champagne-soft/60 text-champagne-2">
              <BellIcon size={22} strokeWidth={1.3} />
            </span>
            <p className="mx-auto mt-6 max-w-sm font-display text-[clamp(1.3rem,2.6vw,1.7rem)] leading-snug text-ink">
              {unreadOnly ? t.emptyUnread : t.empty}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-muted">{t.emptyHint}</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stone/50">
              <AnimatePresence initial={false}>
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    item={n}
                    locale={locale}
                    markLabel={t.markRead}
                    onOpen={markOne}
                    onMarkRead={markOne}
                  />
                ))}
              </AnimatePresence>
            </ul>
            {hasMore && (
              <div className="border-t border-stone/60 px-6 py-5 text-center">
                <button onClick={() => load(category, unreadOnly, lastId, true)} disabled={paging} className="btn-ghost">
                  {paging ? t.loading : t.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </AccountCard>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-300",
        active ? "border-champagne-2/70 bg-champagne-soft/80 text-ink" : "border-stone/60 bg-ivory/70 text-muted hover:text-ink",
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={cn(
            "flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] tabular-nums",
            active ? "bg-ink text-paper" : "bg-champagne-2/20 text-champagne-2",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
