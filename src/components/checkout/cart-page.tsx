"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { BagIcon, GiftIcon, InfoIcon, TrashIcon } from "@/components/icons";
import { EmptyState, QtyStepper } from "@/components/ui/primitives";
import { formatDT, FREE_SHIPPING_THRESHOLD, remainingForFreeShipping, shippingFor } from "@/lib/money";
import { EASE_LUXE, D, leave } from "@/lib/motion";
import type { CartLine } from "@/lib/cart";

/**
 * LE PLATEAU — the tray, laid out.
 *
 * A cart is a table being set, so it is presented as a list with room around
 * each piece: the photograph at its true proportions, the price aligned in a
 * right-hand column like a ledger, and a single continuous rule between lines.
 * Removing something is reversible for a moment (the row lifts out, and an undo
 * appears in the summary) rather than an instant, silent loss.
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
        icon={<BagIcon size={22} />}
        title="Votre plateau est vide"
        description="Rien n'y a encore été posé. Commencez par un rayon, ou laissez-nous vous conseiller."
        action={{ href: "/boutique", label: "Parcourir la boutique" }}
      />
    );
  }

  const ship = shippingFor(cart.subtotal);
  const remaining = remainingForFreeShipping(cart.subtotal);

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-8">
        <ul className="border-t border-stone/70">
          <AnimatePresence initial={false}>
            {cart.lines.map((l) => (
              <motion.li
                key={l.productId}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : -18, transition: leave }}
                transition={{ duration: D.base, ease: EASE_LUXE }}
                className="grid grid-cols-[88px_1fr] gap-x-5 gap-y-4 border-b border-stone/70 py-7 sm:grid-cols-[132px_1fr_auto] sm:gap-x-8"
              >
                <Link href={`/produit/${l.slug}`} className="relative row-span-2 aspect-[4/5] overflow-hidden bg-marble">
                  {l.image && <Image src={l.image} alt="" fill sizes="132px" className="object-cover" />}
                </Link>

                <div className="min-w-0">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">{l.brandName}</p>
                  <Link
                    href={`/produit/${l.slug}`}
                    className="mt-1.5 block font-display text-[18px] leading-snug text-ink transition-colors hover:text-champagne-2"
                  >
                    {l.name}
                  </Link>
                  <p className="mt-1 text-[12px] text-muted-2">
                    {l.volume ? `${l.volume} · ` : ""}
                    {formatDT(l.priceMillimes)} l&apos;unité
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-5">
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
                      className="group inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-2 transition-colors hover:text-error"
                    >
                      <TrashIcon size={13} /> Retirer
                    </button>
                  </div>
                </div>

                <p className="col-start-2 text-right font-display text-[19px] tabular-nums text-ink sm:col-start-auto sm:pt-1">
                  {formatDT(l.priceMillimes * l.quantity)}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/boutique" className="btn-ghost">
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
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-champagne-2 underline-offset-4 hover:underline"
              >
                Annuler le retrait
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── The tally ─────────────────────────────────────────────── */}
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-32">
          <div className="relative overflow-hidden border border-stone-2/40 bg-cream/70 p-7">
            <span aria-hidden className="marble-veil opacity-25" />
            <div className="relative">
              <p className="rule-label mb-6">Le compte</p>
              <dl className="space-y-3 text-[14px]">
                <div className="flex items-baseline justify-between">
                  <dt className="text-muted">Sous-total</dt>
                  <dd className="tabular-nums text-charcoal">{formatDT(cart.subtotal)}</dd>
                </div>
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
                <div className="flex items-baseline justify-between border-t border-stone/70 pt-4">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">Total</dt>
                  <dd className="font-display text-[24px] tabular-nums text-ink">{formatDT(cart.subtotal + ship)}</dd>
                </div>
              </dl>

              {/* The shipping measure — factual, never urgent */}
              <div className="mt-6 border-t border-stone/70 pt-5">
                {remaining > 0 ? (
                  <>
                    <div className="h-px w-full bg-stone-2/60">
                      <div
                        className="h-px bg-champagne-2 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ width: `${Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-[12px] leading-relaxed text-muted">
                      Plus que <span className="text-charcoal">{formatDT(remaining)}</span> et la livraison est offerte.
                    </p>
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-[12px] text-success">
                    <InfoIcon size={14} /> Livraison offerte sur ce plateau.
                  </p>
                )}
              </div>

              <Link href="/commande" className="btn-primary mt-7 w-full">
                Passer à la livraison
              </Link>
              <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-2">
                Le code promo s&apos;applique à l&apos;étape suivante. Aucun prélèvement avant confirmation.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
