import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orders, returnRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { formatDT } from "@/lib/money";
import { returnWindow } from "@/lib/returns";
import { formatDate } from "@/lib/utils";
import { PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/order-constants";
import { OrderTimeline } from "@/components/account/order-timeline";
import { OrderActions } from "@/components/account/order-actions";
import { ReturnForm } from "@/components/account/return-form";
import { Reveal } from "@/components/motion/reveal";
import { Seal, DsAlert } from "@/components/feedback/feedback";
import { statusSeal } from "@/components/orders/order-cards";
import { ArrowLeftIcon, MapPinIcon, CardIcon, TruckIcon, DownloadIcon } from "@/components/icons";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";

export const dynamic = "force-dynamic";

/**
 * LA COMMANDE — one order, told in one breath.
 *
 * The number and its seals open the chapter, the road of the parcel runs
 * the DaisyUI timeline beneath, the contents read as a ledger, and the
 * money, delivery and payment each keep a small strip on the side. The
 * return gesture lives at the foot inside its seven-day window.
 */
export default async function CommandePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await getCurrentUser();
  const copy = await getCopy();
  if (!user) redirect("/connexion?next=/compte/commandes");
  const o = await db.query.orders.findFirst({
    where: and(eq(orders.number, number.trim().toUpperCase()), eq(orders.userId, user.id)),
    with: { items: true, events: true },
  });
  if (!o) notFound();

  // Items already requested for return
  const existingReturns = await db
    .select({ itemId: returnRequests.orderItemId })
    .from(returnRequests)
    .where(eq(returnRequests.orderId, o.id));
  const returnedItemIds = new Set(existingReturns.map((r) => r.itemId));
  // The return CTA appears only inside the promised window: 7 days from the
  // delivered event. Outside it, the page says so plainly and hands the
  // customer to the counter instead of a dead form.
  const [deliveryEvent] =
    o.status === "delivered"
      ? await db
          .select({ at: orderEvents.createdAt })
          .from(orderEvents)
          .where(and(eq(orderEvents.orderId, o.id), eq(orderEvents.status, "delivered")))
          .orderBy(orderEvents.id)
          .limit(1)
      : [null];
  const win = returnWindow(deliveryEvent?.at ?? null, new Date());
  const returnable = o.status === "delivered" && win.open;
  const returnableItems = o.items.filter((i) => !returnedItemIds.has(i.id));
  const qty = o.items.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="space-y-8">
      <Link
        href="/compte/commandes"
        className="group inline-flex min-h-11 items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeftIcon size={13} className="transition-transform duration-500 group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
        Mes commandes
      </Link>

      {/* ── The chapter head ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-stone/70 pb-6">
        <div className="min-w-0">
          <p className="eyebrow mb-2.5">Commande du {formatDate(o.createdAt)}</p>
          <h1 className="truncate font-mono text-[clamp(1.2rem,3.4vw,1.7rem)] text-ink">{o.number}</h1>
          <p className="mt-2 text-[13px] text-muted">
            {qty} article{qty > 1 ? "s" : ""} · {formatDT(o.totalMillimes)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Seal kind={statusSeal(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Seal>
            <Seal kind={o.paymentStatus === "paid" ? "success" : "neutral"}>{PAYMENT_LABELS[o.paymentMethod]}</Seal>
          </div>
        </div>
        <a href={`/api/orders/${o.number}/invoice`} className="btn-secondary !min-h-12 !px-5">
          <DownloadIcon size={14} aria-hidden /> Facture PDF
        </a>
      </div>

      {/* ── The road of the parcel ──────────────────────────────────── */}
      <Reveal y={14} amount={0.05}>
        <div className="border border-stone/60 bg-ivory p-6 shadow-whisper sm:p-8">
          <p className="rule-label mb-8 text-champagne-2">Le suivi du colis</p>
          <OrderTimeline
            status={o.status}
            events={o.events}
            paymentStatus={o.paymentStatus}
            paymentMethod={o.paymentMethod}
            shippingMethod={o.shippingMethod}
            trackingCode={o.trackingCode}
            orderNumber={o.number}
            isAuthed
          />
        </div>
      </Reveal>

      <OrderActions orderId={o.id} status={o.status} />

      {/* ── Contents + the money ────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Reveal y={14} amount={0.05} className="lg:col-span-7">
          <div className="h-full border border-stone/60 bg-ivory p-6 shadow-whisper sm:p-7">
            <p className="rule-label mb-6 text-champagne-2">Les articles</p>
            <ul className="divide-y divide-stone/60">
              {o.items.map((i) => (
                <li key={i.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 sm:gap-5">
                  <div className="relative h-[84px] w-[68px] shrink-0 overflow-hidden bg-marble">
                    {i.image && <Image src={i.image} alt={i.name} fill sizes="68px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted-2">{i.brandName}</p>
                    <p className="mt-1 font-display text-[16px] leading-snug text-ink">{i.name}</p>
                    <p className="mt-1 text-[12.5px] tabular-nums text-muted">
                      {i.quantity} × {formatDT(i.unitPriceMillimes)}
                    </p>
                    {returnedItemIds.has(i.id) && (
                      <p className="mt-2 inline-flex bg-warning-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-warning">
                        Retour demandé
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[14px] font-medium tabular-nums text-ink">
                    {formatDT(i.lineTotalMillimes)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <div className="space-y-5 lg:col-span-5">
          <Reveal y={14} delay={0.06} amount={0.05}>
            <div className="border border-stone/60 bg-ivory p-6 shadow-whisper sm:p-7">
              <p className="rule-label mb-5 text-champagne-2">Le détail</p>
              <dl className="space-y-3 text-[13.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Sous-total</dt>
                  <dd className="tabular-nums text-ink">{formatDT(o.subtotalMillimes)}</dd>
                </div>
                {o.discountMillimes > 0 && (
                  <div className="flex justify-between gap-4 text-success">
                    <dt>Remise {o.promoCode}</dt>
                    <dd className="tabular-nums">−{formatDT(o.discountMillimes)}</dd>
                  </div>
                )}
                {o.loyaltySpent > 0 && (
                  <div className="flex justify-between gap-4 text-success">
                    <dt>Points fidélité utilisés</dt>
                    <dd className="tabular-nums">−{formatDT(o.loyaltySpent * 10)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Livraison</dt>
                  <dd className="tabular-nums text-ink">{o.shippingMillimes ? formatDT(o.shippingMillimes) : "Offerte"}</dd>
                </div>
                {o.giftWrapMillimes > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Emballage cadeau</dt>
                    <dd className="tabular-nums text-ink">{formatDT(o.giftWrapMillimes)}</dd>
                  </div>
                )}
                {o.giftWrap && o.giftMessage && (
                  <div className="border border-champagne-2/30 bg-champagne-soft/40 px-4 py-3">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-2">Mot pour le destinataire</dt>
                    <dd className="mt-1.5 font-display text-[15px] italic leading-relaxed text-ink">«&nbsp;{o.giftMessage}&nbsp;»</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-stone/60 pt-4">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">Total</dt>
                  <dd className="font-display text-[24px] tabular-nums leading-none text-ink">
                    {formatDT(o.totalMillimes)}
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal y={14} delay={0.12} amount={0.05}>
            <div className="border border-stone/60 bg-cream/60 p-6">
              <p className="rule-label mb-4 text-champagne-2">Livraison</p>
              <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                <TruckIcon size={15} className="shrink-0 text-champagne-2" />
                {SHIPPING_LABELS[o.shippingMethod]}
              </p>
              <p className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed text-charcoal">
                <MapPinIcon size={15} className="mt-0.5 shrink-0 text-muted-2" />
                <span>
                  {o.shippingAddress.fullName}
                  <br />
                  {o.shippingAddress.line1}
                  {o.shippingAddress.line2 && (
                    <>
                      <br />
                      {o.shippingAddress.line2}
                    </>
                  )}
                  <br />
                  {o.shippingAddress.city}, {o.shippingAddress.governorate}
                  <br />
                  {o.shippingAddress.phone}
                </span>
              </p>
            </div>
          </Reveal>

          <Reveal y={14} delay={0.18} amount={0.05}>
            <div className="border border-stone/60 bg-cream/60 p-6">
              <p className="rule-label mb-4 text-champagne-2">Paiement</p>
              <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                <CardIcon size={15} className="shrink-0 text-champagne-2" />
                {PAYMENT_LABELS[o.paymentMethod]}
              </p>
              {o.trackingCode && (
                <div className="mt-4 border-t border-stone/60 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-2">Suivi transporteur</p>
                  <p className="mt-2 truncate font-mono text-[13.5px] text-ink">{o.trackingCode}</p>
                  <a
                    href={`https://t.17track.net/en#nums=${encodeURIComponent(o.trackingCode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline mt-3 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-champagne-2 transition-colors hover:text-ink"
                  >
                    Suivre le colis (17TRACK)
                  </a>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      {returnable && returnableItems.length > 0 && (
        <Reveal y={14} amount={0.05}>
          <div className="relative max-w-2xl overflow-hidden border border-stone/60 bg-ivory p-6 shadow-whisper sm:p-8">
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-champagne-2 to-transparent" />
            <ReturnForm
              orderId={o.id}
              items={returnableItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity }))}
              daysLeft={win.daysLeft}
            />
          </div>
        </Reveal>
      )}
      {o.status === "delivered" && !win.open && returnableItems.length > 0 && (
        <Reveal y={10} amount={0.05}>
          <div className="max-w-2xl">
            <DsAlert kind="warning" title="Le formulaire est fermé">
              Les sept jours après réception sont passés. Le comptoir, lui, reste ouvert : une demande au cas par cas
              se fait depuis <Link href="/aide" className="link-underline text-ink">l&apos;aide</Link>.
            </DsAlert>
          </div>
        </Reveal>
      )}
      <Reveal y={10} amount={0.05}>
        <div className="max-w-2xl border-t border-stone/60 pt-6">
          <p className="text-[13px] leading-relaxed text-muted">
            {copy.chat.live.orderHelp}{" "}
            <Link href={`/compte/support?order=${encodeURIComponent(o.number)}`} className="link-underline text-ink">
              {copy.chat.button}
            </Link>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
