"use client";
/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ArrowRightIcon, CartIcon, CheckIcon, CloseIcon, HeartIcon, MenuIcon, MinusIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { formatDT } from "@/lib/money";
import { toggleWishlistAction } from "@/actions/shop";
import { CompareToggle } from "@/components/catalog/compare";
import type { ProductCard as Product } from "@/lib/catalog";
import type { SafeUser } from "@/lib/auth";

export function RebuildHeader({ user }: { user: SafeUser | null }) {
  const cart = useCart();
  const [menu, setMenu] = useState(false);
  return <>
    <header className="rb-header">
      <div className="rb-header-inner">
        <button className="rb-icon rb-mobile-only" aria-label="Menu" onClick={() => setMenu(true)}><MenuIcon size={19} /></button>
        <Link href="/" className="rb-logo"><span className="rb-logo-mark">C</span><span>Cléopâtre</span><small>/ santé beauté</small></Link>
        <nav className="rb-nav"><Link href="/boutique">Shop</Link><Link href="/diagnostic">Diagnostic</Link><Link href="/journal">Journal</Link><Link href="/boutiques">Les comptoirs</Link></nav>
        <div className="rb-header-actions"><Link className="rb-icon" href="/recherche" aria-label="Rechercher"><SearchIcon size={18} /></Link><Link className="rb-user-link" href={user ? "/compte" : "/connexion"}>{user ? "Compte" : "Entrer"}</Link><button className="rb-cart-button" data-cart-anchor onClick={cart.open}><CartIcon size={17} /><span>{cart.count || "00"}</span></button></div>
      </div>
      <div className="rb-header-ticker"><span>Cléopâtre / Espace Santé Beauté</span><span>Livraison 24–72 h partout en Tunisie</span><span>Conseil au comptoir · en ligne</span></div>
    </header>
    {menu && <div className="rb-mobile-menu"><div className="rb-mobile-menu-top"><span className="rb-logo"><span className="rb-logo-mark">C</span><span>Cléopâtre</span></span><button className="rb-icon" onClick={() => setMenu(false)} aria-label="Fermer"><CloseIcon size={20} /></button></div><nav><Link onClick={() => setMenu(false)} href="/boutique">Shop <ArrowRightIcon size={16} /></Link><Link onClick={() => setMenu(false)} href="/diagnostic">Diagnostic <ArrowRightIcon size={16} /></Link><Link onClick={() => setMenu(false)} href="/journal">Journal <ArrowRightIcon size={16} /></Link><Link onClick={() => setMenu(false)} href="/boutiques">Les comptoirs <ArrowRightIcon size={16} /></Link></nav><p>Conseil humain. Produits authentiques. Le soin, sans détour.</p></div>}
    <RebuildCartDrawer />
  </>;
}

function RebuildCartDrawer() {
  const cart = useCart();
  if (!cart.isOpen) return null;
  return <div className="rb-cart-layer"><button className="rb-cart-backdrop" onClick={cart.close} aria-label="Fermer le panier" /><aside className="rb-cart-drawer" role="dialog" aria-modal="true" aria-label="Panier"><div className="rb-cart-head"><div><small>Votre sélection</small><h2>Panier <em>{cart.count}</em></h2></div><button className="rb-icon" onClick={cart.close} aria-label="Fermer"><CloseIcon size={19} /></button></div>{cart.lines.length ? <><div className="rb-cart-lines">{cart.lines.map((line) => <div className="rb-cart-line" key={line.productId}>{line.image && <Image src={line.image} alt="" width={62} height={74} /> }<div><small>{line.brandName}</small><strong>{line.name}</strong><span>{formatDT(line.priceMillimes)}</span><div className="rb-qty"><button onClick={() => cart.setQty(line.productId, line.quantity - 1)} aria-label="Diminuer"><MinusIcon size={11} /></button><b>{line.quantity}</b><button onClick={() => cart.setQty(line.productId, line.quantity + 1)} aria-label="Augmenter"><PlusIcon size={11} /></button></div></div><button className="rb-remove" onClick={() => cart.remove(line.productId)}>Supprimer</button></div>)}</div><div className="rb-cart-total"><span>Total</span><strong>{formatDT(cart.subtotal)}</strong></div><Link className="rb-button rb-button-dark rb-cart-checkout" href="/commande" onClick={cart.close}>Passer commande <ArrowRightIcon size={14} /></Link></> : <div className="rb-cart-empty"><span>∅</span><h3>Votre panier est vide</h3><p>Commencez par explorer notre sélection.</p><Link className="rb-button rb-button-dark" href="/boutique" onClick={cart.close}>Explorer le shop</Link></div>}</aside></div>;
}

