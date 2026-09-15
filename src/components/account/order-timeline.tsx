"use client";
import { motion, useReducedMotion } from "framer-motion";
import { CardIcon, CheckIcon, ExternalIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { ORDER_FLOW, PAYMENT_LABELS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EASE_LUXE } from "@/lib/motion";
import { useLocale } from "@/lib/i18n/client";
import { OrderProblemButton } from "@/components/experience/order-problem";

/**
 * THE ROAD OF THE PARCEL — the order journey, told completely.
 *
 * Where the order is (the five steps, each stamped with the moment it was
 * reached), what happened (the journal of house events), and what happens
 * next (the coming step, in plain words). The money and the carrier ride
 * alongside: payment method and state, tracking code when the house has
 * one. Nothing is invented — every stamp comes from the order's own events.
 */
type Ev = { status: OrderStatus; message: string | null; createdAt: Date | string };

export function OrderTimeline({
  status,
  events,
  paymentStatus,
  paymentMethod,
  shippingMethod,
  trackingCode,
  orderNumber,
  verifiedEmail,
  isAuthed,
}: {
  status: OrderStatus;
  events: Ev[];
  paymentStatus?: "pending" | "paid" | "refunded" | "failed";
  paymentMethod?: "cod" | "bank_transfer" | "card" | "gift_card";
  shippingMethod?: "standard" | "express" | "pickup";
  trackingCode?: string | null;
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

  // Each step is stamped with the first event that earned it — the journey's
  // own clock, never the current time pretending to be history.
  const firstAt = (pred: (e: Ev) => boolean): Ev["createdAt"] | null => events.find(pred)?.createdAt ?? null;
  const stepAt: Record<string, Ev["createdAt"] | null> = {
    confirmed: firstAt((e) => e.status === "confirmed") ?? firstAt((e) => e.status !== "pending"),
    preparing: firstAt((e) => e.status === "preparing"),
    shipped: firstAt((e) => e.status === "shipped"),
    delivering: firstAt((e) => e.status === "shipped" && /livraison|tournée|delivery/i.test(e.message ?? "")),
    delivered: firstAt((e) => e.status === "delivered"),
  };

  const nextKey = (["pending", "confirmed", "preparing", "shipped"] as const).find((s) => s === status);
  const pickupWait = shippingMethod === "pickup" && (status === "preparing" || status === "shipped");
  const nextText = pickupWait ? copy.tracking.nextStepPickup : nextKey ? copy.tracking.nextStep[nextKey] : null;

  const payLabel =
    paymentStatus === "paid"
      ? copy.tracking.paymentPaid
      : paymentStatus === "refunded"
        ? copy.tracking.paymentRefunded
        : paymentStatus === "failed"
          ? st.cancelled
          : copy.tracking.paymentPending;

  return (
    <div>
      {/* ── The money + the carrier ride alongside ────────────────────── */}
      {(paymentMethod || trackingCode) && !terminal && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {paymentMethod && (
            <div className="flex items-center gap-3.5 border border-stone/60 bg-cream/50 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne-2/40 bg-champagne-soft/60 text-champagne-2">
                <CardIcon size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted-2">
                  {copy.tracking.paymentBlock}
                </span>
                <span className="mt-0.5 block truncate text-[13.5px] text-ink">
                  {PAYMENT_LABELS[paymentMethod]}
                  <span
                    className={`ms-2 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      paymentStatus === "paid" ? "text-success" : paymentStatus === "refunded" ? "text-champagne-2" : "text-muted-2"
                    }`}
                  >
                    · {payLabel}
                  </span>
                </span>
              </span>
            </div>
          )}
          {trackingCode && (
            <div className="flex items-center gap-3.5 border border-stone/60 bg-cream/50 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-champagne-2/40 bg-champagne-soft/60 text-champagne-2">
                <TruckIcon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted-2">
                  {copy.tracking.trackingCode}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[13px] text-ink">{trackingCode}</span>
              </span>
              <a
                href={`https://t.17track.net/en#nums=${encodeURIComponent(trackingCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.tracking.carrierCta.replace("{carrier}", "17TRACK")}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone/60 text-muted transition-colors hover:border-champagne-2 hover:text-champagne-2"
              >
                <ExternalIcon size={13} />
              </a>
            </div>
          )}
        </div>
      )}
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
            const at = stepAt[f.key];
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
                {on && at && (
                  <span className="mt-1 hidden text-[10.5px] tabular-nums text-muted-2 sm:block" title={formatDateTime(at)}>
                    {formatDate(at, { day: "numeric", month: "short" })}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* ── What happens next ─────────────────────────────────────────── */}
      {!terminal && nextText && (
        <div className="mt-8 flex items-start gap-4 border border-champagne-2/30 bg-champagne-soft/40 px-5 py-4">
          <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-champagne-2" />
          <p className="text-[13.5px] leading-relaxed text-charcoal">
            <span className="me-2 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-2">{copy.tracking.nextLabel}</span>
            {nextText}
          </p>
        </div>
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

      {status === "delivered" && (
        <p className="mt-6 border-t border-stone/70 pt-5 text-[12.5px] leading-relaxed text-muted">{copy.tracking.deliveredNote}</p>
      )}
      {orderNumber && (
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-stone/70 pt-6">
          <p className="text-[12px] text-muted">{copy.tracking.problem}?</p>
          <OrderProblemButton orderNumber={orderNumber} email={verifiedEmail} isAuthed={!!isAuthed} />
          {/* P06 — one human lane, order number already in the message. */}
          <a
            href={`https://wa.me/21671450210?text=${encodeURIComponent(`Commande ${orderNumber} — ${copy.tracking.problem}`)}`}
            target="_blank"
            rel="noopener"
            className="link-underline inline-flex min-h-11 items-center gap-1.5 text-[12px]"
          >
            <WhatsAppIcon size={13} /> {copy.tracking.waHelp}
          </a>
        </div>
      )}
    </div>
  );
}
