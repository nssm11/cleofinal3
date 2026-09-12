"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, GiftIcon, HeartIcon, ShieldIcon, StoreIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { QtyStepper } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toaster";
import { formatDT, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import { EASE_LUXE, D } from "@/lib/motion";
import { toggleWishlistAction } from "@/actions/shop";
import { useCopy } from "@/lib/i18n/client";
import { createSubscriptionAction, subscribeRestockAction } from "@/actions/experience";

type P = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  priceMillimes: number;
  compareAtMillimes: number | null;
  stock: number;
  lowStockThreshold: number;
  volume: string | null;
};

/**
 * LE COMPTOIR — the purchase panel, and now the little counter of services:
 * stock stated as a calm meter, a restock bell when the shelf is empty, the
 * subscription lever, the gift gesture, the sticky mobile bar. The button
 * states its own price; the promises repeat the house's — nothing is invented
 * at the point of sale.
 */
export function BuyBox({
  p,
  wished,
  isAuthed,
  giftMode = false,
  restockSubscribed = false,
  subscribed = false,
}: {
  p: P;
  wished: boolean;
  isAuthed: boolean;
  giftMode?: boolean;
  restockSubscribed?: boolean;
  subscribed?: boolean;
}) {
  const cart = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const reduce = useReducedMotion();
  const copy = useCopy();
  const t = copy.product;
  const plateRef = useRef<HTMLDivElement>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [w, setW] = useState(wished);
  const [pending, start] = useTransition();
  const [alert, setAlert] = useState<"idle" | "open" | "done">(restockSubscribed ? "done" : "idle");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertWa, setAlertWa] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [subFreq, setSubFreq] = useState(30);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockThreshold;

  const line = {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brandName,
    image: p.image,
    priceMillimes: p.priceMillimes,
    stock: p.stock,
    volume: p.volume,
  };

  const add = () => {
    if (out) return;
    cart.add(line, qty, plateRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast({
      kind: "success",
      title: t.gave,
      description: t.gaveDesc.replace("{n}", String(qty)).replace("{name}", p.name),
      action: { label: t.seeCart, onClick: cart.open },
    });
  };

  const offer = () => {
    if (out) return;
    cart.add(line, qty, plateRef.current);
    cart.setGiftWrap(true);
    router.push("/commande?gift=1");
  };

  const wish = () => {
    if (!isAuthed) {
      toast({ kind: "info", title: t.wishLogin });
      router.push(`/connexion?next=/produit/${p.slug}`);
      return;
    }
    start(async () => {
      const r = await toggleWishlistAction(p.id);
      if (r.ok) {
        setW(r.data.wished);
        toast({ kind: "success", title: r.message ?? "" });
      } else toast({ kind: "error", title: r.error });
    });
  };

  const subscribe = () => {
    if (!isAuthed) {
      router.push(`/connexion?next=/produit/${p.slug}`);
      return;
    }
    start(async () => {
      const r = await createSubscriptionAction({ productIds: [p.id], frequencyDays: subFreq });
      toast({
        kind: r.ok ? "success" : "error",
        title: r.ok ? copy.subscription.created.replace("{n}", String(subFreq)) : r.error ?? copy.common.errorGeneric,
      });
      if (r.ok) router.refresh();
    });
  };

  const stockPct = Math.min(1, p.stock / Math.max(1, p.lowStockThreshold * 4));

  return (
    <>
      <div ref={plateRef} className="space-y-6">
        {/* ── The stock line — factual, a meter not an alarm ──────────── */}
        {out ? (
          <div className="border border-stone-2/45 bg-cream/60 px-5 py-4">
            <p className="flex items-center gap-2 text-[13.5px] font-bold uppercase tracking-[0.14em] text-terra">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-terra" /> {t.outOfStock}
            </p>
            <div className="mt-2.5 h-1 w-full bg-stone/80" role="presentation">
              <div className="h-full bg-terra/50" style={{ width: "2%" }} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{t.outNote}</p>
            {alert === "done" ? (
              <p className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-success">
                <CheckIcon size={13} /> {t.notifyMeDone}
              </p>
            ) : alert === "open" ? (
              <form
                className="mt-3 space-y-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  start(async () => {
                    const r = await subscribeRestockAction({ productId: p.id, email: alertEmail, channel: alertWa ? "whatsapp" : "email" });
                    if (r.ok) {
                      setAlert("done");
                      toast({ kind: "success", title: t.notifyMeDone });
                    } else {
                      toast({ kind: "error", title: r.error ?? copy.common.errorGeneric });
                    }
                  });
                }}
              >
                {!isAuthed && (
                  <input
                    type="email"
                    required
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder={t.notifyEmail}
                    className="field !min-h-11 text-[13px]"
                  />
                )}
                {isAuthed && (
                  <p className="text-[12px] text-muted">{copy.restock.priorityForMembers}</p>
                )}
                <label className="flex items-center gap-2 text-[12px] text-charcoal">
                  <input type="checkbox" checked={alertWa} onChange={(e) => setAlertWa(e.target.checked)} className="h-4 w-4 accent-[#a3803f]" />
                  <WhatsAppIcon size={14} className="text-success" /> {t.notifyChannelWhatsapp}
                </label>
                <button disabled={pending} className="btn-primary w-full !min-h-11 text-[10px]">
                  {t.notifySubmit}
                </button>
              </form>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={() => (isAuthed ? setAlert("open") : router.push(`/connexion?next=/produit/${p.slug}`))} className="btn-secondary !min-h-11 px-5">
                  <span className="ltr:mr-1 rtl:ml-1">🔔</span> {t.notifyMe}
                </button>
                {!isAuthed && <span className="text-[10.5px] leading-snug text-muted-2">{t.notifyAuthHint}</span>}
              </div>
            )}
            <a href="tel:+21671450210" className="btn-ghost mt-3 !min-h-9">
              {t.callUs}
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <QtyStepper value={qty} onChange={setQty} max={Math.min(20, p.stock)} />
              {low ? (
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-warning">{t.lowStock.replace("{n}", String(p.stock))}</p>
              ) : (
                <p className="flex items-center gap-2 text-[12px] text-success">
                  <span aria-hidden className="h-1.5 w-1.5 animate-[halo-pulse_2.6s_ease-in-out_infinite] rounded-full bg-success" /> {t.inStock}
                </p>
              )}
            </div>
            <div className="h-1 w-full bg-stone/70" role="presentation" aria-hidden>
              <div
                className={`h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${low ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.max(6, Math.round(stockPct * 100))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={add} disabled={out} className="btn-primary relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="ok"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                  className="flex items-center gap-2"
                >
                  <CheckIcon size={16} /> {t.added}
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: D.fast, ease: EASE_LUXE }}
                  className="flex items-center gap-2"
                >
                  {out ? t.outOfStock : t.add}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={wish}
            disabled={pending}
            aria-pressed={w}
            aria-label={w ? t.wishRemove : t.wishAdd}
            className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center border transition-colors duration-300 ${
              w ? "border-champagne text-champagne-2" : "border-stone-2/60 text-ink hover:border-ink"
            }`}
          >
            <motion.span
              animate={w && !reduce ? { scale: [1, 1.22, 1] } : {}}
              transition={{ duration: 0.5, ease: EASE_LUXE }}
              className="flex"
            >
              <HeartIcon size={19} filled={w} />
            </motion.span>
          </button>
          <button
            onClick={offer}
            disabled={out || pending}
            aria-label={t.offerGift}
            title={t.offerGift}
            className="hidden h-[54px] w-[54px] shrink-0 items-center justify-center border border-stone-2/60 text-ink transition-colors duration-300 hover:border-champagne hover:text-champagne-2 disabled:opacity-40 lg:flex"
          >
            <GiftIcon size={19} />
          </button>
        </div>

        {/* Gift mode deep-link — « Offrir ce produit » from a list */}
        {giftMode && (
          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-l-2 border-champagne bg-champagne-soft/50 px-4 py-3 text-[12.5px] leading-relaxed text-charcoal"
            role="status"
          >
            {t.giftNote}
          </motion.p>
        )}

        {/* ── The subscription lever ────────────────────────────────────── */}
        <div className={`border p-4 ${subscribed ? "border-success/40 bg-success-soft/50" : "border-stone-2/50 bg-cream/50"}`}>
          {subscribed ? (
            <p className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-charcoal">
              <span className="flex items-center gap-2 font-bold uppercase tracking-[0.14em] text-success">
                <CheckIcon size={13} /> {copy.common.yes} — {t.subscribeShort}
              </span>
              <a href="/compte/abonnement" className="link-underline text-[12px]">
                {copy.account.nav.abonnement[1]}
              </a>
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] leading-snug text-charcoal">
                  {t.subscribe.replace("{pct}", "5")} — {t.subscribeEvery}{" "}
                  <select
                    value={subFreq}
                    onChange={(e) => setSubFreq(Number(e.target.value))}
                    className="mx-1 border-b border-stone-2/70 bg-transparent py-0.5 text-[13px] text-ink focus:border-champagne focus:outline-none"
                  >
                    {[21, 30, 45, 60, 90].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>{" "}
                  {t.subscribeDays}
                </p>
                <button onClick={() => (isAuthed ? setSubOpen((o) => !o) : router.push(`/connexion?next=/produit/${p.slug}`))} className="btn-secondary !min-h-10 px-4 text-[9px]">
                  {t.subscribeShort}
                </button>
              </div>
              <AnimatePresence initial={false}>
                {subOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: reduce ? 1 : 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: D.base, ease: EASE_LUXE }}
                    className="overflow-hidden"
                  >
                    <p className="pt-3 text-[12px] leading-relaxed text-muted">{t.subscribePerk}</p>
                    <p className="mt-1 text-[12.5px] tabular-nums text-charcoal">
                      {copy.subscription.totalEstimate}: {formatDT(Math.round(p.priceMillimes * 0.95))} <span className="text-muted-2 line-through">{formatDT(p.priceMillimes)}</span>
                    </p>
                    <button disabled={pending} onClick={subscribe} className="btn-primary mt-3 w-full !min-h-11 text-[10px]">
                      {pending ? "…" : copy.subscription.create}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <ul className="space-y-2.5 border-t border-stone/70 pt-5 text-[13px] text-charcoal">
          <li className="flex items-center gap-3">
            <TruckIcon size={15} className="shrink-0 text-champagne-2" /> {t.deliveryNote.replace("{x}", formatDT(FREE_SHIPPING_THRESHOLD))}
          </li>
          <li className="flex items-center gap-3">
            <StoreIcon size={15} className="shrink-0 text-champagne-2" /> {t.pickup}
          </li>
          <li className="flex items-center gap-3">
            <ShieldIcon size={15} className="shrink-0 text-champagne-2" /> {copy.footer.promiseOfficial}
          </li>
        </ul>
      </div>

      {/* ── The mobile counter — sits above the thumb bar, never over it ── */}
      <div
        className="fixed inset-x-0 z-30 border-t border-stone-2/30 bg-cream/92 backdrop-blur-2xl lg:hidden"
        style={{ bottom: "calc(74px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-3 mb-3 flex items-center gap-3 px-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted">{p.name}</p>
            <p className="text-[15px] tabular-nums text-ink">{formatDT(p.priceMillimes * qty)}</p>
          </div>
          <QtyStepper size="sm" value={qty} onChange={setQty} max={Math.min(20, p.stock)} />
          <button onClick={add} disabled={out} className="btn-primary min-h-11 px-5 text-[10px]">
            {added ? <CheckIcon size={15} /> : out ? t.outOfStock : t.add}
          </button>
        </div>
      </div>
    </>
  );
}
