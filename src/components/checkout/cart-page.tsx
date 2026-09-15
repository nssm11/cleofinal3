"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BagIcon, TrashIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { GiftIcon, InfoIcon } from "@/components/icons";
import { EmptyState, QtyStepper } from "@/components/ui/primitives";
import { formatDT, FREE_SHIPPING_THRESHOLD, remainingForFreeShipping, shippingFor } from "@/lib/money";
import { EASE_LUXE, D, leave } from "@/lib/motion";
import type { CartLine } from "@/lib/cart";

/**
 * VOTRE SAC — the bag, laid out.
 *
 * A long quiet row of pieces at their true proportions, one hairline between
 * them, the price of each in the right column like a ledger. Removing is
 * reversible for a moment — the row lifts out, and an undo waits in the margin
 * — rather than an instant, silent loss. The tally stands to the right: no
 * box, just lines of light and one serif total.
 */
export function CartPage() {
  const cart = useCart();
  const reduce = useReducedMotion();
  const [removed, setRemoved] = useState<CartLine | null>(null);

  if (!cart.hydrated) {
    return (
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="skeleton h-40" />
          <div className="skeleton mt-6 h-40" />
        </div>
        <div className="skeleton h-64 lg:col-span-4" />
      </div>
    );
  }

  if (!cart.lines.length) {
    return (
      <EmptyState
        icon={<BagIcon size={22} strokeWidth={1.3} />}
        title="Votre sac est vide"
        description="Rien n'y a encore été posé. Commencez par un rayon, ou laissez-nous vous conseiller."
        action={{ href: "/boutique", label: "Parcourir la boutique" }}
      />
    );
  }

  const ship = shippingFor(cart.subtotal);
  const remaining = remainingForFreeShipping(cart.subtotal);

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
      {/* ── The pieces ─────────────────────────────────────────────── */}
      <div className="lg:col-span-8">
        <ul className="border-t border-stone/60">
          <AnimatePresence initial={false}>
            {cart.lines.map((l) => (
              <motion.li
                key={l.productId}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : -18, transition: leave }}
                transition={{ duration: D.base, ease: EASE_LUXE }}
                className="grid grid-cols-[104px_1fr] gap-x-6 gap-y-4 border-b border-stone/60 py-8 sm:grid-cols-[150px_1fr_auto] sm:gap-x-10"
              >
                <Link href={`/produit/${l.slug}`} className="relative row-span-2 aspect-[4/5] overflow-hidden bg-marble">
                  {l.image && <Image src={l.image} alt="" fill sizes="150px" className="object-cover" />}
                </Link>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-muted-2">{l.brandName}</p>
                  <Link
                    href={`/produit/${l.slug}`}
                    className="mt-2 block font-display text-[19px] font-light leading-snug text-ink transition-colors hover:text-champagne-2"
                  >
                    {l.name}
                  </Link>
                  <p className="mt-1.5 text-[12px] text-muted-2">
                    {l.volume ? `${l.volume} · ` : ""}
                    {formatDT(l.priceMillimes)} l&apos;unité
                  </p>
                  {l.duo && (
                    <p className="mt-2.5 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-champagne-2">
                      <span aria-hidden className="h-px w-4 bg-champagne-3" />
                      {l.duo.label}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-6">
                    <QtyStepper
                      size="sm"
                      value={l.quantity}
                      max={Math.min(20, l.stock)}
                      onChange={(v) => cart.setQty(l.productId, v)}
                    />
                    <button
                      onClick={() => {
                        cart.remove(l.productId);
                        setRemoved(l);
                      }}
                      className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2 transition-colors hover:text-error"
                    >
                      <TrashIcon size={12} strokeWidth={1.5} /> Retirer
                    </button>
                  </div>
                </div>

                <p className="col-start-2 text-right font-display text-[20px] font-light tabular-nums text-ink sm:col-start-auto sm:pt-1.5">
                  {formatDT(l.priceMillimes * l.quantity)}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/boutique" className="group inline-flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-muted transition-colors hover:text-ink">
            <span aria-hidden className="h-px w-8 bg-stone-2 transition-all duration-500 group-hover:w-12 group-hover:bg-champagne-2" />
            Continuer mes achats
          </Link>
          <AnimatePresence>
            {removed && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: D.fast, ease: EASE_LUXE }}
                onClick={() => {
                  const line = removed;
                  setRemoved(null);
                  if (line) cart.add(line, line.quantity);
                }}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne-2 underline-offset-4 hover:underline"
              >
                Annuler le retrait
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── The note ───────────────────────────────────────────────── */}
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <div className="relative">
            <p className="rule-label mb-7">Le compte</p>
            <dl className="space-y-4 text-[14px]">
              <div className="flex items-baseline justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd className="tabular-nums text-charcoal">{formatDT(cart.subtotal + cart.duoDiscount)}</dd>
              </div>
              {cart.duoDiscount > 0 && (
                <div className="flex items-baseline justify-between text-success">
                  <dt className="text-muted">Duo pharmacien</dt>
                  <dd className="tabular-nums">−{formatDT(cart.duoDiscount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-muted">Livraison estimée</dt>
                <dd className="tabular-nums text-charcoal">{ship ? formatDT(ship) : "Offerte"}</dd>
              </div>
              {cart.giftWrap && (
                <div className="flex items-baseline justify-between">
                  <dt className="flex items-center gap-2 text-muted">
                    <GiftIcon size={14} className="text-champagne-2" /> Emballage cadeau
                  </dt>
                  <dd className="tabular-nums text-charcoal">5,000 DT</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-stone/60 pt-5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.26em] text-ink">Total</dt>
                <dd className="font-display text-[28px] font-light tabular-nums text-ink">{formatDT(cart.subtotal + ship)}</dd>
              </div>
            </dl>

            {/* The measure — factual, never urgent */}
            <div className="mt-8 border-t border-stone/60 pt-6">
              {remaining > 0 ? (
                <>
                  <div className="h-px w-full bg-stone-2/50">
                    <div
                      className="h-px bg-champagne-2 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ width: `${Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-muted">
                    Plus que <span className="text-charcoal">{formatDT(remaining)}</span> et la livraison est offerte.
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-2 text-[12px] text-success">
                  <InfoIcon size={14} /> Livraison offerte sur ce sac.
                </p>
              )}
            </div>

            <Link href="/commande" className="btn-primary mt-9 w-full">
              Passer à la livraison
            </Link>
            <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted-2">
              Le code promo s&apos;applique à l&apos;étape suivante. Aucun prélèvement avant confirmation.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
