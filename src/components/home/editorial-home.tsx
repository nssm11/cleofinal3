"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, CheckIcon, MapPinIcon, PlusIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { formatDT } from "@/lib/money";
import type { ProductCard as Product } from "@/lib/catalog";
import type { Article, Brand, Category, Concern } from "@/db/schema";

type Universe = Category & { children: Category[] };
type HomeCopy = {
  hero: { titleLine1: string; titleLine2: string; titleLine3a: string; titleLine3b: string; intro1: string; introAccent: string; intro2: string; shopCta: string; adviceCta: string; photoAlt: string };
  rayonsEyebrow: string; rayonsTitle: string; rayonsDesc: string; rayonsCta: string;
  needsEyebrow: string; needsTitle1: string; needsTitle2: string; needsText: string; needsCta: string;
  journalEyebrow: string; journalTitle: string; journalCta: string;
};
type CommonCopy = { viewAll: string; minutes: string };

function ModuleTag({ index, label, light = false }: { index: string; label: string; light?: boolean }) {
  return <div className={`lab-tag ${light ? "lab-tag-light" : ""}`}><b>{index}</b><i /> <span>{label}</span></div>;
}

function LabAdd({ product }: { product: Product }) {
  const cart = useCart();
  const source = useRef<HTMLButtonElement>(null);
  const [done, setDone] = useState(false);
  const add = () => {
    if (product.stock <= 0) return;
    cart.add({ productId: product.id, slug: product.slug, name: product.name, brandName: product.brandName, image: product.image, priceMillimes: product.priceMillimes, stock: product.stock, volume: product.volume }, 1, source.current);
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };
  return <button ref={source} type="button" className="lab-add" disabled={product.stock <= 0} data-done={done} onClick={add}>{done ? <CheckIcon size={13} /> : <PlusIcon size={13} />}{done ? "Ajouté" : product.stock <= 0 ? "Rupture" : "Ajouter"}</button>;
}

function LabProduct({ product, large = false }: { product: Product; large?: boolean }) {
  const discount = product.compareAtMillimes && product.compareAtMillimes > product.priceMillimes;
  return <article className={`lab-product ${large ? "lab-product-large" : ""}`}>
    <div className="lab-product-visual">
      <Link href={`/produit/${product.slug}`} className="absolute inset-0"><div className="absolute inset-0 bg-marble" />{product.image && <Image src={product.image} alt="" fill sizes={large ? "(max-width: 800px) 100vw, 45vw" : "(max-width: 800px) 50vw, 20vw"} className="object-cover" />}</Link>
      <span className="lab-product-index">REF / {String(product.id).padStart(3, "0")}</span>
      {product.isNew && <span className="lab-product-new">NEW</span>}
      <div className="lab-product-actions"><LabAdd product={product} /><Link href={`/produit/${product.slug}`} className="lab-product-open"><ArrowRightIcon size={14} /></Link></div>
    </div>
    <div className="lab-product-info"><span>{product.brandName ?? "Cléopâtre"}</span><h3><Link href={`/produit/${product.slug}`}>{product.name}</Link></h3><div><strong>{formatDT(product.priceMillimes)}</strong>{discount && <del>{formatDT(product.compareAtMillimes!)}</del>}{product.volume && <small>{product.volume}</small>}</div></div>
  </article>;
}

function Hero({ copy, featured }: { copy: HomeCopy["hero"]; featured: Product | null }) {
  const reduce = useReducedMotion();
  return <section className="lab-hero" aria-labelledby="lab-title">
    <div className="lab-hero-rail"><span>01 / 05</span><i /><span>SCROLL</span></div>
    <div className="lab-hero-copy">
      <div className="lab-hero-kicker"><span>CLÉOPÂTRE</span><i /> Espace Santé Beauté</div>
      <motion.h1 id="lab-title" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75 }}>Une peau<br /><em>bien</em> <span>conseillée.</span></motion.h1>
      <p>{copy.intro1}<strong>{copy.introAccent}</strong>{copy.intro2}</p>
      <div className="lab-hero-cta"><Link href="/boutique" className="lab-button lab-button-accent">{copy.shopCta}<ArrowRightIcon size={14} /></Link><Link href="/diagnostic" className="lab-inline-link">{copy.adviceCta}</Link></div>
    </div>
    <div className="lab-hero-image"><Image src="/images/hero.jpg" alt={copy.photoAlt} fill priority sizes="(max-width: 800px) 100vw, 52vw" className="object-cover" /><div className="lab-image-caption"><span>IMAGE / 001</span><span>SOINS QUOTIDIENS</span></div></div>
    <div className="lab-hero-product"><span className="lab-hero-product-label">COUNTER PICK / 001</span>{featured && <><strong>{featured.name}</strong><span>{featured.brandName} · {formatDT(featured.priceMillimes)}</span></>}<ArrowRightIcon size={15} /></div>
    <div className="lab-hero-bottom"><span>Le comptoir, en ligne et à Tunis</span><span>Authentique / Conseillé / Livré</span></div>
  </section>;
}

function Signal() {
  const items = [{ number: "01", title: "Vous choisissez", text: "Une sélection lisible, pensée pour de vrais besoins." }, { number: "02", title: "Nous vérifions", text: "Des produits authentiques, des conseils de pharmaciens." }, { number: "03", title: "Vous recevez", text: "Partout en Tunisie, avec un suivi sans surprise." }];
  return <section className="lab-signal"><div className="container-wide"><div className="lab-signal-lead"><ModuleTag index="02" label="Notre méthode" light /><h2>Le soin<br /><em>sans détour.</em></h2></div><div className="lab-signal-list">{items.map((item) => <div className="lab-signal-item" key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></div>)}</div></div></section>;
}

