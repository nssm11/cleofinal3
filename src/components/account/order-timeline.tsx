"use client";
import { CardIcon, CheckIcon, ExternalIcon, GiftIcon, MapPinIcon, PackageIcon, TruckIcon, WarningIcon } from "@/components/icons";
import { ORDER_FLOW, PAYMENT_LABELS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import { OrderProblemButton } from "@/components/experience/order-problem";
import { DsAlert, Seal } from "@/components/feedback/feedback";

/**
 * THE ROAD OF THE PARCEL — the order journey on the DaisyUI timeline.
 *
 *   timeline timeline-snap-icon max-md:timeline-compact timeline-vertical
 *
 * Five data-driven steps (confirmed → preparing → shipped → delivering →
 * delivered), each stamped with the first event that earned it — the
 * journey's own clock, never the current time pretending to be history.
 * Desktop alternates across the centre rail; the phone docks the rail at
 * the edge and reads every event in one column (compact, automatic).
 * Completed steps are ink, the current step is champagne and prominent,
 * upcoming steps stay quiet. Terminal orders (cancelled / returned) speak
 * as an alert instead of a road that leads nowhere.
 */
type Ev = { status: OrderStatus; message: string | null; createdAt: Date | string };

const STEP_GLYPH = {
  confirmed: CheckIcon,
  preparing: PackageIcon,
  shipped: TruckIcon,
  delivering: MapPinIcon,
  delivered: GiftIcon,
} as const;

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
  const { copy, locale } = useLocale();
  const st = copy.tracking.statuses;
  const steps = copy.tracking.steps;
  const journalLabel = locale === "tn-arab" ? "سجل الطرد" : "Journal du colis";

  const delivering = events.some((e) => /livraison|tournée|delivery/i.test(e.message ?? ""));
  const terminal = status === "cancelled" || status === "returned";

  type Step = { key: keyof typeof STEP_GLYPH; label: string };
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
        <div className="mb-10 grid gap-3 sm:grid-cols-2">
          {paymentMethod && (
            <div className="flex items-center gap-3.5 border border-stone/60 bg-cream/60 px-4 py-3.5">
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
            <div className="flex items-center gap-3.5 border border-stone/60 bg-cream/60 px-4 py-3.5">
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
        <DsAlert kind="error" title={status === "cancelled" ? st.cancelled : st.returned}>
          {paymentStatus === "refunded" ? <span className="alert-title mt-2">{st.refunded}</span> : null}
          {events.length > 0 && events[events.length - 1]?.message ? (
            <span className="mt-1 block">{events[events.length - 1]?.message}</span>
          ) : null}
        </DsAlert>
      ) : (
        <ul className="timeline timeline-snap-icon timeline-vertical" aria-label={copy.tracking.title}>
          {flow.map((f, i) => {
            const on = reached[f.key];
            const current = i === lastIdx;
            const at = stepAt[f.key];
            const Glyph = on && !current ? CheckIcon : STEP_GLYPH[f.key];
            const state = on ? (current ? "now" : "done") : "todo";
            const left = i % 2 === 0;
            const body = (
              <>
                {on && at ? (
                  <time dateTime={new Date(at).toISOString()} title={formatDateTime(at)}>
                    {formatDate(at, { day: "numeric", month: "short" })}
                  </time>
                ) : (
                  <time aria-hidden>{String(i + 1).padStart(2, "0")}</time>
                )}
                <p className="timeline-title">{f.label}</p>
                {current && nextText ? <p className="timeline-note">{nextText}</p> : null}
              </>
            );
            return (
              <li key={f.key} data-state={state} aria-current={current ? "step" : undefined}>
                {left ? <div className="timeline-start">{body}</div> : <div className="timeline-start" aria-hidden />}
                <div className="timeline-middle">
                  <Glyph size={16} aria-hidden />
                </div>
                {left ? <div className="timeline-end" aria-hidden /> : <div className="timeline-end">{body}</div>}
                <hr aria-hidden />
              </li>
            );
          })}
        </ul>
      )}

      {/* ── What happened, in the house's own words ────────────────────── */}
      {events.length > 0 && (
        <details className="group mt-10 border border-stone/60 bg-cream/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            {journalLabel}
            <span className="flex items-center gap-2">
              <Seal kind={terminal ? "error" : "gold"}>{events.length}</Seal>
              <span aria-hidden className="text-champagne-2 transition-transform duration-300 group-open:rotate-180">▾</span>
            </span>
          </summary>
          <ul className="space-y-4 border-t border-stone/60 px-5 py-5">
            {events.map((e, i) => (
              <li key={i} className="relative border-s-2 border-champagne-3/60 ps-4 text-sm">
                <p className="text-ink">
                  {st[e.status] ?? e.status}
                  {e.message ? <span className="text-muted"> — {e.message}</span> : null}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-2">{formatDateTime(e.createdAt)}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {status === "pending" && !terminal && (
        <div className="mt-8">
          <DsAlert kind="info" title={copy.tracking.nextLabel}>
            {copy.tracking.nextStep.pending}
          </DsAlert>
        </div>
      )}

      {status === "delivered" && (
        <p className="mt-6 border-t border-stone/70 pt-5 text-[12.5px] leading-relaxed text-muted">{copy.tracking.deliveredNote}</p>
      )}

      {orderNumber && (
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-stone/70 pt-6">
          <p className="inline-flex items-center gap-2 text-[12px] text-muted">
            <WarningIcon size={13} className="text-champagne-2" /> {copy.tracking.problem} ?
          </p>
          <OrderProblemButton orderNumber={orderNumber} email={verifiedEmail} isAuthed={!!isAuthed} />
          <a
            href={`https://wa.me/21671450210?text=${encodeURIComponent(`Commande ${orderNumber} — ${copy.tracking.problem}`)}`}
            target="_blank"
            rel="noopener"
            className="link-underline inline-flex min-h-11 items-center gap-1.5 text-[12px]"
          >
            {copy.tracking.waHelp}
          </a>
        </div>
      )}
    </div>
  );
}
