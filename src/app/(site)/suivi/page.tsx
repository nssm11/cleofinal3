import type { Metadata } from "next";
import Image from "next/image";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, type Order, type OrderEvent, type OrderItem } from "@/db/schema";
import { safeEqual, PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { clientKey } from "@/lib/origin";
import { formatDT } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { fmt } from "@/lib/i18n/config";
import { pickupWindow } from "@/lib/fulfilment";
import { Breadcrumbs, Field } from "@/components/ui/primitives";
import { OrderTimeline } from "@/components/account/order-timeline";
import { DsAlert, Seal } from "@/components/feedback/feedback";
import { PackageIcon, TruckIcon, ExternalIcon, SearchIcon } from "@/components/icons";
import { getCopy } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";

export const metadata: Metadata = { title: "Suivre ma commande", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * THE COUNTER WINDOW — order tracking, rebuilt on the timeline.
 *
 * The form is the first thing the eye meets (number + e-mail, one gesture);
 * the answer opens beneath it: the order's own seals, the road of the
 * parcel on the DaisyUI timeline, the contents as a ledger, and the money
 * and delivery each in their own strip. Same guards as ever — number plus
 * a second factor, throttled — only the telling is new.
 */
export default async function SuiviPage({ searchParams }: { searchParams: Promise<{ n?: string; e?: string; k?: string }> }) {
  const [{ n, e, k }, copy, me] = await Promise.all([searchParams, getCopy(), getCurrentUser()]);
  const t = copy.tracking;
  const number = n?.trim().toUpperCase();
  const email = e?.trim().toLowerCase();
  let order: (Order & { events: OrderEvent[]; items: OrderItem[] }) | null = null;
  let blocked = false;

  if (number && (email || k)) {
    // Throttled so the form cannot be used to enumerate order numbers.
    if (!(await rateLimit(`suivi:${await clientKey()}`, 20, 600_000))) {
      blocked = true;
    } else {
      const candidates = await db.query.orders.findMany({ where: eq(orders.number, number), with: { events: true, items: true }, limit: 1 });
      const candidate = candidates[0];
      if (candidate) {
        // Order number + a second factor: the verified e-mail, or the per-order
        // access key issued at checkout. The number alone is never sufficient.
        const byEmail = !!email && candidate.email.toLowerCase() === email;
        const byKey = safeEqual(k, candidate.accessKey);
        if (byEmail || byKey) order = candidate;
      }
    }
  }

  const invoiceHref = order ? `/api/orders/${order.number}/invoice${k && safeEqual(k, order.accessKey) ? `?k=${encodeURIComponent(k)}` : email ? `?e=${encodeURIComponent(email)}` : ""}` : "#";
  const lookedUp = !blocked && !!number && !!(email || k);

  return (
    <div className="shell py-10 lg:py-14">
      <Breadcrumbs items={[{ label: t.title }]} />

      <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* ── The question ─────────────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="kicker-xs">{copy.header.tracking}</p>
            <h1 className="mt-3 font-ant uppercase text-[clamp(1.9rem,4.4vw,2.9rem)] leading-[1.02] tracking-[-0.024em] text-carbon">
              {t.title}
            </h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-muted">{t.intro}</p>

            <form className="mt-7 space-y-4 border border-line/70 bg-porcelain p-5 shadow-sheet sm:p-6" aria-label={t.title}>
              <Field label={t.number}>
                <input name="n" defaultValue={n} placeholder="CL-260907-XXXXXXXX" required autoComplete="off" className="field-box font-mono !text-[13px]" />
              </Field>
              <Field label={t.email}>
                <input name="e" type="email" defaultValue={e} required autoComplete="email" className="field-box" />
              </Field>
              <button className="btn-solid w-full">
                <SearchIcon size={14} aria-hidden /> {t.submit}
              </button>
              <p className="text-center text-xs leading-relaxed text-faint">{t.numberHint}</p>
            </form>

            <div className="mt-5 space-y-3">
              {blocked && <DsAlert kind="warning" title={t.tooMany} />}
              {lookedUp && !order && <DsAlert kind="error" title={t.notFound} />}
            </div>
          </div>
        </div>

        {/* ── The answer ───────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          {order ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line/70 pb-6">
                <div className="min-w-0">
                  <p className="kicker-xs mb-2">{t.order}</p>
                  <p className="truncate font-mono text-[clamp(1.05rem,3vw,1.4rem)] text-carbon">{order.number}</p>
                  <p className="mt-1.5 text-[13px] text-muted">{t.placedOn.replace("{date}", formatDate(order.createdAt))}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Seal kind={order.status === "delivered" ? "success" : order.status === "cancelled" || order.status === "returned" ? "error" : "gold"}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Seal>
                    <Seal kind={order.paymentStatus === "paid" ? "success" : "neutral"}>{PAYMENT_LABELS[order.paymentMethod]}</Seal>
                  </div>
                </div>
                <div className="text-end">
                  <p className="kicker-xs mb-2">{t.total}</p>
                  <p className="font-ant uppercase text-[clamp(1.5rem,3.4vw,2rem)] tabular-nums text-carbon">{formatDT(order.totalMillimes)}</p>
                  <p className="mt-1 max-w-[16rem] text-[12px] leading-relaxed text-muted">
                    {order.paymentStatus === "paid"
                      ? t.payNote.paid
                      : order.paymentStatus === "failed"
                        ? t.payNote.failed
                        : order.paymentMethod === "bank_transfer"
                          ? t.payNote.transfer
                          : order.paymentMethod === "gift_card"
                            ? t.payNote.gift
                            : t.payNote.cod}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <OrderTimeline
                  status={order.status}
                  events={order.events}
                  paymentStatus={order.paymentStatus}
                  paymentMethod={order.paymentMethod}
                  shippingMethod={order.shippingMethod}
                  trackingCode={order.trackingCode}
                  orderNumber={order.number}
                  verifiedEmail={order.email}
                  isAuthed={!!me}
                />
              </div>

              <div className="mt-10">
                <p className="kicker-xs mb-4">{t.articles}</p>
                <ul className="divide-y divide-line/70 border-y border-line/70">
                  {order.items.map((i) => (
                    <li key={i.id} className="flex gap-4 py-4">
                      <div className="relative h-20 w-16 shrink-0 bg-canvas-2">
                        {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{i.brandName}</p>
                        <p className="mt-0.5 text-sm leading-snug text-carbon">{i.name}</p>
                        <p className="mt-1 text-xs tabular-nums text-muted">{i.quantity} × {formatDT(i.unitPriceMillimes)}</p>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums text-carbon">{formatDT(i.lineTotalMillimes)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="border border-line/70 bg-mist/60 p-5 text-sm">
                  <p className="kicker-xs mb-2 flex items-center gap-2"><PackageIcon size={14} className="text-iodine-deep" /> {t.deliveryBlock}</p>
                  <p className="text-carbon">{SHIPPING_LABELS[order.shippingMethod]}</p>
                  {order.shippingMethod === "pickup" && (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      {fmt(t.holdNote, { ready: formatDateTime(pickupWindow(order.createdAt).readyAt), hold: formatDateTime(pickupWindow(order.createdAt).holdUntil) })}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-carbon">
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.line1}{order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.governorate}
                  </p>
                  {order.trackingCode && (
                    <div className="mt-3 border-t border-line/70 pt-3">
                      <p className="text-xs text-muted">{t.trackingCode}: <span className="font-mono text-carbon">{order.trackingCode}</span></p>
                      <a
                        href={`https://t.17track.net/en#nums=${encodeURIComponent(order.trackingCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-carbon transition-colors hover:text-iodine-deep"
                      >
                        <TruckIcon size={13} /> {t.carrierCta.replace("{carrier}", "17TRACK")} <ExternalIcon size={11} className="text-faint" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <a href={invoiceHref} className="btn-solid w-full text-center">{t.invoice}</a>
                  <a href={`/commande/confirmation/${order.number}${k && safeEqual(k, order.accessKey) ? `?k=${encodeURIComponent(k)}` : `?e=${encodeURIComponent(order.email.toLowerCase())}`}`} className="btn-outline w-full text-center">{t.confirmation}</a>
                </div>
              </div>
            </div>
          ) : (
            !lookedUp && (
              <div className="hidden h-full min-h-[24rem] flex-col items-center justify-center border border-dashed border-line/70 bg-mist/40 px-8 text-center lg:flex">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-iodine-deep/40 bg-iodine-wash/60 text-iodine-deep">
                  <TruckIcon size={22} strokeWidth={1.4} />
                </span>
                <p className="mt-6 max-w-sm font-ant uppercase text-[clamp(1.25rem,2.6vw,1.6rem)] leading-snug text-carbon">
                  {t.intro}
                </p>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">{t.numberHint}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
