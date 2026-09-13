"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon, ClockIcon, MapPinIcon, PlusIcon, SparklesIcon, TruckIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-provider";
import { useReducedMotion, motion, useScroll, useTransform } from "framer-motion";
import { formatDT } from "@/lib/money";
import type { ProductCard as Product } from "@/lib/catalog";
import type { Article, Brand, Category, Concern } from "@/db/schema";

/**
 * The new front door of Cléopâtre.
 *
 * This is deliberately not a collection of stacked marketing bands. It is a
 * responsive editorial index: one strong entry point, a browseable wall of
 * needs, a compact shelf, then proof and advice. The catalogue remains live;
 * the visual language around it is entirely new.
 */

type Universe = Category & { children: Category[] };

type HomeCopy = {
  hero: { eyebrow: string; titleLine1: string; titleLine2: string; titleLine3a: string; titleLine3b: string; intro1: string; introAccent: string; intro2: string; shopCta: string; adviceCta: string; photoAlt: string };
  rayonsIndex: string; rayonsEyebrow: string; rayonsTitle: string; rayonsDesc: string; rayonsCta: string;
  needsEyebrow: string; needsTitle1: string; needsTitle2: string; needsText: string; needsCta: string;
  journalEyebrow: string; journalTitle: string; journalCta: string;
  housesEyebrow: string; housesTitle: string; housesDesc: string; housesCta: string;
};

type CommonCopy = { discover: string; viewAll: string; minutes: string };

function SectionMarker({ number, label, dark = false }: { number: string; label: string; dark?: boolean }) {
  return (
    <div className={`eh-marker ${dark ? "eh-marker-dark" : ""}`}>
      <span className="eh-marker-number">{number}</span>
      <span className="eh-marker-rule" />
      <span>{label}</span>
    </div>
  );
}

function AddButton({ product }: { product: Product }) {
  const cart = useCart();
  const plate = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const unavailable = product.stock <= 0;

  const add = () => {
    if (unavailable) return;
    cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brandName: product.brandName,
        image: product.image,
        priceMillimes: product.priceMillimes,
        stock: product.stock,
        volume: product.volume,
      },
      1,
      plate.current,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={add}
      disabled={unavailable}
      className="eh-product-add"
      data-added={added}
      aria-label={`${added ? "Ajouté" : "Ajouter"} — ${product.name}`}
    >
      {added ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
      <span>{added ? "Ajouté" : unavailable ? "Indisponible" : "Ajouter"}</span>
    </button>
  );
}

