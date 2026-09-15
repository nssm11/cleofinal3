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
import { AccountCard, AccountHeader, cardPad, StatusDot } from "@/components/account/account-ui";
import { Reveal } from "@/components/motion/reveal";
import { ArrowLeftIcon, MapPinIcon, CardIcon, TruckIcon } from "@/components/icons";
import { ORDER_STATUS_LABELS } from "@/lib/order-constants";

export const dynamic = "force-dynamic";

/**
 * LA COMMANDE — one order, told editorially.
 *
 * The number opens the chapter, the road of the parcel runs beneath it, the
 * contents are listed as a ledger of frames, and the money, the delivery and
 * the payment each get their own small room on the right. The return
 * gesture lives at the foot, inside its seven-day window — no more, no less.
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
        <ArrowLeftIcon size={13} className="transition-transform duration-500 group-hover:-translate-x-1" />
        Mes commandes
      </Link>

      <AccountHeader
        eyebrow={`Commande du ${formatDate(o.createdAt)}`}
        title={o.number}
        description={`${qty} article${qty > 1 ? "s" : ""} · ${formatDT(o.totalMillimes)}`}
      />

      <div className="flex items-center justify-between gap-4">
        <StatusDot status={o.status} label={ORDER_STATUS_LABELS[o.status]} className="text-[11px]" />
        <a href={`/api/orders/${o.number}/invoice`} className="btn-secondary">
          Télécharger la facture PDF
        </a>
      </div>

      {/* ── The road of the parcel ────────────────────────────────────── */}
      <Reveal y={14} amount={0.05}>
        <AccountCard accent>
          <div className={cardPad}>
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
        </AccountCard>
      </Reveal>

      <OrderActions orderId={o.id} status={o.status} />

      {/* ── Contents + the money ──────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Reveal y={14} amount={0.05} className="lg:col-span-7">
          <AccountCard className="h-full">
            <div className={cardPad}>
              <p className="rule-label mb-7 text-champagne-2">Les articles</p>
              <ul className="divide-y divide-stone/60">
                {o.items.map((i) => (
                  <li key={i.id} className="flex gap-5 py-5 first:pt-0 last:pb-0">
                    <div className="relative h-[88px] w-[72px] shrink-0 overflow-hidden rounded-[2px] bg-marble">
                      {i.image && <Image src={i.image} alt={i.name} fill sizes="72px" className="object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted-2">{i.brandName}</p>
                      <p className="mt-1 font-display text-[16px] leading-snug text-ink">{i.name}</p>
                      <p className="mt-1.5 text-[12.5px] text-muted">
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
          </AccountCard>
        </Reveal>

        <div className="space-y-6 lg:col-span-5">
          <Reveal y={14} delay={0.06} amount={0.05}>
            <AccountCard>
              <div className={cardPad}>
                <p className="rule-label mb-6 text-champagne-2">Le détail</p>
                <dl className="space-y-3 text-[13.5px]">
                  <div className="flex justify-between">
                    <dt className="text-muted">Sous-total</dt>
                    <dd className="tabular-nums text-ink">{formatDT(o.subtotalMillimes)}</dd>
                  </div>
                  {o.discountMillimes > 0 && (
                    <div className="flex justify-between text-success">
                      <dt>
                        Remise {o.promoCode}
                      </dt>
                      <dd className="tabular-nums">−{formatDT(o.discountMillimes)}</dd>
                    </div>
                  )}
                  {o.loyaltySpent > 0 && (
                    <div className="flex justify-between text-success">
                      <dt>Points fidélité utilisés</dt>
                      <dd className="tabular-nums">−{formatDT(o.loyaltySpent * 10)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted">Livraison</dt>
                    <dd className="tabular-nums text-ink">{o.shippingMillimes ? formatDT(o.shippingMillimes) : "Offerte"}</dd>
                  </div>
                  {o.giftWrapMillimes > 0 && (
                    <div className="flex justify-between">
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
                  <div className="flex items-baseline justify-between border-t border-stone/60 pt-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">Total</dt>
                    <dd className="font-display text-[24px] tabular-nums leading-none text-ink">
                      {formatDT(o.totalMillimes)}
                    </dd>
                  </div>
                </dl>
              </div>
            </AccountCard>
          </Reveal>

          <Reveal y={14} delay={0.12} amount={0.05}>
            <AccountCard>
              <div className={cardPad}>
                <p className="rule-label mb-5 text-champagne-2">Livraison</p>
                <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                  <TruckIcon size={15} className="text-champagne-2" />
                  {SHIPPING_LABELS[o.shippingMethod]}
                </p>
                <p className="mt-4 flex items-start gap-2.5 text-[13px] leading-relaxed text-charcoal">
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
            </AccountCard>
          </Reveal>

          <Reveal y={14} delay={0.18} amount={0.05}>
            <AccountCard>
              <div className={cardPad}>
                <p className="rule-label mb-5 text-champagne-2">Paiement</p>
                <p className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                  <CardIcon size={15} className="text-champagne-2" />
                  {PAYMENT_LABELS[o.paymentMethod]}
                </p>
                {o.trackingCode && (
                  <div className="mt-5 border-t border-stone/60 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-2">Suivi transporteur</p>
                    <p className="mt-2 font-mono text-[13.5px] text-ink">{o.trackingCode}</p>
                    <a
                      href={`https://t.17track.net/en#nums=${encodeURIComponent(o.trackingCode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-champagne-2 transition-colors hover:text-ink"
                    >
                      Suivre le colis (17TRACK)
                    </a>
                  </div>
                )}
              </div>
            </AccountCard>
          </Reveal>
        </div>
      </div>

      {returnable && returnableItems.length > 0 && (
        <Reveal y={14} amount={0.05}>
          <AccountCard accent className="max-w-2xl">
            <div className={cardPad}>
              <ReturnForm
                orderId={o.id}
                items={returnableItems.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity }))}
                daysLeft={win.daysLeft}
              />
            </div>
          </AccountCard>
        </Reveal>
      )}
      {o.status === "delivered" && !win.open && returnableItems.length > 0 && (
        <Reveal y={10} amount={0.05}>
          <div className="max-w-2xl rounded-[3px] border border-dashed border-stone-2/70 bg-cream/50 px-6 py-6">
            <p className="text-[13px] leading-relaxed text-muted">
              Les sept jours après réception sont passés — le formulaire est fermé. Le comptoir, lui, reste ouvert :
              une demande au cas par cas se fait depuis <Link href="/aide" className="link-underline text-ink">l&apos;aide</Link>.
            </p>
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