export function RebuildFooter() {
  return <footer className="rb-footer"><div className="rb-footer-top"><div><span className="rb-footer-label">Cléopâtre / 2026</span><h2>Le soin<br /><em>sans détour.</em></h2></div><div className="rb-footer-cta"><p>Une sélection juste, des réponses humaines, partout en Tunisie.</p><Link className="rb-button rb-button-light" href="/diagnostic">Faire le diagnostic <ArrowRightIcon size={14} /></Link></div></div><div className="rb-footer-grid"><div><span className="rb-footer-label">Explorer</span><Link href="/boutique">Le shop</Link><Link href="/promotions">Les offres</Link><Link href="/marques">Les laboratoires</Link><Link href="/journal">Le journal</Link></div><div><span className="rb-footer-label">Besoin d'aide</span><Link href="/diagnostic">Diagnostic</Link><Link href="/aide">Nous écrire</Link><Link href="/livraison">Livraison</Link><Link href="/boutiques">Nos comptoirs</Link></div><div><span className="rb-footer-label">Suivre la maison</span><a href="https://www.instagram.com/cleopatre.tn" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.facebook.com/cleopatre.tn" target="_blank" rel="noreferrer">Facebook</a><a href="https://wa.me/21671450210" target="_blank" rel="noreferrer">WhatsApp</a></div><div className="rb-footer-last"><span className="rb-logo-mark">C</span><p>Cléopâtre est une espace santé beauté indépendante, basée à Ezzahra et Hammam-Lif.</p></div></div><div className="rb-footer-bottom"><span>© Cléopâtre</span><Link href="/cgv">CGV</Link><Link href="/confidentialite">Confidentialité</Link><span>TN / FR</span></div></footer>;
}

export function RebuildProductCard({ product, feature = false }: { product: Product; feature?: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [pending, start] = useTransition();
  const add = () => { if (product.stock < 1) return; cart.add({ productId: product.id, slug: product.slug, name: product.name, brandName: product.brandName, image: product.image, priceMillimes: product.priceMillimes, stock: product.stock, volume: product.volume }); setAdded(true); window.setTimeout(() => setAdded(false), 1400); };
  const wish = () => start(async () => { const result = await toggleWishlistAction(product.id); if (result.ok) setLiked(result.data.wished); else if (result.error?.toLowerCase().includes("connect")) router.push(`/connexion?next=${encodeURIComponent(window.location.pathname)}`); });
  return <article className={`rb-product ${feature ? "rb-product-feature" : ""}`}><div className="rb-product-image"><Link href={`/produit/${product.slug}`}>{product.image && <Image src={product.image} alt="" fill sizes={feature ? "(max-width: 800px) 100vw, 48vw" : "(max-width: 800px) 50vw, 23vw"} className="object-cover" />}</Link><span className="rb-product-ref">REF {String(product.id).padStart(3, "0")}</span><button className="rb-product-heart" data-liked={liked} disabled={pending} onClick={wish} aria-pressed={liked} aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}><HeartIcon size={16} filled={liked} /></button><button className="rb-product-add" disabled={product.stock < 1} onClick={add}>{added ? <CheckIcon size={13} /> : <PlusIcon size={13} />}{added ? "Ajouté" : product.stock < 1 ? "Rupture" : "Ajouter"}</button></div><div className="rb-product-copy"><span>{product.brandName ?? "Cléopâtre"}</span><h3><Link href={`/produit/${product.slug}`}>{product.name}</Link></h3><div><strong>{formatDT(product.priceMillimes)}</strong>{product.volume && <small>{product.volume}</small>}</div><CompareToggle item={{ id: product.id, name: product.name }} className="rb-compare-toggle" /></div></article>;
}

export function RebuildProductGrid({ products }: { products: Product[] }) { return <div className="rb-products-grid">{products.map((p) => <RebuildProductCard product={p} key={p.id} />)}</div>; }

export function RebuildBuy({ product }: { product: { id: number; slug: string; name: string; brandName?: string | null; image?: string | null; priceMillimes: number; stock: number; volume?: string | null } }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const add = () => {
    if (product.stock < 1) return;
    cart.add({ productId: product.id, slug: product.slug, name: product.name, brandName: product.brandName ?? null, image: product.image ?? null, priceMillimes: product.priceMillimes, stock: product.stock, volume: product.volume ?? null });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };
  return <button className="rb-button rb-button-dark rb-buy" disabled={product.stock < 1} onClick={add}>{added ? <CheckIcon size={14} /> : <PlusIcon size={14} />}{added ? "Ajouté au panier" : product.stock < 1 ? "Indisponible" : "Ajouter au panier"}</button>;
}

export function RebuildRouteTitle({ index, eyebrow, title, description, action }: { index: string; eyebrow: string; title: ReactNode; description?: string; action?: React.ReactNode }) { return <div className="rb-route-title"><div><span className="rb-route-index">{index}</span><small>{eyebrow}</small><h1>{title}</h1></div><div className="rb-route-aside">{description && <p>{description}</p>}{action}</div></div>; }

export function RebuildTrustBar() { return <div className="rb-trust"><span><b>01</b> Authentique</span><span><b>02</b> Conseillé</span><span><b>03</b> Livré partout</span></div>; }