function UniverseBoard({ universes, copy }: { universes: Universe[]; copy: HomeCopy }) {
  return <section className="lab-section lab-board"><div className="container-wide"><div className="lab-section-title"><div><ModuleTag index="03" label={copy.rayonsEyebrow} /><h2>Explorer<br /><em>par besoin.</em></h2></div><div className="lab-section-aside"><p>{copy.rayonsDesc}</p><Link href="/boutique" className="lab-inline-link">{copy.rayonsCta}<ArrowRightIcon size={13} /></Link></div></div><div className="lab-universe-board">{universes.slice(0, 7).map((universe, i) => <Link href={`/univers/${universe.slug}`} className={`lab-universe lab-universe-${i + 1}`} key={universe.id}><div>{universe.image && <Image src={universe.image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" className="object-cover" />}</div><span className="lab-universe-no">0{i + 1}</span><span className="lab-universe-name">{universe.name}</span><ArrowRightIcon size={14} /></Link>)}</div></div></section>;
}

function CounterShelf({ products, title, label, action }: { products: Product[]; title: string; label: string; action: string }) {
  if (!products.length) return null;
  return <section className="lab-section lab-counter"><div className="container-wide"><div className="lab-section-title"><div><ModuleTag index="04" label={label} /><h2 id="lab-products-title">La sélection<br /><em>du comptoir.</em></h2></div><Link href="/boutique" className="lab-button lab-button-line">{action}<ArrowRightIcon size={14} /></Link></div><div className="lab-products"><div><LabProduct product={products[0]} large /><div className="lab-product-note"><span>NOTE DU PHARMACIEN</span><p>La référence juste au bon moment : formulée, testée, conseillée.</p></div></div><div className="lab-product-grid">{products.slice(1, 5).map((product) => <LabProduct product={product} key={product.id} />)}</div></div></div></section>;
}

function NeedIndex({ concerns, copy }: { concerns: Concern[]; copy: HomeCopy }) {
  return <section className="lab-needs"><div className="container-wide"><div className="lab-needs-copy"><ModuleTag index="05" label={copy.needsEyebrow} light /><h2>{copy.needsTitle1}<br /><em>{copy.needsTitle2}</em></h2><p>{copy.needsText}</p><Link href="/diagnostic" className="lab-button lab-button-light">{copy.needsCta}<ArrowRightIcon size={14} /></Link></div><div className="lab-needs-list">{concerns.slice(0, 7).map((concern, i) => <Link href={`/besoin/${concern.slug}`} key={concern.id}><span>0{i + 1}</span><strong>{concern.name}</strong><ArrowRightIcon size={15} /></Link>)}</div></div></section>;
}

function Journal({ posts, brands, copy, common }: { posts: Article[]; brands: Brand[]; copy: HomeCopy; common: CommonCopy }) {
  return <section className="lab-section lab-journal"><div className="container-wide"><div className="lab-section-title"><div><ModuleTag index="06" label={copy.journalEyebrow} /><h2>Le journal<br /><em>du comptoir.</em></h2></div><Link href="/journal" className="lab-inline-link">{copy.journalCta}<ArrowRightIcon size={13} /></Link></div><div className="lab-journal-grid">{posts.slice(0, 3).map((post, i) => <Link href={`/journal/${post.slug}`} className={`lab-story lab-story-${i + 1}`} key={post.id}><div className="lab-story-image">{post.image && <Image src={post.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" className="object-cover" />}</div><div className="lab-story-copy"><span>{post.tag ?? "CONSEIL"} / {post.readMinutes} {common.minutes}</span><h3>{post.title}</h3><p>{post.excerpt}</p><b>Lire <ArrowRightIcon size={13} /></b></div></Link>)}</div><div className="lab-brand-strip"><span>LES LABORATOIRES</span>{brands.slice(0, 8).map((brand) => <Link href={`/marque/${brand.slug}`} key={brand.id}>{brand.name}</Link>)}</div></div></section>;
}

export function EditorialHome({ universes, featured, newArrivals, promos, concerns, posts, brands, copy, common }: { universes: Universe[]; featured: Product[]; newArrivals: Product[]; promos: Product[]; concerns: Concern[]; posts: Article[]; brands: Brand[]; copy: HomeCopy; common: CommonCopy }) {
  return <div className="lab-home"><Hero copy={copy.hero} featured={featured[0] ?? null} /><Signal /><UniverseBoard universes={universes} copy={copy} /><CounterShelf products={featured} title="" label="Au comptoir" action={common.viewAll} /><NeedIndex concerns={concerns} copy={copy} /><CounterShelf products={newArrivals.length ? newArrivals : promos} title="" label="Nouveautés" action={common.viewAll} /><Journal posts={posts} brands={brands} copy={copy} common={common} /><section className="lab-end"><div className="container-wide"><ModuleTag index="07" label="Cléopâtre / Tunisie" light /><h2>Votre rituel.<br /><em>Notre regard.</em></h2><div><Link href="/boutique" className="lab-button lab-button-accent">Entrer dans la boutique <ArrowRightIcon size={14} /></Link><Link href="/boutiques" className="lab-inline-link lab-inline-link-light"><MapPinIcon size={14} /> Nos comptoirs</Link></div></div></section></div>;
}
