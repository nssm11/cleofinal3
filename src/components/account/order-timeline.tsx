"use client";
import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@/components/icons";
import { ORDER_FLOW } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { EASE_LUXE } from "@/lib/motion";
import { useLocale } from "@/lib/i18n/client";
import { OrderProblemButton } from "@/components/experience/order-problem";

/**
 * THE ROAD OF THE PARCEL — a vertical timeline that shows all seven statuses
 * the house can speak of: the five of the order flow (with « en cours de
 * livraison » drawn from the live events between shipping and delivery) plus
 * the two exits, annulée and remboursée.
 */
type Ev = { status: OrderStatus; message: string | null; createdAt: Date | string };

export function OrderTimeline({
  status,
  events,
  paymentStatus,
  orderNumber,
  verifiedEmail,
  isAuthed,
}: {
  status: OrderStatus;
  events: Ev[];
  paymentStatus?: "pending" | "paid" | "refunded" | "failed";
  orderNumber?: string;
  verifiedEmail?: string;
  isAuthed?: boolean;
}) {
  const reduce = useReducedMotion();
  const { copy } = useLocale();
  const st = copy.tracking.statuses;
  const steps = copy.tracking.steps;

  const delivering = events.some((e) => /livraison|tournée|delivery/i.test(e.message ?? ""));
  const terminal = status === "cancelled" || status === "returned";

  type Step = { key: string; label: string };
  const flow: Step[] = [
    { key: "confirmed", label: steps.confirmed },
    { key: "preparing", label: steps.preparing },
    { key: "shipped", label: steps.shipped },
    { key: "delivering", label: steps.delivering },
    { key: "delivered", label: steps.delivered },
  ];
  const reached: Record<string, boolean> = {
    confirmed: status !== "pending",
    preparing: ORDER_FLOW.indexOf(status) >= ORDER_FLOW.indexOf("preparing") || status === "delivered",
    shipped: ["shipped", "delivered"].includes(status) || status === "returned",
    delivering: status === "delivered" || (status === "shipped" && delivering),
    delivered: status === "delivered" || (status === "returned" && events.some((e) => e.status === "delivered")),
  };
  const lastIdx = flow.reduce((acc, f, i) => (reached[f.key] ? i : acc), -1);

  return (
    <div>
      {terminal ? (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <p className="inline-flex bg-error-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-error">
            {status === "cancelled" ? st.cancelled : st.returned}
          </p>
          {paymentStatus === "refunded" && (
            <p className="inline-flex bg-champagne-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-champagne-2">{st.refunded}</p>
          )}
        </div>
      ) : (
        <ol className="relative grid grid-cols-5 gap-1" aria-label={copy.tracking.title}>
          <span aria-hidden className="absolute inset-x-4 top-[15px] -z-10 h-px bg-stone-2/60" />
          <span
            aria-hidden
            className="absolute top-[15px] -z-10 h-px origin-left bg-ink transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ltr:left-4 rtl:right-4"
            style={{ width: `calc(${((Math.max(0, lastIdx) / (flow.length - 1)) * 100) * 0.92}%)` }}
          />
          {flow.map((f, i) => {
            const on = reached[f.key];
            const current = i === lastIdx;
            return (
              <li key={f.key} className="flex flex-col items-center text-center">
                <motion.span
                  initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: EASE_LUXE }}
                  className={`flex h-8 w-8 items-center justify-center border ${on ? "border-ink bg-ink text-paper" : "border-stone-2 bg-cream text-muted-2"} ${current ? "shadow-halo" : ""}`}
                >
                  {on && !current ? <CheckIcon size={14} /> : <span className="text-[11px] tabular-nums">{i + 1}</span>}
                </motion.span>
                <span className={`mt-2 text-[9.5px] font-bold uppercase tracking-[0.1em] ${on ? "text-ink" : "text-muted-2"}`}>{f.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <ul className="mt-8 space-y-4 border-s border-stone ps-5">
        {events.map((e, i) => (
          <motion.li
            key={i}
            initial={reduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: EASE_LUXE }}
            className="relative text-sm"
          >
            <span aria-hidden className="absolute -start-[23px] top-1.5 h-1.5 w-1.5 bg-champagne" />
            <p className="text-ink">
              {st[e.status] ?? e.status}
              {e.message ? <span className="text-muted"> — {e.message}</span> : null}
            </p>
            <p className="text-xs text-muted-2">{formatDateTime(e.createdAt)}</p>
          </motion.li>
        ))}
        {events.length === 0 && <li className="text-[12.5px] text-muted-2">{copy.common.loading}</li>}
      </ul>

      {orderNumber && (
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-stone/70 pt-6">
          <p className="text-[12px] text-muted">{copy.tracking.problem}?</p>
          <OrderProblemButton orderNumber={orderNumber} email={verifiedEmail} isAuthed={!!isAuthed} />
        </div>
      )}
    </div>
  );
}
