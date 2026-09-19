"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { categoryMeta, isSafeNotificationHref } from "@/lib/notification-meta";
import { claimOnce } from "@/components/support/hooks";
import { useLocale } from "@/lib/i18n/client";
import { useNotifications } from "./use-notifications";
import { NotificationGlyph } from "./notification-glyph";
import type { NotificationItem } from "./notification-row";

/**
 * THE QUIET KNOCK — a toast when a word arrives while the customer is here.
 *
 * One tab raises it (`claimOnce`, shared with the concierge line), it lives
 * five seconds, and it leads exactly where the notification leads. Reduced
 * motion keeps the toast but drops the travel.
 */
export function NotificationToast() {
  const { copy } = useLocale();
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState<NotificationItem | null>(null);

  const arrive = useCallback((n: NotificationItem) => {
    if (!claimOnce(`notif-toast:${n.id}`)) return;
    setCurrent(n);
  }, []);

  useNotifications({ onArrive: arrive });

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 5200);
    return () => clearTimeout(t);
  }, [current]);

  const meta = current ? categoryMeta(current.category) : null;
  const href = current && isSafeNotificationHref(current.href) ? current.href : "/compte/notifications";

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 sm:bottom-8 sm:justify-end sm:px-8">
      <AnimatePresence>
        {current && meta && (
          <motion.div
            key={current.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.32 }}
            className="pointer-events-auto w-full max-w-sm overflow-hidden border border-iodine-deep/40 bg-porcelain/97 shadow-[0_24px_60px_-20px_rgba(29,29,31,0.45)] backdrop-blur-md"
          >
            <Link href={href} onClick={() => setCurrent(null)} className="flex items-start gap-3.5 px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-iodine-deep/50 bg-iodine-wash/70 text-iodine-deep">
                <NotificationGlyph icon={meta.icon} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-iodine-deep">{meta.label}</span>
                <span className="mt-1 block truncate font-ant uppercase text-[15.5px] text-carbon">{current.title}</span>
                {current.body && <span className="mt-0.5 block truncate text-[12.5px] text-muted">{current.body}</span>}
              </span>
            </Link>
            <span className="sr-only">{copy.notifications.newArrived}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
