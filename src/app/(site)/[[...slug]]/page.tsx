/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, stores } from "@/db/schema";
import { getBrands, getFeatured, getNewArrivals, getProductBySlug, getPromoProducts, getUniverses, listProducts } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { ArrowRightIcon } from "@/components/icons";
import { RebuildProductCard, RebuildProductGrid, RebuildRouteTitle, RebuildTrustBar } from "@/components/rebuild/rebuild-ui";
import type { ProductCard } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cléopâtre — Espace Santé Beauté", description: "Des soins authentiques, conseillés par des pharmaciens, livrés partout en Tunisie." };
type Params = { slug?: string[] };

function Button({ href, children, light = false }: { href: string; children: ReactNode; light?: boolean }) { return <Link href={href} className={`rb-button ${light ? "rb-button-light" : "rb-button-dark"}`}>{children}</Link>; }

async function Home() {
  const [universes, featured, novelties, posts, brandRows] = await Promise.all([
    getUniverses(), getFeatured(8), getNewArrivals(4), db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(3), db.select().from(brands).where(eq(brands.isFeatured, true)).limit(8),
  ]);
  return <div className="rb-home">
    <section className="rb-hero"><div className="rb-hero-copy"><span className="rb-kicker">01 / LA MAISON</span><h1>Le soin,<br /><em>sans</em> détour.</h1><p>Une sélection courte. Des produits authentiques. Le regard de pharmaciens pour vous aider à choisir ce qui vous correspond vraiment.</p><div className="rb-hero-actions"><Button href="/boutique">Explorer le shop <span>↗</span></Button><Link href="/diagnostic" className="rb-text-link rb-text-link-light">Faire le diagnostic</Link></div></div><div className="rb-hero-visual"><Image src="/images/hero.jpg" alt="Cléopâtre, espace santé beauté" fill priority sizes="(max-width: 800px) 100vw, 52vw" className="object-cover" /><span className="rb-hero-visual-label">TUNIS / 36°48'N</span><div className="rb-hero-stamp"><span>C</span><small>ESP.<br />SANTÉ<br />BEAUTÉ</small></div></div><div className="rb-hero-bottom"><span>Conseil au comptoir</span><span>Authentique / Conseillé / Livré</span></div></section>
    <RebuildTrustBar />
    <section className="rb-section rb-doors"><div className="rb-section-heading"><div><span className="rb-kicker">02 / LES PORTES</span><h2>Choisir son<br /><em>terrain.</em></h2></div><div><p>Visage, cheveux, corps, bébé, soleil. Entrez par ce qui vous préoccupe aujourd'hui.</p><Link href="/boutique" className="rb-text-link">Voir tous les rayons <span>↗</span></Link></div></div><div className="rb-door-grid">{universes.slice(0, 7).map((u, i) => <Link href={`/univers/${u.slug}`} className={`rb-door rb-door-${i + 1}`} key={u.id}>{u.image && <Image src={u.image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" className="object-cover" />}<span>{String(i + 1).padStart(2, "0")}</span><strong>{u.name}</strong><i>↗</i></Link>)}</div></section>
    <section className="rb-section rb-selected"><div className="rb-section-heading"><div><span className="rb-kicker">03 / LE COMPTOIR</span><h2>La sélection<br /><em>du moment.</em></h2></div><Link href="/boutique" className="rb-button rb-button-line">Tout voir <span>↗</span></Link></div><div className="rb-feature-grid">{featured.slice(0, 5).map((p, i) => <RebuildProductCard key={p.id} product={p} feature={i === 0} />)}</div></section>
    <section className="rb-statement"><span className="rb-kicker">04 / NOTRE MANIÈRE</span><h2>Pas plus de produits.<br /><em>De meilleurs choix.</em></h2><Button href="/diagnostic" light>Parler à un pharmacien <span>↗</span></Button></section>
    <section className="rb-section rb-reading"><div className="rb-section-heading"><div><span className="rb-kicker">05 / LE JOURNAL</span><h2>Lire avant<br /><em>de choisir.</em></h2></div><Link href="/journal" className="rb-text-link">Tout le journal <span>↗</span></Link></div><div className="rb-reading-grid">{posts.map((a, i) => <Link href={`/journal/${a.slug}`} className={`rb-reading-card rb-reading-${i + 1}`} key={a.id}>{a.image && <div className="rb-reading-image"><Image src={a.image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" className="object-cover" /></div>}<span>{a.tag ?? "CONSEIL"} / {a.readMinutes} MIN</span><h3>{a.title}</h3><p>{a.excerpt}</p><b>Lire l'article ↗</b></Link>)}</div><div className="rb-brands">{brandRows.map((b) => <Link href={`/marque/${b.slug}`} key={b.id}>{b.name}</Link>)}</div></section>
    {novelties.length > 0 && <section className="rb-section rb-arrivals"><div className="rb-section-heading"><div><span className="rb-kicker">06 / ARRIVAGES</span><h2>Les nouveaux<br /><em>gestes.</em></h2></div><Link href="/boutique?sort=newest" className="rb-text-link">Découvrir <span>↗</span></Link></div><RebuildProductGrid products={novelties} /></section>}
  </div>;
}

async function CatalogRoute({ kind, value }: { kind: string; value?: string }) {
  const universes = await getUniverses();
  let title: ReactNode = <>Tout le<br /><em>shop.</em></>;
  let eyebrow = "02 / SHOP";
  let description = "Une sélection de soins, compléments et essentiels retenus par nos pharmaciens.";
  let products: ProductCard[];
  if (kind === "univers" && value) {
    const u = universes.find((x) => x.slug === value); title = <>{u?.name ?? "Le rayon"}<br /><em>à votre façon.</em></>; eyebrow = `02 / ${u?.name ?? "RAYON"}`; description = u?.description ?? description; products = (await listProducts({ universeId: u?.id, perPage: 24 })).items;
  } else if (kind === "promotions") { title = <>Les offres<br /><em>du moment.</em></>; eyebrow = "02 / OFFRES"; products = await getPromoProducts(24); }
  else products = (await listProducts({ perPage: 24 })).items;
  return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow={eyebrow} title={title} description={description} action={<Button href="/diagnostic">Besoin d'aide ?</Button>} /><div className="rb-route-toolbar"><span>{products.length} références</span><Link href="/boutique?sort=newest">Nouveautés ↗</Link><Link href="/boutique?sort=price_asc">Prix croissant ↗</Link></div><RebuildProductGrid products={products} /></div></div>;
}

async function JournalRoute({ articleSlug }: { articleSlug?: string }) {
  if (articleSlug) {
    const article = await db.query.articles.findFirst({ where: eq(articles.slug, articleSlug) });
    if (!article) return <Generic title="Ce numéro n'existe pas encore." />;
    return <article className="rb-article"><div className="rb-article-head"><span className="rb-kicker">{article.tag ?? "CONSEIL"} / {article.readMinutes} MIN</span><h1>{article.title}</h1><p>{article.excerpt}</p></div>{article.image && <div className="rb-article-image"><Image src={article.image} alt="" fill sizes="100vw" className="object-cover" /></div>}<div className="rb-article-body"><p className="rb-article-byline">{article.author ?? "L'équipe Cléopâtre"} · Pharmacie & conseil</p><div>{article.body.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div><Link href="/journal" className="rb-text-link">← Retour au journal</Link></div></article>;
  }
  const rows = await db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt));
  return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LE JOURNAL" title={<>Lire avant<br /><em>de choisir.</em></>} description="Les conseils de nos pharmaciens, les ingrédients à comprendre et les gestes qui changent une routine." /><div className="rb-journal-list">{rows.map((a, i) => <Link href={`/journal/${a.slug}`} key={a.id}><span>{String(i + 1).padStart(2, "0")}</span><div><small>{a.tag ?? "CONSEIL"} / {a.readMinutes} MIN</small><h2>{a.title}</h2><p>{a.excerpt}</p></div><b>↗</b></Link>)}</div></div></div>;
}

async function BrandsRoute({ brandSlug }: { brandSlug?: string }) {
  if (brandSlug) { const brand = await db.query.brands.findFirst({ where: eq(brands.slug, brandSlug) }); if (!brand) return <Generic title="Laboratoire introuvable." />; const products = (await listProducts({ brandSlugs: [brandSlug], perPage: 24 })).items; return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LABORATOIRE" title={<>{brand.name}<br /><em>la maison.</em></>} description={brand.story ?? "Une maison retenue par Cléopâtre pour la qualité de ses formules."} /><RebuildProductGrid products={products} /></div></div>; }
  const rows = await getBrands(); return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LES LABORATOIRES" title={<>Des maisons<br /><em>qui s'engagent.</em></>} description="Nous ne travaillons qu'avec des laboratoires dont nous connaissons les formules et les exigences." /><div className="rb-brand-list">{rows.map((b, i) => <Link href={`/marque/${b.slug}`} key={b.id}><span>{String(i + 1).padStart(2, "0")}</span><strong>{b.name}</strong><small>{b.country ?? "International"}</small><b>↗</b></Link>)}</div></div></div>;
}

async function ProductRoute({ slug }: { slug: string }) {
  const p = await getProductBySlug(slug); if (!p) return <Generic title="Référence introuvable." />;
  return <div className="rb-product-page"><div className="rb-product-page-image">{p.image && <Image src={p.image} alt={p.name} fill priority sizes="(max-width: 800px) 100vw, 55vw" className="object-cover" />}<span>REF / {String(p.id).padStart(3, "0")}</span></div><div className="rb-product-page-copy"><Link href="/boutique" className="rb-back">← Retour au shop</Link><small>{p.brand?.name ?? "Cléopâtre"}</small><h1>{p.name}</h1><p className="rb-product-page-price">{new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3 }).format(p.priceMillimes / 1000)} DT</p><p className="rb-product-page-description">{p.shortDescription ?? p.description ?? "Une référence sélectionnée par nos pharmaciens."}</p><div className="rb-product-facts"><span>Authentique</span><span>Conseillé au comptoir</span><span>{p.volume ?? "Usage quotidien"}</span></div><Button href="/commande">Ajouter à la routine <ArrowRightIcon size={14} /></Button><Link href="/diagnostic" className="rb-text-link">Une question ? Parler à un pharmacien</Link></div></div>;
}

async function StoresRoute() { const rows = await db.select().from(stores).where(eq(stores.isActive, true)); return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LES COMPTOIRS" title={<>Venez nous<br /><em>rencontrer.</em></>} description="Deux adresses à Ezzahra et Hammam-Lif. Le même regard, en personne." /><div className="rb-stores">{rows.map((s, i) => <article key={s.id}><span>0{i + 1}</span><h2>{s.name}</h2><p>{s.address}<br />{s.city}</p><strong>{s.hours}</strong><a href={`tel:+216${s.phone}`}>{s.phone}</a><a className="rb-text-link" href={s.mapsUrl ?? "#"}>Voir sur la carte ↗</a></article>)}</div></div></div>; }

async function AccountRoute() { const user = await getCurrentUser(); if (!user) return <Generic title={<>Votre espace<br /><em>vous attend.</em></>} description="Connectez-vous pour retrouver vos commandes, favoris et routines." href="/connexion" />; return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="VOTRE ESPACE" title={<>Bonjour,<br /><em>{user.firstName}.</em></>} description="Retrouvez ici les choses que vous voulez garder près de vous." /><div className="rb-account-grid"><Link href="/compte/commandes"><span>01</span><h2>Commandes</h2><p>Suivre vos livraisons et retrouver vos factures.</p>↗</Link><Link href="/compte/favoris"><span>02</span><h2>Favoris</h2><p>Les références que vous voulez garder.</p>↗</Link><Link href="/compte/profil"><span>03</span><h2>Profil</h2><p>Vos informations et vos adresses.</p>↗</Link></div></div></div>; }

function Generic({ title, description = "Cette page est en préparation au comptoir.", href = "/boutique" }: { title: ReactNode; description?: string; href?: string }) { return <div className="rb-generic"><span className="rb-kicker">CLÉOPÂTRE / EN COURS</span><h1>{title}</h1><p>{description}</p><Button href={href}>Retourner au shop <ArrowRightIcon size={14} /></Button></div>; }

export default async function RebuiltCatchAll({ params }: { params: Promise<Params> }) {
  const { slug = [] } = await params; const [first, second] = slug;
  if (!slug.length) return <Home />;
  if (["boutique", "recherche", "promotions", "univers"].includes(first)) return <CatalogRoute kind={first} value={second} />;
  if (first === "categorie" && second) return <CatalogRoute kind="univers" value={second} />;
  if (first === "journal") return <JournalRoute articleSlug={second} />;
  if (first === "marques" || first === "marque") return <BrandsRoute brandSlug={second} />;
  if (first === "boutiques") return <StoresRoute />;
  if (first === "produit" && second) return <ProductRoute slug={second} />;
  if (["compte", "connexion", "inscription"].includes(first)) return <AccountRoute />;
  if (["aide", "livraison", "cgv", "confidentialite", "diagnostic", "panier", "commande", "suivi", "mot-de-passe-oublie", "comparer", "liste"].includes(first)) return <Generic title={first === "diagnostic" ? <>On commence<br /><em>par vous.</em></> : <>Un service<br /><em>sans détour.</em></>} description="Notre équipe est là pour vous guider, répondre à vos questions et vous accompagner jusqu'au bon produit." href={first === "diagnostic" ? "/boutique" : "/"} />;
  return <Generic title="Cette page n'existe pas." />;
}
