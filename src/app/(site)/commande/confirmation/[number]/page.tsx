import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDT } from "@/lib/money";
import { PAYMENT_LABELS, SHIPPING_LABELS } from "@/lib/orders";
import { safeEqual } from "@/lib/orders";
import { clientKey } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { deliveryEstimate } from "@/lib/tunisia";
import { pickupWindow } from "@/lib/fulfilment";
import { getCopy } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/config";
import { formatDateTime } from "@/lib/utils";
import { OrderTimeline } from "@/components/account/order-timeline";
import { DsAlert, Seal } from "@/components/feedback/feedback";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Commande confirmée", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Show `ines@x.tn` as `i••••@x.tn` — the customer knows their own address. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "votre adresse e-mail";
  return `${local.charAt(0)}${"•".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

export default async function ConfirmationPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ k?: string; e?: string }> }) {
  const { number } = await params;
  const { k, e } = await searchParams;
  const copy = await getCopy();
  const [o, user] = await Promise.all([db.query.orders.findFirst({ where: eq(orders.number, number.trim().toUpperCase()), with: { items: true, events: true } }), getCurrentUser()]);
  if (!o) notFound();

  /*
   * Authorisation. The order number alone is NOT a credential — it is short and
   * printable, and used to appear in e-mails, so anyone who guessed one could
   * previously read a stranger's name, address, e-mail and totals here.
   * Access requires ownership (session), the per-order access key handed back
   * at checkout, or — the guest path used by /suivi — the number paired with
   * the verified order e-mail, throttled so the page cannot enumerate orders.
   * Everything else is an indistinguishable 404.
   */
  const ownsIt = !!user && o.userId === user.id;
  const hasKey = safeEqual(k, o.accessKey);
  let byEmail = false;
  if (!ownsIt && !hasKey && e) {
    if (!(await rateLimit(`confirmation:${await clientKey()}`, 10, 600_000))) notFound();
    byEmail = o.email.toLowerCase() === e.trim().toLowerCase();
  }
  if (!ownsIt && !hasKey && !byEmail) notFound();

  const trackingHref = user && ownsIt ? `/compte/commandes/${o.number}` : `/suivi?n=${o.number}&e=${encodeURIComponent(o.email)}`;
  const invoiceHref = `/api/orders/${o.number}/invoice${hasKey && k ? `?k=${encodeURIComponent(k)}` : byEmail ? `?e=${encodeURIComponent(e!.trim().toLowerCase())}` : ""}`;
  const qty = o.items.reduce((a, i) => a + i.quantity, 0);

  return (
    <div className="shell py-10 lg:py-14">
      {/* ── The word of confirmation ────────────────────────────────── */}
      <div className="mx-auto max-w-2xl">
        <Reveal y={0}>
          <DsAlert kind="success" title="Merci — commande confirmée">
            Votre commande <span className="font-mono">{o.number}</span> est enregistrée. La confirmation part à {maskEmail(o.email)}.
          </DsAlert>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Seal kind="gold">{qty} article{qty > 1 ? "s" : ""}</Seal>
            <Seal kind="neutral">{SHIPPING_LABELS[o.shippingMethod]}</Seal>
            <Seal kind={o.paymentStatus === "paid" ? "success" : "neutral"}>{PAYMENT_LABELS[o.paymentMethod]}</Seal>
            <span className="ms-auto font-ant uppercase text-[1.5rem] tabular-nums text-carbon">{formatDT(o.totalMillimes)}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={trackingHref} className="btn-solid">Suivre ma commande</Link>
            <a href={invoiceHref} className="btn-outline">Facture PDF</a>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-12">
        {/* ── Contents + the road ───────────────────────────────────── */}
        <div className="min-w-0 lg:col-span-7">
          <p className="kicker-xs mb-4">Vos articles</p>
          <ul className="divide-y divide-line/70 border-y border-line/70" aria-label="Articles commandés">
            {o.items.map((i) => (
              <li key={i.id} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 bg-canvas-2">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-faint">{i.brandName}</p>
                  <p className="mt-0.5 text-sm leading-snug text-carbon">{i.name}</p>
                  <p className="mt-1 text-xs tabular-nums text-muted">{i.quantity} × {formatDT(i.unitPriceMillimes)}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-carbon">{formatDT(i.lineTotalMillimes)}</span>
              </li>
            ))}
          </ul>
          <p className="kicker-xs mb-4 mt-10">Suivi de votre commande</p>
          <OrderTimeline status={o.status} events={o.events} paymentStatus={o.paymentStatus} paymentMethod={o.paymentMethod} shippingMethod={o.shippingMethod} trackingCode={o.trackingCode} orderNumber={o.number} />
        </div>

        {/* ── What happens next ─────────────────────────────────────── */}
        <div className="space-y-5 text-sm lg:col-span-5">
          <div className="border border-line/70 bg-mist/60 p-5">
            <p className="kicker-xs mb-3">Prochaines étapes</p>
            <ol className="list-decimal space-y-2 pl-4 leading-relaxed text-carbon">
              <li>Notre équipe confirme votre commande par téléphone sous 24 h ouvrées.</li>
              <li>{o.shippingMethod === "pickup" ? "Nous vous appelons dès que la commande est prête en boutique." : `${SHIPPING_LABELS[o.shippingMethod]} — ${deliveryEstimate(o.shippingAddress.governorate, o.shippingMethod)}.`}</li>
              {o.shippingMethod === "pickup" && <li>{fmt(copy.tracking.holdNote, { ready: formatDateTime(pickupWindow(o.createdAt).readyAt), hold: formatDateTime(pickupWindow(o.createdAt).holdUntil) })}</li>}
              <li>{PAYMENT_LABELS[o.paymentMethod]} — {o.paymentMethod === "bank_transfer" ? copy.tracking.payNote.transfer : o.paymentMethod === "gift_card" ? copy.tracking.payNote.gift : copy.tracking.payNote.cod}</li>
            </ol>
          </div>
          <dl className="space-y-1.5 border border-line/70 bg-porcelain p-5">
            <div className="flex justify-between gap-4"><dt className="text-muted">Articles</dt><dd className="tabular-nums">{qty}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Sous-total</dt><dd className="tabular-nums">{formatDT(o.subtotalMillimes)}</dd></div>
            {o.discountMillimes > 0 && <div className="flex justify-between gap-4 text-ok"><dt>Remise</dt><dd className="tabular-nums">−{formatDT(o.discountMillimes)}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-muted">Livraison</dt><dd className="tabular-nums">{o.shippingMillimes ? formatDT(o.shippingMillimes) : "Offerte"}</dd></div>
            {o.giftWrapMillimes > 0 && <div className="flex justify-between gap-4"><dt className="text-muted">Emballage cadeau</dt><dd className="tabular-nums">{formatDT(o.giftWrapMillimes)}</dd></div>}
            <div className="flex justify-between gap-4 border-t border-line/70 pt-2 text-base text-carbon"><dt>Total</dt><dd className="font-medium tabular-nums">{formatDT(o.totalMillimes)}</dd></div>
          </dl>
          {o.giftWrap && (
            <div className="relative overflow-hidden border border-iodine-deep/40 bg-iodine-wash/40 p-5 text-sm">
              <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-iodine-deep" />
              <p className="kicker-xs mb-2 text-iodine-deep">Offert avec soin</p>
              <p className="text-carbon">Emballage cadeau de la maison.</p>
              {o.giftMessage && <p className="mt-2 border-t border-iodine-deep/25 pt-2 font-ant uppercase text-[15px] leading-relaxed text-carbon">«&nbsp;{o.giftMessage}&nbsp;»</p>}
            </div>
          )}
          <div className="border border-line/70 bg-porcelain p-5 text-sm">
            <p className="kicker-xs mb-2">Livraison</p>
            <p className="text-carbon">{SHIPPING_LABELS[o.shippingMethod]}</p>
            <p className="mt-1 leading-relaxed text-carbon">{o.shippingAddress.fullName}<br />{o.shippingAddress.line1}{o.shippingAddress.line2 && <><br />{o.shippingAddress.line2}</>}<br />{o.shippingAddress.city}, {o.shippingAddress.governorate}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/boutique" className="btn-ghost">Continuer mes achats</Link>
          </div>
          {!user && <p className="text-xs leading-relaxed text-faint">Conservez ce lien : il vous permet de retrouver votre commande et sa facture à tout moment. <Link href="/inscription" className="underline underline-offset-4">Créez un compte</Link> pour gérer vos commandes plus facilement.</p>}
        </div>
      </div>
    </div>
  );
}
