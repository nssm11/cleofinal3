"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import { formatDT, FREE_SHIPPING_THRESHOLD, remainingForFreeShipping, shippingFor } from "@/lib/money";

export function CartPage() {
  const cart = useCart();

  if (!cart.hydrated) {
    return <div className="grid gap-8 lg:grid-cols-12"><div className="lg:col-span-8 h-64 bg-bg-2 animate-pulse" /><div className="lg:col-span-4 h-64 bg-bg-2 animate-pulse" /></div>;
  }

  if (!cart.lines.length) {
    return (
      <div className="border border-dashed border-line p-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Panier — 00</p>
        <h2 className="mt-4 font-sans text-[32px] font-bold tracking-[-0.02em]">Votre panier est vide</h2>
        <p className="mt-3 font-sans text-[14px] text-text-secondary">Ajoutez des produits pour commencer.</p>
        <Link href="/boutique" className="btn-primary mt-8">Boutique</Link>
      </div>
    );
  }

  const ship = shippingFor(cart.subtotal);
  const remaining = remainingForFreeShipping(cart.subtotal);
  const pct = Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="grid gap-px bg-line border border-line lg:grid-cols-12">
      <div className="lg:col-span-8 bg-bg">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Articles — {cart.count}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Prix</span>
        </div>
        <ul>
          {cart.lines.map((l, i) => (
            <li key={l.productId} className="grid grid-cols-[24px_96px_1fr_auto] gap-4 border-b border-line p-6">
              <span className="font-mono text-[11px] text-text-muted">{String(i + 1).padStart(2, "0")}</span>
              <Link href={`/produit/${l.slug}`} className="h-[96px] w-[96px] bg-bg-2 border border-line">
                {l.image && <Image src={l.image} alt="" width={96} height={96} className="h-full w-full object-cover" />}
              </Link>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{l.brandName}</p>
                <Link href={`/produit/${l.slug}`} className="mt-1 block font-sans text-[14px] font-medium leading-[1.3] hover:underline underline-offset-4">{l.name}</Link>
                <p className="mt-1 font-mono text-[11px] text-text-muted">{l.volume} · {formatDT(l.priceMillimes)} / unité</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center border border-line">
                    <button onClick={() => cart.setQty(l.productId, l.quantity - 1)} className="h-8 w-8 hover:bg-bg-2">−</button>
                    <span className="w-8 text-center font-mono text-[12px]">{l.quantity}</span>
                    <button onClick={() => cart.setQty(l.productId, l.quantity + 1)} className="h-8 w-8 hover:bg-bg-2">+</button>
                  </div>
                  <button onClick={() => cart.remove(l.productId)} className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted hover:text-ink">Retirer</button>
                </div>
              </div>
              <p className="font-mono text-[14px] font-medium">{formatDT(l.priceMillimes * l.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="p-6">
          <Link href="/boutique" className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">Continuer achats →</Link>
        </div>
      </div>

      <aside className="lg:col-span-4 bg-bg p-6 flex flex-col">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Total — 01</p>
        <dl className="mt-6 space-y-3 font-mono text-[12px]">
          <div className="flex justify-between"><dt className="uppercase tracking-[0.06em] text-text-secondary">Sous-total</dt><dd>{formatDT(cart.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="uppercase tracking-[0.06em] text-text-secondary">Livraison</dt><dd>{ship ? formatDT(ship) : "Offerte"}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 font-sans text-[18px] font-semibold"><dt>Total</dt><dd>{formatDT(cart.subtotal + ship)}</dd></div>
        </dl>
        <div className="mt-6">
          <div className="h-[2px] w-full bg-bg-2"><div className="h-full bg-ink" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 font-mono text-[11px] text-text-secondary">{remaining > 0 ? `Plus que ${formatDT(remaining)} pour livraison offerte` : "Livraison offerte"}</p>
        </div>
        <Link href="/commande" className="btn-primary mt-8 w-full">Commander</Link>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">Paiement à la livraison · 14j retours</p>
      </aside>
    </div>
  );
}
