"use client";
import { ProductImage } from "@/components/catalog/product-image";
import { MEDIA_SIZES } from "@/lib/media";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BagIcon, GiftIcon, InfoIcon, TrashIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { EmptyState, QtyStepper } from "@/components/ui/primitives";
import { formatDT, FREE_SHIPPING_THRESHOLD, remainingForFreeShipping, shippingFor } from "@/lib/money";
import { EASE } from "@/components/kit/motion";
import type { CartLine } from "@/lib/cart";

/* ══════════════════════════════════════════════════════════════════════════
   LE BON DE COMMANDE — the bag, written up as a counter slip.

   Each piece is one ruled line: index, plate, reference, quantity, price —
   the way a pharmacist writes a preparation. Removing is reversible for a
   moment (the line lifts out, an undo waits in the margin). The tally is a
   slip pinned to the right: mono figures, one total, and the shipping rule
   stated as a measure, never as urgency.
   ══════════════════════════════════════════════════════════════════════════ */

export function CartPage() {
  const cart = useCart();
  const reduce = useReducedMotion();
  const [removed, setRemoved] = useState<CartLine | null>(null);

  if (!cart.hydrated) {
    return (
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="skeleton h-36" />
          <div className="skeleton mt-4 h-36" />
          <div className="skeleton mt-4 h-36" />
        </div>
        <div className="skeleton h-72 lg:col-span-4" />
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
  const pct = Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
      {/* ── THE LINES ──────────────────────────────────────────────────── */}
      <div className="lg:col-span-8">
        <div className="rule-b flex items-center justify-between pb-3">
          <span className="kicker-xs">Le sac — {cart.count} pièce{cart.count > 1 ? "s" : ""}</span>
          <span className="kicker-xs">Prix</span>
        </div>

        <ul>
          <AnimatePresence initial={false}>
            {cart.lines.map((l, i) => (
              <motion.li
                key={l.productId}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : -18, transition: { duration: 0.24, ease: EASE } }}
                transition={{ duration: 0.32, ease: EASE }}
                className="grid grid-cols-[24px_88px_1fr] items-start gap-x-4 gap-y-3 border-b border-line py-6 sm:grid-cols-[28px_104px_1fr_auto] sm:gap-x-6"
              >
                <span className="data pt-1 text-[0.6875rem] text-faint">{String(i + 1).padStart(2, "0")}</span>

                <Link href={`/produit/${l.slug}`} className="plate relative block aspect-[4/5] bg-canvas-2">
                  <ProductImage src={l.image} alt="" sizes={MEDIA_SIZES.cart} className="object-cover" />
                </Link>

                <div className="min-w-0">
                  <p className="kicker-xs">{l.brandName}</p>
                  <Link
                    href={`/produit/${l.slug}`}
                    className="mt-1.5 block text-[1rem] leading-snug text-carbon transition-colors hover:text-iodine"
                  >
                    {l.name}
                  </Link>
                  <p className="data mt-1 text-[0.6875rem] text-faint">
                    {l.volume ? `${l.volume} · ` : ""}
                    {formatDT(l.priceMillimes)} l&apos;unité
                  </p>
                  {l.duo && (
                    <p className="kicker-xs mt-2 flex items-center gap-2 text-iodine">
                      <span aria-hidden className="marker bg-iodine" />
                      {l.duo.label}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <QtyStepper value={l.quantity} max={Math.min(20, l.stock)} onChange={(v) => cart.setQty(l.productId, v)} />
                    <button
                      onClick={() => {
                        cart.remove(l.productId);
                        setRemoved(l);
                      }}
                      className="inline-flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-faint transition-colors hover:text-crit"
                    >
                      <TrashIcon size={12} strokeWidth={1.5} /> Retirer
                    </button>
                  </div>
                </div>

                <p className="data col-start-3 text-[0.9375rem] text-carbon sm:col-start-auto sm:pt-1 sm:text-end">
                  {formatDT(l.priceMillimes * l.quantity)}
                </p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/boutique" className="group inline-flex items-center gap-2.5 kicker text-muted transition-colors hover:text-carbon">
            <span aria-hidden className="h-px w-8 bg-line-strong transition-all duration-500 group-hover:w-12 group-hover:bg-iodine" />
            Continuer mes achats
          </Link>
          <AnimatePresence>
            {removed && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                onClick={() => {
                  const line = removed;
                  setRemoved(null);
                  if (line) cart.add(line, line.quantity);
                }}
                className="kicker text-iodine underline-offset-4 hover:underline"
              >
                Annuler le retrait — {removed.name}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── THE SLIP ───────────────────────────────────────────────────── */}
      <aside className="lg:col-span-4 lg:ps-4">
        <div className="lg:sticky lg:top-28">
          <div className="sheet notch p-5">
            <div className="rule-b flex items-center justify-between pb-3">
              <span className="kicker">Le compte</span>
              <span className="data text-[0.625rem] text-faint">{String(cart.count).padStart(2, "0")}</span>
            </div>

            <dl className="mt-4 flex flex-col gap-3.5 text-[0.875rem]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Sous-total</dt>
                <dd className="data text-carbon">{formatDT(cart.subtotal + cart.duoDiscount)}</dd>
              </div>
              {cart.duoDiscount > 0 && (
                <div className="flex items-baseline justify-between gap-4 text-ok">
                  <dt className="text-muted">Duo pharmacien</dt>
                  <dd className="data">−{formatDT(cart.duoDiscount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">Livraison estimée</dt>
                <dd className="data text-carbon">{ship ? formatDT(ship) : "Offerte"}</dd>
              </div>
              {cart.giftWrap && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="flex items-center gap-2 text-muted">
                    <GiftIcon size={14} className="text-iodine" /> Emballage cadeau
                  </dt>
                  <dd className="data text-carbon">5,000 DT</dd>
                </div>
              )}
            </dl>

            <div className="mt-5 rule-t flex items-baseline justify-between gap-4 pt-4">
              <dt className="kicker text-carbon">Total</dt>
              <dd className="font-ant text-[1.75rem] leading-none text-carbon data">{formatDT(cart.subtotal + ship)}</dd>
            </div>
          </div>

          {/* The measure — factual, never urgent */}
          <div className="mt-6">
            <div className="meter" aria-hidden>
              <div
                className="h-full bg-iodine transition-[width] duration-700"
                style={{ width: `${Math.max(2, pct).toFixed(1)}%` }}
              />
            </div>
            {remaining > 0 ? (
              <p className="mt-3 text-[0.75rem] leading-relaxed text-muted">
                Plus que <span className="data text-carbon">{formatDT(remaining)}</span> et la livraison est offerte.
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-[0.75rem] text-ok">
                <InfoIcon size={14} /> Livraison offerte sur ce sac.
              </p>
            )}
          </div>

          <Link href="/commande" className="btn-solid mt-7 w-full">
            Passer à la livraison
          </Link>
          <p className="mt-4 text-center text-[0.6875rem] leading-relaxed text-faint">
            Le code promo s&apos;applique à l&apos;étape suivante. Aucun prélèvement avant confirmation.
          </p>
        </div>
      </aside>
    </div>
  );
}