function ProductTile({ product, featured = false }: { product: Product; featured?: boolean }) {
  const plate = useRef<HTMLDivElement>(null);
  const discount = product.compareAtMillimes && product.compareAtMillimes > product.priceMillimes;
  const percent = discount ? Math.round((1 - product.priceMillimes / product.compareAtMillimes!) * 100) : 0;

  return (
    <article className={`eh-product ${featured ? "eh-product-featured" : ""}`}>
      <div ref={plate} className="eh-product-image">
        <Link href={`/produit/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          {product.image ? <Image src={product.image} alt="" fill sizes={featured ? "(max-width: 900px) 100vw, 44vw" : "(max-width: 700px) 50vw, 22vw"} className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" /> : <div className="h-full w-full bg-marble" />}
        </Link>
        <div className="eh-product-badges">
          {percent > 0 && <span className="eh-badge eh-badge-dark">−{percent}%</span>}
          {product.isNew && !percent && <span className="eh-badge">Nouveau</span>}
        </div>
        <div className="eh-product-hover">
          <AddButton product={product} />
          <Link href={`/produit/${product.slug}`} className="eh-product-detail">Voir le produit <ArrowRightIcon size={13} /></Link>
        </div>
      </div>
      <div className="eh-product-caption">
        <div className="flex items-baseline justify-between gap-3">
          <span className="eh-product-brand">{product.brandName ?? "Cléopâtre"}</span>
          {product.volume && <span className="eh-product-volume">{product.volume}</span>}
        </div>
        <h3><Link href={`/produit/${product.slug}`}>{product.name}</Link></h3>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="eh-product-price">{formatDT(product.priceMillimes)} {discount && <del>{formatDT(product.compareAtMillimes!)}</del>}</p>
          {product.ratingCount > 0 && <span className="eh-rating">★ {(product.ratingAvg / 100).toFixed(1)}</span>}
        </div>
      </div>
    </article>
  );
}

function Hero({ copy, featured }: { copy: HomeCopy["hero"]; featured: Product | null }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, reduce ? 1.02 : 1.12]);

  return (
    <section ref={ref} className="eh-hero" aria-labelledby="eh-hero-title">
      <div className="eh-hero-grid" aria-hidden />
      <div className="eh-hero-copy">
        <SectionMarker number="00" label="L'espace santé beauté" />
        <motion.h1 id="eh-hero-title" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          {copy.titleLine1}<br />
          <em>{copy.titleLine2}</em><br />
          {copy.titleLine3a} <em>{copy.titleLine3b}</em>
        </motion.h1>
        <motion.p className="eh-hero-intro" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.8 }}>
          {copy.intro1}<strong>{copy.introAccent}</strong>{copy.intro2}
        </motion.p>
        <div className="eh-hero-actions">
          <Link href="/boutique" className="eh-button eh-button-dark">{copy.shopCta}<ArrowRightIcon size={14} /></Link>
          <Link href="/diagnostic" className="eh-text-link">{copy.adviceCta}</Link>
        </div>
      </div>

      <motion.div className="eh-hero-photo" style={{ y: imageY, scale: imageScale }}>
        <Image src="/images/hero.jpg" alt={copy.photoAlt} fill priority sizes="(max-width: 900px) 100vw, 54vw" className="object-cover" />
        <div className="eh-hero-photo-wash" />
        <span className="eh-photo-label">ÉDITION 2026 / TUNISIE</span>
      </motion.div>

      <div className="eh-hero-note">
        <span className="eh-note-star">✦</span>
        <div><span>La sélection du comptoir</span>{featured ? <strong>{featured.name}</strong> : <strong>Choisie pour vous</strong>}</div>
        <ArrowRightIcon size={15} />
      </div>
      <div className="eh-hero-foot"><span>Scroll to explore</span><span className="eh-hero-line" /></div>
    </section>
  );
}

function UniverseWall({ universes, copy }: { universes: Universe[]; copy: HomeCopy }) {
  return (
    <section className="eh-section eh-universes" aria-labelledby="eh-universes-title">
      <div className="container-wide">
        <div className="eh-section-head eh-section-head-wide">
          <div><SectionMarker number="01" label={copy.rayonsEyebrow} /><h2 id="eh-universes-title">{copy.rayonsTitle}</h2></div>
          <div className="eh-head-aside"><p>{copy.rayonsDesc}</p><Link href="/boutique" className="eh-text-link">{copy.rayonsCta}<ArrowRightIcon size={13} /></Link></div>
        </div>
        <div className="eh-universe-grid">
          {universes.slice(0, 7).map((u, i) => (
            <Link key={u.id} href={`/univers/${u.slug}`} className={`eh-universe-card eh-universe-${i + 1}`}>
              <div className="eh-universe-image">{u.image && <Image src={u.image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" className="object-cover transition-transform duration-700 ease-out" />}</div>
              <div className="eh-universe-shade" />
              <span className="eh-universe-number">0{i + 1}</span>
              <div className="eh-universe-label"><span>{u.children.length} collections</span><strong>{u.name}</strong><ArrowRightIcon size={16} /></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Principles({ copy }: { copy: HomeCopy }) {
  const items = [
    { no: "01", title: "Conseil réel", text: "Une équipe de pharmaciens pour vous aider à choisir juste, sans pousser à l'achat.", icon: SparklesIcon },
    { no: "02", title: "Origine garantie", text: "Des références authentiques, sélectionnées auprès des laboratoires que nous connaissons.", icon: CheckIcon },
    { no: "03", title: "Livraison claire", text: "Votre commande arrive partout en Tunisie, avec un suivi simple du comptoir à chez vous.", icon: TruckIcon },
  ];
  return (
    <section className="eh-principles">
      <div className="container-wide">
        <div className="eh-principles-intro"><SectionMarker number="02" label="Notre manière" dark /><h2>Moins de bruit.<br /><em>Plus de justesse.</em></h2><Link href="/aide" className="eh-button eh-button-light">Nous découvrir <ArrowRightIcon size={14} /></Link></div>
        <div className="eh-principles-list">{items.map((item) => { const Icon = item.icon; return <div className="eh-principle" key={item.no}><span className="eh-principle-no">{item.no}</span><Icon size={22} /><h3>{item.title}</h3><p>{item.text}</p></div>; })}</div>
      </div>
    </section>
  );
}

function Shelf({ title, eyebrow, products, action }: { title: string; eyebrow: string; products: Product[]; action: string }) {
  if (!products.length) return null;
  return (
    <section className="eh-section eh-shelf" aria-labelledby="eh-shelf-title">
      <div className="container-wide">
        <div className="eh-section-head"><div><SectionMarker number="03" label={eyebrow} /><h2 id="eh-shelf-title">{title}</h2></div><Link href="/boutique" className="eh-button eh-button-outline">{action}<ArrowRightIcon size={14} /></Link></div>
        <div className="eh-product-layout">
          <div className="eh-product-lead">{products[0] && <ProductTile product={products[0]} featured />}<div className="eh-lead-caption"><span>Le choix de la semaine</span><p>Une référence choisie pour son efficacité, sa tolérance et sa place dans une vraie routine.</p></div></div>
          <div className="eh-product-grid">{products.slice(1, 5).map((p) => <ProductTile product={p} key={p.id} />)}</div>
        </div>
      </div>
    </section>
  );
}

function Needs({ concerns, copy }: { concerns: Concern[]; copy: HomeCopy }) {
  const picks = concerns.slice(0, 8);
  return (
    <section className="eh-needs eh-section" aria-labelledby="eh-needs-title">
      <div className="container-wide eh-needs-inner">
        <div className="eh-needs-question"><SectionMarker number="04" label={copy.needsEyebrow} /><h2 id="eh-needs-title">{copy.needsTitle1}<br /><em>{copy.needsTitle2}</em></h2><p>{copy.needsText}</p><Link href="/diagnostic" className="eh-button eh-button-dark">{copy.needsCta}<ArrowRightIcon size={14} /></Link></div>
        <div className="eh-needs-index">{picks.map((concern, i) => <Link href={`/besoin/${concern.slug}`} key={concern.id}><span>0{i + 1}</span><strong>{concern.name}</strong><ArrowRightIcon size={14} /></Link>)}</div>
      </div>
    </section>
  );
}

function Journal({ posts, brands, copy, common }: { posts: Article[]; brands: Brand[]; copy: HomeCopy; common: CommonCopy }) {
  return (
    <section className="eh-section eh-journal" aria-labelledby="eh-journal-title">
      <div className="container-wide">
        <div className="eh-section-head"><div><SectionMarker number="05" label={copy.journalEyebrow} /><h2 id="eh-journal-title">{copy.journalTitle}</h2></div><Link href="/journal" className="eh-text-link">{copy.journalCta}<ArrowRightIcon size={13} /></Link></div>
        <div className="eh-journal-grid">
          {posts.slice(0, 3).map((post, i) => <Link href={`/journal/${post.slug}`} className={`eh-story eh-story-${i + 1}`} key={post.id}><div className="eh-story-image">{post.image && <Image src={post.image} alt="" fill sizes="(max-width: 700px) 100vw, 35vw" className="object-cover transition-transform duration-700 ease-out" />}</div><div className="eh-story-copy"><span>{post.tag ?? "Conseil"} · {post.readMinutes} {common.minutes}</span><h3>{post.title}</h3><p>{post.excerpt}</p><span className="eh-story-more">Lire l&apos;article <ArrowRightIcon size={13} /></span></div></Link>)}
        </div>
        <div className="eh-brands-line"><span>Les maisons que nous aimons</span>{brands.slice(0, 6).map((brand) => <Link key={brand.id} href={`/marque/${brand.slug}`}>{brand.name}</Link>)}</div>
      </div>
    </section>
  );
}

export function EditorialHome({ universes, featured, newArrivals, promos, concerns, posts, brands, copy, common }: { universes: Universe[]; featured: Product[]; newArrivals: Product[]; promos: Product[]; concerns: Concern[]; posts: Article[]; brands: Brand[]; copy: HomeCopy; common: CommonCopy }) {
  return (
    <div className="eh-home">
      <Hero copy={copy.hero} featured={featured[0] ?? null} />
      <UniverseWall universes={universes} copy={copy} />
      <Principles copy={copy} />
      <Shelf title="Les indispensables" eyebrow="Au comptoir" products={featured} action={common.viewAll} />
      <Needs concerns={concerns} copy={copy} />
      <Shelf title="Nouveaux gestes" eyebrow="Arrivages" products={newArrivals.length ? newArrivals : promos} action={common.viewAll} />
      <Journal posts={posts} brands={brands} copy={copy} common={common} />
      <section className="eh-closing"><div className="container-wide"><span className="eh-closing-kicker">Cléopâtre / Espace Santé Beauté</span><h2>Votre routine<br /><em>commence ici.</em></h2><div className="eh-closing-actions"><Link href="/boutique" className="eh-button eh-button-light">Entrer dans la boutique <ArrowRightIcon size={14} /></Link><Link href="/boutiques" className="eh-text-link eh-text-link-light"><MapPinIcon size={14} /> Nos comptoirs</Link></div></div></section>
    </div>
  );
}
