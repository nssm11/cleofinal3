"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import { BellIcon, CheckIcon } from "@/components/icons";
import { AccountCard } from "@/components/account/account-ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback/feedback";
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
        <span className="mx-1 hidden h-5 w-px bg-rule/60 sm:block" aria-hidden />
        <button
          onClick={toggleUnread}
          aria-pressed={unreadOnly}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-300",
            unreadOnly ? "border-ink bg-ink text-porcelain" : "border-rule/70 bg-alabaster/70 text-graphite hover:text-ink",
          )}
        >
          <CheckIcon size={12} />
          {t.unreadOnly}
        </button>
        {unreadTotal > 0 && (
          <button
            onClick={markAll}
            className="ms-auto text-[10.5px] font-bold uppercase tracking-[0.16em] text-cinabre-2 transition-colors hover:text-ink"
          >
            {t.markAll}
          </button>
        )}
      </div>

      {/* ── The shelf ───────────────────────────────────────────────── */}
      <AccountCard className="mt-6 !border-rule/50 !bg-transparent !shadow-none" hover={false}>
        {loading ? (
          <div className="px-5 py-3 sm:px-6">
            <LoadingState rows={4} label={t.loading} />
          </div>
        ) : failed ? (
          <ErrorState title={t.failed} retryLabel={t.retry} onRetry={() => load(category, unreadOnly, null, false)} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BellIcon size={22} strokeWidth={1.3} />}
            title={unreadOnly ? t.emptyUnread : t.empty}
            description={t.emptyHint}
          />
        ) : (
          <>
            <ul className="space-y-3">
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
              <div className="border-t border-rule/60 px-6 py-5 text-center">
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
        active ? "border-cinabre-2/70 bg-cinabre-soft/80 text-ink" : "border-rule/60 bg-alabaster/70 text-graphite hover:text-ink",
      )}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={cn(
            "flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] tabular-nums",
            active ? "bg-ink text-porcelain" : "bg-cinabre-2/20 text-cinabre-2",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
