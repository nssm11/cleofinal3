"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/components/cart/cart-provider";
import { useLocale } from "@/lib/i18n/client";
import { ArrowRightIcon, BagIcon, GiftIcon, PlusIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { formatDT, GIFT_WRAP_FEE, remainingForFreeShipping, shippingFor, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import type { ProductCard } from "@/lib/catalog";
import { EASE_LUXE, D, leave } from "@/lib/motion";
import { Sheet, Stepper, Meter } from "@/components/ui/kit";
import { EmptyState } from "@/components/feedback/feedback";

/* ══════════════════════════════════════════════════════════════════════════
   LE PLATEAU — the bag, opened.
   ──────────────────────────────────────────────────────────────────────────
   A drawer is where an interface usually gives up on design. Here it is the
   most instrumented surface in the shop: a rail that measures the distance to
   free delivery, lines that behave like a register (mono figures, right
   aligned), a shelf of what belongs with what is already in the bag, and a
   tally that reads like a receipt rather than a form.

   Radix owns the dialog semantics — focus trap, scroll lock, Escape, aria —
   so this file is free to be only about the composition.
   ══════════════════════════════════════════════════════════════════════════ */

export function CartTray({ upsells }: { upsells: ProductCard[] }) {
  const { copy } = useLocale();
  const t = copy.cart;
  const cart = useCart();
  const reduce = useReducedMotion();
  const [confirmClear, setConfirmClear] = useState(false);

  const remaining = remainingForFreeShipping(cart.subtotal);
  const shipping = shippingFor(cart.subtotal);
  const wrap = cart.giftWrap ? GIFT_WRAP_FEE : 0;
  const total = cart.subtotal + shipping + wrap;
  const suggestions = upsells.filter((u) => !cart.lines.some((l) => l.productId === u.id) && u.stock > 0).slice(0, 6);

  return (
    <Sheet
      open={cart.isOpen}
      onOpenChange={(open) => (open ? undefined : cart.close())}
      side="right"
      title={t.title}
      description={cart.hydrated ? `${cart.count} ${cart.count > 1 ? "articles" : "article"}` : undefined}
      className="bg-porcelain"
    >
      {!cart.hydrated ? (
        <div className="px-5 py-6">
          <div className="skeleton h-2 w-40" />
          <div className="skeleton mt-6 h-24 w-full" />
          <div className="skeleton mt-3 h-24 w-full" />
        </div>
      ) : cart.lines.length === 0 ? (
        <EmptyState
          icon={<BagIcon size={22} />}
          title={t.emptyDesc ? "Votre plateau est vide" : "Le plateau est vide"}
          description="Les produits que vous choisissez apparaissent ici, avec la livraison calculée en direct."
          action={{ href: "/boutique", label: copy.hero.shopCta }}
          secondary={{ href: "/promotions", label: "Voir les offres" }}
          className="border-0"
        />
      ) : (
        <div className="flex min-h-full flex-col">
          {/* ── The rail: distance to free delivery ─────────────────────── */}
          <div className="border-b border-rule px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="micro text-graphite">Livraison</span>
              <span className="num text-[0.6875rem] text-ink">
                {remaining > 0 ? `${formatDT(remaining)} → offerte` : "Offerte"}
              </span>
            </div>
            <div className="mt-3">
              <Meter
                value={cart.subtotal}
                max={FREE_SHIPPING_THRESHOLD}
                accent={remaining <= 0}
                label="Progression vers la livraison offerte"
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-[0.75rem] text-graphite">
              <TruckIcon size={14} className="shrink-0 text-cinabre" />
              {remaining > 0
                ? `Encore ${formatDT(remaining)} et la livraison est offerte.`
                : "Livraison offerte sur cette commande."}
            </p>
          </div>

          {/* ── The register ────────────────────────────────────────────── */}
          <ul className="px-5">
            <AnimatePresence initial={false}>
              {cart.lines.map((l) => (
                <motion.li
                  key={l.productId}
                  layout={reduce ? false : "position"}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: D.base, ease: EASE_LUXE } }}
                  exit={reduce ? undefined : { opacity: 0, x: 24, transition: leave }}
                  className="group grid grid-cols-[80px_1fr] gap-4 border-b border-rule py-5 last:border-b-0"
                >
                  <Link
                    href={`/produit/${l.slug}`}
                    onClick={cart.close}
                    className="relative aspect-[4/5] overflow-hidden bg-bone-2"
                  >
                    {l.image && (
                      <Image
                        src={l.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-[900ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ash">{l.brandName}</p>
                        <Link
                          href={`/produit/${l.slug}`}
                          onClick={cart.close}
                          className="mt-1 block font-display text-[1rem] leading-snug text-ink"
                        >
                          {l.name}
                        </Link>
                        {l.volume && <p className="mt-0.5 font-mono text-[0.625rem] text-ash">{l.volume}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(l.productId)}
                        aria-label={`Retirer ${l.name}`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center text-ash transition-colors hover:text-error"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <Stepper
                        value={l.quantity}
                        onChange={(v) => cart.setQty(l.productId, v)}
                        min={1}
                        max={Math.min(20, l.stock)}
                        label={`Quantité de ${l.name}`}
                      />
                      <span className="num text-[0.875rem] text-ink">{formatDT(l.priceMillimes * l.quantity)}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* ── The shelf: what belongs with this ───────────────────────── */}
          {suggestions.length > 0 && (
            <div className="border-t border-rule px-5 py-5">
              <p className="micro mb-4 text-ink">{t.upsellTitle}</p>
              <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {suggestions.map((s) => (
                  <li key={s.id} className="w-[124px] shrink-0">
                    <Link href={`/produit/${s.slug}`} onClick={cart.close} className="group block">
                      <span className="relative block aspect-[4/5] overflow-hidden bg-bone-2">
                        {s.image && (
                          <Image
                            src={s.image}
                            alt=""
                            fill
                            sizes="124px"
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        )}
                      </span>
                      <span className="mt-2 block line-clamp-2 font-display text-[0.8125rem] leading-snug text-slate">
                        {s.name}
                      </span>
                      <span className="num mt-0.5 block text-[0.6875rem] text-graphite">{formatDT(s.priceMillimes)}</span>
                    </Link>
                    <button
                      type="button"
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
                      className="mt-2 flex min-h-8 w-full items-center justify-center gap-1.5 border border-rule-strong/60 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-alabaster"
                    >
                      <PlusIcon size={11} /> Ajouter
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── The word on the parcel ──────────────────────────────────── */}
          <div className="border-t border-rule px-5 py-5">
            <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-[0.8125rem] text-slate">
                <GiftIcon size={15} className="text-cinabre" /> Emballage cadeau
                <span className="num text-ash">+ {formatDT(GIFT_WRAP_FEE)}</span>
              </span>
              <input
                type="checkbox"
                checked={cart.giftWrap}
                onChange={(e) => cart.setGiftWrap(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-cinabre)]"
              />
            </label>
            <textarea
              value={cart.note}
              onChange={(e) => cart.setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              rows={2}
              maxLength={500}
              aria-label="Note pour la commande"
              className="field mt-3 text-[0.8125rem]"
            />
          </div>

          {/* ── The tally ───────────────────────────────────────────────── */}
          <div className="mt-auto border-t border-rule-strong bg-alabaster px-5 pb-5 pt-5">
            <dl className="space-y-2 text-[0.8125rem]">
              <div className="flex justify-between">
                <dt className="text-graphite">{copy.cart.subtotal}</dt>
                <dd className="num text-ink">{formatDT(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graphite">{t.shippingEst}</dt>
                <dd className="num text-ink">{shipping === 0 ? "Offerte" : formatDT(shipping)}</dd>
              </div>
              {wrap > 0 && (
                <div className="flex justify-between">
                  <dt className="text-graphite">{t.giftWrap}</dt>
                  <dd className="num text-ink">{formatDT(wrap)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-rule pt-4">
                <dt className="micro text-ink">{copy.cart.total}</dt>
                <dd className="num text-[1.35rem] text-ink">{formatDT(total)}</dd>
              </div>
            </dl>

            <Link href="/commande" onClick={cart.close} className="btn-solid mt-5 w-full">
              Passer commande <ArrowRightIcon size={13} className="rtl:rotate-180" />
            </Link>

            <div className="mt-4 flex items-center justify-between font-mono text-[0.625rem] uppercase tracking-[0.14em]">
              <Link href="/panier" onClick={cart.close} className="text-graphite transition-colors hover:text-cinabre">
                Voir le détail
              </Link>
              {confirmClear ? (
                <span className="flex items-center gap-3 text-graphite">
                  Vider ?
                  <button
                    type="button"
                    onClick={() => {
                      cart.clear();
                      setConfirmClear(false);
                    }}
                    className="text-error underline underline-offset-2"
                  >
                    Oui
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="text-ink underline underline-offset-2">
                    Non
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-ash transition-colors hover:text-error"
                >
                  Vider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
