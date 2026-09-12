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
import { Breadcrumbs, Field, PageHeader } from "@/components/ui/primitives";
import { OrderTimeline } from "@/components/account/order-timeline";
import { PackageIcon, TruckIcon, ExternalIcon } from "@/components/icons";
import { getCopy } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
export const metadata: Metadata = { title: "Suivre ma commande", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

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

  return (
    <div className="container-lux py-band">
      <Breadcrumbs items={[{ label: t.title }]} />
      <div className="mt-6">
        <PageHeader
          eyebrow={copy.header.tracking}
          title={t.title}
          description={t.intro}
          align="center"
        />
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <form className="space-y-4 border border-stone bg-cream p-6">
          <Field label={t.number}>
            <input name="n" defaultValue={n} placeholder="CL-260907-XXXXXXXX" required className="field" />
          </Field>
          <Field label={t.email}>
            <input name="e" type="email" defaultValue={e} required className="field" />
          </Field>
          <button className="btn-primary w-full">{t.submit}</button>
          <p className="text-center text-xs text-muted-2">{t.numberHint}</p>
        </form>

        {blocked && <p className="mt-6 border border-error/30 bg-error-soft px-4 py-3 text-sm text-error" role="alert">{t.tooMany}</p>}
        {!blocked && number && (email || k) && !order && (
          <p className="mt-6 border border-error/30 bg-error-soft px-4 py-3 text-sm text-error" role="alert">{t.notFound}</p>
        )}
      </div>

      {order && (
        <div className="mx-auto mt-12 max-w-4xl">
          {/* Order header */}
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-stone pb-8">
            <div>
              <p className="eyebrow mb-2">{t.order}</p>
              <p className="font-mono text-xl text-ink">{order.number}</p>
              <p className="mt-1 text-sm text-muted">{t.placedOn.replace("{date}", formatDate(order.createdAt))}</p>
            </div>
            <div className="text-end">
              <p className="eyebrow mb-2">{t.total}</p>
              <p className="text-xl font-medium tabular-nums text-ink">{formatDT(order.totalMillimes)}</p>
              <p className="mt-1 text-sm text-muted">{PAYMENT_LABELS[order.paymentMethod]}</p>
              <p className="mt-1 text-xs text-muted">
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

          {/* Timeline — seven statuses, problem one click away */}
          <div className="mt-10">
            <OrderTimeline
              status={order.status}
              events={order.events}
              paymentStatus={order.paymentStatus}
              orderNumber={order.number}
              verifiedEmail={order.email}
              isAuthed={!!me}
            />
          </div>

          {/* Products */}
          <div className="mt-12">
            <p className="eyebrow mb-4">{t.articles}</p>
            <ul className="divide-y divide-stone border-y border-stone">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 shrink-0 bg-stone">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{i.brandName}</p>
                    <p className="text-sm text-ink">{i.name}</p>
                    <p className="text-xs text-muted">{i.quantity} × {formatDT(i.unitPriceMillimes)}</p>
                  </div>
                  <span className="text-sm tabular-nums text-ink">{formatDT(i.lineTotalMillimes)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery + actions */}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="border border-stone bg-cream p-5 text-sm">
              <p className="eyebrow mb-2 flex items-center gap-2"><PackageIcon size={14} className="text-champagne-2" /> {t.deliveryBlock}</p>
              <p className="text-ink">{SHIPPING_LABELS[order.shippingMethod]}</p>
              {order.shippingMethod === "pickup" && (
                <p className="mt-1 text-[12.5px] text-muted">
                  {fmt(t.holdNote, { ready: formatDateTime(pickupWindow(order.createdAt).readyAt), hold: formatDateTime(pickupWindow(order.createdAt).holdUntil) })}
                </p>
              )}
              <p className="mt-1 text-charcoal">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.line1}{order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}<br />
                {order.shippingAddress.city}, {order.shippingAddress.governorate}
              </p>
              {order.trackingCode && (
                <div className="mt-3 border-t border-stone pt-3">
                  <p className="text-xs text-muted">{t.trackingCode}: <span className="font-mono text-ink">{order.trackingCode}</span></p>
                  <a
                    href={`https://t.17track.net/en#nums=${encodeURIComponent(order.trackingCode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink transition-colors hover:text-champagne-2"
                  >
                    <TruckIcon size={13} /> {t.carrierCta.replace("{carrier}", "17TRACK")} <ExternalIcon size={11} className="text-muted-2" />
                  </a>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3">
              <a href={invoiceHref} className="btn-primary w-full text-center">{t.invoice}</a>
              <a href={`/commande/confirmation/${order.number}${k && safeEqual(k, order.accessKey) ? `?k=${encodeURIComponent(k)}` : `?e=${encodeURIComponent(order.email.toLowerCase())}`}`} className="btn-secondary w-full text-center">{t.confirmation}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
