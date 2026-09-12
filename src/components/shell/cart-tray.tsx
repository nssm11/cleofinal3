"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { useLocale } from "@/lib/i18n/client";
import { ArrowRightIcon, BagIcon, CheckIcon, CloseIcon, GiftIcon, MinusIcon, PlusIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { formatDT, FREE_SHIPPING_THRESHOLD, GIFT_WRAP_FEE, remainingForFreeShipping, shippingFor } from "@/lib/money";
import type { ProductCard } from "@/lib/catalog";
import { EASE_LUXE, D, leave, panelRight } from "@/lib/motion";
import { useFocusTrap } from "@/lib/use-focus-trap";

/**
 * LE PLATEAU — the cart, presented as a tray rather than a drawer.
 *
 * It does not merely list items: it shows the tray filling up. The shipping
 * rail at the top turns a threshold into a movement, and the "rituel" rail at
 * the bottom keeps the visitor inside the house instead of pushing them to the
 * checkout as fast as possible.
 */
export function CartTray({ upsells }: { upsells: ProductCard[] }) {
  const { copy } = useLocale();
  const t = copy.cart;
  const cart = useCart();
  const reduce = useReducedMotion();
  const trayRef = useRef<HTMLElement>(null);
  useFocusTrap(trayRef, cart.isOpen);
  const [confirmClear, setConfirmClear] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    const prev = document.body.style.overflow;
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [cart.isOpen, cart]);

  const remaining = remainingForFreeShipping(cart.subtotal);
  const progress = Math.min(1, cart.subtotal / FREE_SHIPPING_THRESHOLD);
  const shipping = shippingFor(cart.subtotal);
  const wrap = cart.giftWrap ? GIFT_WRAP_FEE : 0;
  const suggestions = upsells.filter((u) => !cart.lines.some((l) => l.productId === u.id) && u.stock > 0).slice(0, 4);

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <>
          <motion.button
            aria-label={t.closeTray}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: D.base, ease: EASE_LUXE } }}
            exit={{ opacity: 0, transition: leave }}
            onClick={cart.close}
            className="fixed inset-0 z-[60] bg-ink/35 backdrop-blur-sm"
          />
          <motion.aside
            ref={trayRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
            variants={panelRight}
            initial={reduce ? false : "initial"}
            animate="animate"
            exit="exit"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[30rem] flex-col overflow-hidden bg-paper shadow-drawer"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="marble-veil opacity-40" />
              <div className="grain absolute inset-0" />
            </div>

            {/* ── Head ─────────────────────────────────────────────────── */}
            <div className="relative flex items-start justify-between gap-4 border-b border-stone/70 px-5 py-5">
              <div>
                <p className="eyebrow text-muted-2">{t.title}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-[28px] italic leading-none text-ink">
                    {cart.hydrated ? cart.count : "—"}
                  </span>
                  <span className="text-[12px] text-muted">
                    {t.itemsCount.replaceAll("{s}", cart.count > 1 ? "s" : "")}
                  </span>
                </p>
              </div>
              <button
                onClick={cart.close}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {!cart.hydrated ? (
              <div className="relative flex flex-1 items-center justify-center px-6">
                <div className="skeleton h-44 w-full max-w-xs" />
              </div>
            ) : cart.lines.length === 0 ? (
              <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center border border-stone-2/50 text-champagne-2">
                  <BagIcon size={26} />
                </span>
                <p className="mt-7 font-display text-[22px] italic text-ink">{t.title}</p>
                <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted">
                  {t.emptyDesc}
                </p>
                <Link href="/boutique" onClick={cart.close} className="btn-primary mt-8">
                  {copy.hero.shopCta}
                </Link>
              </div>
            ) : (
              <>
                {/* ── The shipping rail ──────────────────────────────── */}
                <div className="relative border-b border-stone/70 px-5 py-4">
                  <p className="flex items-center gap-2.5 text-[12.5px] text-charcoal">
                    <TruckIcon size={15} className="shrink-0 text-champagne-2" />
                    {remaining > 0 ? (
                      <span>
                        Plus que <strong className="font-semibold text-ink">{formatDT(remaining)}</strong> pour la
                        livraison offerte
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-success">
                        <CheckIcon size={14} /> Livraison offerte
                      </span>
                    )}
                  </p>
                  <div className="relative mt-3 h-px bg-stone-2/50">
                    <motion.div
                      className="absolute inset-y-0 left-0 origin-left bg-champagne-2"
                      initial={false}
                      animate={{ scaleX: progress }}
                      transition={{ duration: D.slow, ease: EASE_LUXE }}
                      style={{ width: "100%", willChange: "transform" }}
                    />
                  </div>
                </div>

                {/* ── The tray ───────────────────────────────────────── */}
                <div className="relative flex-1 overflow-y-auto overscroll-contain px-5">
                  <ul>
                    <AnimatePresence initial={false}>
                      {cart.lines.map((l) => (
                        <motion.li
                          key={l.productId}
                          layout="position"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: D.base, ease: EASE_LUXE } }}
                          exit={{ opacity: 0, x: 24, transition: leave }}
                          className="group flex gap-4 border-b border-stone/60 py-5 last:border-b-0"
                        >
                          <Link
                            href={`/produit/${l.slug}`}
                            onClick={cart.close}
                            className="relative h-[104px] w-[84px] shrink-0 overflow-hidden bg-marble"
                          >
                            {l.image && (
                              <Image
                                src={l.image}
                                alt=""
                                fill
                                sizes="84px"
                                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                              />
                            )}
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-2">{l.brandName}</p>
                            <Link
                              href={`/produit/${l.slug}`}
                              onClick={cart.close}
                              className="mt-1 line-clamp-2 font-display text-[16px] leading-tight text-ink"
                            >
                              {l.name}
                            </Link>
                            {l.volume && <p className="mt-0.5 text-[11px] text-muted-2">{l.volume}</p>}

                            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                              <div className="inline-flex items-center border border-stone-2/45">
                                <button
                                  onClick={() => cart.setQty(l.productId, l.quantity - 1)}
                                  disabled={l.quantity <= 1}
                                  aria-label={`Diminuer la quantité de ${l.name}`}
                                  className="flex h-9 w-8 items-center justify-center text-ink transition-opacity hover:opacity-55 disabled:opacity-25"
                                >
                                  <MinusIcon size={12} />
                                </button>
                                <span className="min-w-7 text-center text-[13px] tabular-nums text-ink" aria-live="polite">
                                  {l.quantity}
                                </span>
                                <button
                                  onClick={() => cart.setQty(l.productId, l.quantity + 1)}
                                  disabled={l.quantity >= Math.min(20, l.stock)}
                                  aria-label={`Augmenter la quantité de ${l.name}`}
                                  className="flex h-9 w-8 items-center justify-center text-ink transition-opacity hover:opacity-55 disabled:opacity-25"
                                >
                                  <PlusIcon size={12} />
                                </button>
                              </div>
                              <span className="text-[14px] tabular-nums text-ink">
                                {formatDT(l.priceMillimes * l.quantity)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => cart.remove(l.productId)}
                            aria-label={`Retirer ${l.name} du panier`}
                            className="flex h-8 w-6 shrink-0 items-start justify-center pt-0.5 text-muted-2 transition-colors hover:text-error"
                          >
                            <TrashIcon size={15} />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  {/* The ritual rail */}
                  {suggestions.length > 0 && (
                    <div className="border-t border-stone/60 py-5">
                      <p className="eyebrow mb-4 text-muted-2">{t.upsellTitle}</p>
                      <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                        {suggestions.map((s) => (
                          <li key={s.id} className="w-[132px] shrink-0">
                            <Link href={`/produit/${s.slug}`} onClick={cart.close} className="group block">
                              <span className="relative block aspect-square overflow-hidden bg-marble">
                                {s.image && (
                                  <Image
                                    src={s.image}
                                    alt=""
                                    fill
                                    sizes="132px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                  />
                                )}
                              </span>
                              <span className="mt-2 block line-clamp-2 text-[12px] leading-snug text-charcoal">
                                {s.name}
                              </span>
                              <span className="mt-0.5 block text-[12px] tabular-nums text-muted">
                                {formatDT(s.priceMillimes)}
                              </span>
                            </Link>
                            <button
                              onClick={(e) =>
                                cart.add(
                                  {
                                    productId: s.id,
                                    slug: s.slug,
                                    name: s.name,
                                    brandName: s.brandName,
                                    image: s.image,
                                    priceMillimes: s.priceMillimes,
                                    stock: s.stock,
                                    volume: s.volume,
                                  },
                                  1,
                                  e.currentTarget.closest("li"),
                                )
                              }
                              className="mt-2 flex min-h-9 w-full items-center justify-center gap-1.5 border border-stone-2/50 text-[10px] font-bold uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-paper"
                            >
                              <PlusIcon size={11} /> Ajouter
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* The word */}
                  <div className="border-t border-stone/60 py-5">
                    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5 text-[13px] text-charcoal">
                        <GiftIcon size={15} className="text-champagne-2" /> Emballage cadeau
                        <span className="text-muted-2">+ {formatDT(GIFT_WRAP_FEE)}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={cart.giftWrap}
                        onChange={(e) => cart.setGiftWrap(e.target.checked)}
                        className="h-4 w-4 accent-ink"
                      />
                    </label>
                    {cart.giftWrap || cart.note ? (
                      <textarea
                        value={cart.note}
                        onChange={(e) => cart.setNote(e.target.value)}
                        onFocus={() => setNoteOpen(true)}
                        placeholder={t.notePlaceholder}
                        rows={3}
                        maxLength={500}
                        aria-label="Note pour la commande"
                        className="field mt-3 text-[13px]"
                      />
                    ) : (
                      <button
                        onClick={() => setNoteOpen(true)}
                        className="mt-1 flex min-h-9 items-center text-[12.5px] text-muted underline decoration-stone-2 underline-offset-4 transition-colors hover:text-ink"
                      >
                        Ajouter un mot à la commande
                      </button>
                    )}
                    {noteOpen && <span className="sr-only">{t.noteAuto}</span>}
                  </div>
                </div>

                {/* ── The tally ──────────────────────────────────────── */}
                <div className="relative border-t border-stone/70 bg-cream/70 px-5 pb-5 pt-4 backdrop-blur-xl">
                  <dl className="space-y-1.5 text-[13.5px]">
                    <div className="flex justify-between">
                      <dt className="text-muted">{copy.cart.subtotal}</dt>
                      <dd className="tabular-nums text-ink">{formatDT(cart.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">{t.shippingEst}</dt>
                      <dd className="tabular-nums text-ink">{shipping === 0 ? "Offerte" : formatDT(shipping)}</dd>
                    </div>
                    {wrap > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted">{t.giftWrap}</dt>
                        <dd className="tabular-nums text-ink">{formatDT(wrap)}</dd>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between border-t border-stone/70 pt-3">
                      <dt className="font-display text-[17px] text-ink">{copy.cart.total}</dt>
                      <dd className="font-display text-[22px] tabular-nums text-ink">
                        {formatDT(cart.subtotal + shipping + wrap)}
                      </dd>
                    </div>
                  </dl>
                  <Link href="/commande" onClick={cart.close} className="btn-primary mt-4 w-full">
                    Passer commande <ArrowRightIcon size={13} />
                  </Link>
                  <div className="mt-3 flex items-center justify-between text-[11.5px]">
                    <Link href="/panier" onClick={cart.close} className="link-underline text-muted hover:text-ink">
                      Voir le panier détaillé
                    </Link>
                    {confirmClear ? (
                      <span className="flex items-center gap-2 text-muted">
                        Vider&nbsp;?
                        <button
                          onClick={() => {
                            cart.clear();
                            setConfirmClear(false);
                          }}
                          className="text-error underline underline-offset-2"
                        >
                          Oui
                        </button>
                        <button onClick={() => setConfirmClear(false)} className="text-ink underline underline-offset-2">
                          Non
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="text-muted-2 transition-colors hover:text-error"
                      >
                        Vider le plateau
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
