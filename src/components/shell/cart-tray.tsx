"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { formatDT, FREE_SHIPPING_THRESHOLD, remainingForFreeShipping, shippingFor, GIFT_WRAP_FEE } from "@/lib/money";
import type { ProductCard } from "@/lib/catalog";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { X, Plus, Minus, Trash2 } from "lucide-react";

export function CartTray({ upsells }: { upsells: ProductCard[] }) {
  const cart = useCart();
  const trayRef = useRef<HTMLElement>(null);
  useFocusTrap(trayRef, cart.isOpen);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cart.isOpen, cart]);

  const remaining = remainingForFreeShipping(cart.subtotal);
  const progress = Math.min(1, cart.subtotal / FREE_SHIPPING_THRESHOLD);
  const shipping = shippingFor(cart.subtotal);
  const wrap = cart.giftWrap ? GIFT_WRAP_FEE : 0;

  return (
    <AnimatePresence>
      {cart.isOpen && (
        <>
          <motion.button
            aria-label="Fermer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cart.close}
            className="fixed inset-0 z-[60] bg-black/40"
          />
          <motion.aside
            ref={trayRef}
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[480px] flex-col border-l border-line bg-bg"
          >
            {/* Header */}
            <div className="flex h-[64px] items-center justify-between border-b border-line px-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Panier — 01</span>
                <span className="font-sans text-[14px] font-medium">
                  {cart.hydrated ? `${cart.count} article${cart.count > 1 ? "s" : ""}` : "—"}
                </span>
              </div>
              <button onClick={cart.close} className="flex h-10 w-10 items-center justify-center border border-line text-ink hover:border-ink">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {!cart.hydrated ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="h-32 w-full max-w-xs animate-pulse bg-bg-2" />
              </div>
            ) : cart.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <p className="font-sans text-[24px] font-semibold tracking-[-0.02em]">Panier vide</p>
                <p className="mt-3 max-w-[28ch] font-sans text-[14px] leading-[1.6] text-text-secondary">
                  Aucun produit pour l&apos;instant. Explorez la boutique.
                </p>
                <Link href="/boutique" onClick={cart.close} className="btn-primary mt-8">
                  Boutique
                </Link>
              </div>
            ) : (
              <>
                {/* Shipping */}
                <div className="border-b border-line px-6 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary">
                    {remaining > 0 ? (
                      <>
                        Plus que <span className="text-ink">{formatDT(remaining)}</span> pour la livraison offerte
                      </>
                    ) : (
                      <span className="text-ink">Livraison offerte</span>
                    )}
                  </p>
                  <div className="mt-3 h-[2px] w-full bg-bg-2">
                    <div className="h-full bg-ink transition-all duration-700" style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>

                {/* Lines */}
                <div className="flex-1 overflow-y-auto">
                  <ul>
                    {cart.lines.map((l) => (
                      <li key={l.productId} className="flex gap-4 border-b border-line p-6">
                        <Link href={`/produit/${l.slug}`} onClick={cart.close} className="h-[96px] w-[96px] shrink-0 bg-bg-2">
                          {l.image && <Image src={l.image} alt="" width={96} height={96} className="h-full w-full object-cover" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{l.brandName}</p>
                          <Link href={`/produit/${l.slug}`} onClick={cart.close} className="mt-1 line-clamp-2 font-sans text-[14px] font-medium leading-[1.3]">
                            {l.name}
                          </Link>
                          {l.volume && <p className="mt-1 font-mono text-[11px] text-text-muted">{l.volume}</p>}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center border border-line">
                              <button
                                onClick={() => cart.setQty(l.productId, l.quantity - 1)}
                                disabled={l.quantity <= 1}
                                className="flex h-8 w-8 items-center justify-center text-ink hover:bg-bg-2 disabled:opacity-30"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center font-mono text-[12px]">{l.quantity}</span>
                              <button
                                onClick={() => cart.setQty(l.productId, l.quantity + 1)}
                                disabled={l.quantity >= Math.min(20, l.stock)}
                                className="flex h-8 w-8 items-center justify-center text-ink hover:bg-bg-2 disabled:opacity-30"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-mono text-[13px] font-medium">{formatDT(l.priceMillimes * l.quantity)}</span>
                          </div>
                        </div>
                        <button onClick={() => cart.remove(l.productId)} className="flex h-8 w-8 shrink-0 items-center justify-center text-text-muted hover:text-ink">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Totals */}
                <div className="border-t border-ink bg-bg px-6 py-6">
                  <dl className="space-y-2 font-mono text-[12px]">
                    <div className="flex justify-between">
                      <dt className="uppercase tracking-[0.06em] text-text-secondary">Sous-total</dt>
                      <dd className="text-ink">{formatDT(cart.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="uppercase tracking-[0.06em] text-text-secondary">Livraison</dt>
                      <dd className="text-ink">{shipping === 0 ? "Offerte" : formatDT(shipping)}</dd>
                    </div>
                    {wrap > 0 && (
                      <div className="flex justify-between">
                        <dt className="uppercase tracking-[0.06em] text-text-secondary">Emballage</dt>
                        <dd className="text-ink">{formatDT(wrap)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-line pt-3 font-sans text-[16px] font-semibold">
                      <dt>Total</dt>
                      <dd>{formatDT(cart.subtotal + shipping + wrap)}</dd>
                    </div>
                  </dl>
                  <Link href="/commande" onClick={cart.close} className="btn-primary mt-6 w-full">
                    Commander
                  </Link>
                  <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.06em]">
                    <Link href="/panier" onClick={cart.close} className="underline underline-offset-4 hover:text-text-secondary">
                      Voir panier
                    </Link>
                    {confirmClear ? (
                      <span className="flex items-center gap-2">
                        Vider ?
                        <button onClick={() => { cart.clear(); setConfirmClear(false); }} className="text-error underline">Oui</button>
                        <button onClick={() => setConfirmClear(false)} className="underline">Non</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmClear(true)} className="text-text-muted hover:text-ink">
                        Vider
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
