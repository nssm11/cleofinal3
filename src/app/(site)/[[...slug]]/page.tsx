/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, articles, brands, stores } from "@/db/schema";
import { getBrands, getCompareRows, getFeatured, getNewArrivals, getProductBySlug, getPromoProducts, getRelated, getUniverses, listProducts } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { Diagnostic } from "@/components/experience/diagnostic";
import { ContactForm } from "@/components/shell/contact-form";
import { ArrowRightIcon } from "@/components/icons";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { CartPage } from "@/components/checkout/cart-page";
import { LoginForm, RegisterForm, ForgotPasswordForm } from "@/components/account/auth-forms";
import { RebuildBuy, RebuildProductCard, RebuildProductGrid, RebuildRouteTitle, RebuildTrustBar } from "@/components/rebuild/rebuild-ui";
import { enabledPaymentMethods } from "@/lib/payments";
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
    <section className="rb-section rb-guidance"><div className="rb-section-heading"><div><span className="rb-kicker">07 / LE BON DÉPART</span><h2>Une porte pour<br /><em>chaque besoin.</em></h2></div><div><p>Vous ne savez pas par où commencer ? Nous avons prévu plusieurs façons d'entrer dans la maison.</p><Link href="/aide" className="rb-text-link">Parler au comptoir <span>↗</span></Link></div></div><div className="rb-guidance-grid"><Link href="/diagnostic" className="rb-guidance-card"><span>01 / SUR MESURE</span><h3>Faire le diagnostic</h3><p>Quelques questions, une routine plus juste et des produits expliqués.</p><b>Commencer ↗</b></Link><Link href="/boutiques" className="rb-guidance-card"><span>02 / EN PERSONNE</span><h3>Venir au comptoir</h3><p>Deux adresses, le même regard de pharmacien et le temps de vous écouter.</p><b>Voir les adresses ↗</b></Link><Link href="/livraison" className="rb-guidance-card"><span>03 / SANS DÉTOUR</span><h3>Commander sereinement</h3><p>Livraison partout en Tunisie, retrait en deux heures et suivi clair.</p><b>Comprendre la livraison ↗</b></Link></div></section>
  </div>;
}

async function CatalogRoute({ kind, value, query, sort }: { kind: string; value?: string; query?: string; sort?: string }) {
  const universes = await getUniverses();
  let title: ReactNode = <>Tout le<br /><em>shop.</em></>;
  let eyebrow = "02 / SHOP";
  let description = "Une sélection de soins, compléments et essentiels retenus par nos pharmaciens.";
  let products: ProductCard[];
  const validSort = ["featured", "price_asc", "price_desc", "newest", "rating", "bestsellers"] as const;
  const selectedSort = validSort.includes(sort as (typeof validSort)[number]) ? sort as (typeof validSort)[number] : "featured";
  if (kind === "univers" && value) {
    const u = universes.find((x) => x.slug === value); title = <>{u?.name ?? "Le rayon"}<br /><em>à votre façon.</em></>; eyebrow = `02 / ${u?.name ?? "RAYON"}`; description = u?.description ?? description; products = (await listProducts({ universeId: u?.id, perPage: 24, sort: selectedSort })).items;
  } else if (kind === "promotions") { title = <>Les offres<br /><em>du moment.</em></>; eyebrow = "02 / OFFRES"; products = await getPromoProducts(24); }
  else if (kind === "recherche") { title = <>Résultats<br /><em>de recherche.</em></>; eyebrow = query ? `RECHERCHE / ${query}` : "RECHERCHE"; description = query ? `Les références qui répondent à « ${query} ». Affinez ou choisissez un autre mot.` : "Cherchez un produit, une marque ou un besoin."; products = (await listProducts({ q: query, perPage: 24, sort: selectedSort })).items; }
  else products = (await listProducts({ perPage: 24, sort: selectedSort })).items;
  const sortHref = (next: string) => kind === "recherche" ? `/recherche?q=${encodeURIComponent(query ?? "")}&sort=${next}` : `/boutique?sort=${next}`;
  return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow={eyebrow} title={title} description={description} action={<Button href="/diagnostic">Besoin d'aide ?</Button>} /><div className="rb-catalog-rail"><span>Entrer par univers</span><div><Link href="/boutique">Tout le shop</Link>{universes.slice(0, 7).map((u) => <Link href={`/univers/${u.slug}`} key={u.id}>{u.name}</Link>)}</div></div><div className="rb-route-toolbar"><span>{products.length} références</span>{["recherche", "boutique"].includes(kind) && <form action="/recherche" method="get" className="rb-search-form"><input name="q" defaultValue={query ?? ""} placeholder="Produit, marque, besoin" aria-label="Rechercher un produit" /><button type="submit">Rechercher ↗</button></form>}<Link href={sortHref("newest")}>Nouveautés ↗</Link><Link href={sortHref("price_asc")}>Prix croissant ↗</Link><Link href={sortHref("price_desc")}>Prix décroissant ↗</Link></div><RebuildProductGrid products={products} /></div></div>;
}

async function JournalRoute({ articleSlug }: { articleSlug?: string }) {
  if (articleSlug) {
    const article = await db.query.articles.findFirst({ where: eq(articles.slug, articleSlug) });
    if (!article) return <Generic title="Ce numéro n'existe pas encore." />;
    return <article className="rb-article"><div className="rb-article-head"><span className="rb-kicker">{article.tag ?? "CONSEIL"} / {article.readMinutes} MIN</span><h1>{article.title}</h1><p>{article.excerpt}</p></div>{article.image && <div className="rb-article-image"><Image src={article.image} alt="" fill sizes="100vw" className="object-cover" /></div>}<div className="rb-article-body"><p className="rb-article-byline">{article.author ?? "L'équipe Cléopâtre"} · Pharmacie & conseil</p><div>{article.body.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div><Link href="/journal" className="rb-text-link">← Retour au journal</Link></div></article>;
  }
  const rows = await db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt));
  return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LE JOURNAL" title={<>Lire avant<br /><em>de choisir.</em></>} description="Les conseils de nos pharmaciens, les ingrédients à comprendre et les gestes qui changent une routine." /><div className="rb-journal-list">{rows.map((a, i) => <Link href={`/journal/${a.slug}`} key={a.id}><span>{String(i + 1).padStart(2, "0")}</span><div className="rb-journal-thumb">{a.image && <Image src={a.image} alt="" fill sizes="128px" className="object-cover" />}</div><div><small>{a.tag ?? "CONSEIL"} / {a.readMinutes} MIN</small><h2>{a.title}</h2><p>{a.excerpt}</p></div><b>↗</b></Link>)}</div></div></div>;
}

async function BrandsRoute({ brandSlug }: { brandSlug?: string }) {
  if (brandSlug) { const brand = await db.query.brands.findFirst({ where: eq(brands.slug, brandSlug) }); if (!brand) return <Generic title="Laboratoire introuvable." />; const products = (await listProducts({ brandSlugs: [brandSlug], perPage: 24 })).items; return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LABORATOIRE" title={<>{brand.name}<br /><em>la maison.</em></>} description={brand.story ?? "Une maison retenue par Cléopâtre pour la qualité de ses formules."} /><RebuildProductGrid products={products} /></div></div>; }
  const rows = await getBrands(); return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LES LABORATOIRES" title={<>Des maisons<br /><em>qui s'engagent.</em></>} description="Nous ne travaillons qu'avec des laboratoires dont nous connaissons les formules et les exigences." /><div className="rb-brand-list">{rows.map((b, i) => <Link href={`/marque/${b.slug}`} key={b.id}><span>{String(i + 1).padStart(2, "0")}</span><strong>{b.name}</strong><small>{b.country ?? "International"}</small><b>↗</b></Link>)}</div></div></div>;
}

async function AuthRoute({ kind }: { kind: "login" | "register" | "forgot" }) {
  const title = kind === "login" ? <>Votre espace<br /><em>vous attend.</em></> : kind === "register" ? <>Bienvenue<br /><em>à la maison.</em></> : <>On vous<br /><em>renvoie la clé.</em></>;
  return <div className="rb-auth-page"><div className="rb-auth-mark"><span>C</span><p>Cléopâtre / espace privé</p></div><div className="rb-auth-card"><span className="rb-kicker">{kind === "login" ? "ENTRER" : kind === "register" ? "PREMIÈRE VISITE" : "ACCÈS"}</span><h1>{title}</h1><p className="rb-auth-note">{kind === "login" ? "Retrouvez vos commandes, vos favoris et vos routines." : kind === "register" ? "Un compte pour garder le fil de vos soins et de vos commandes." : "Indiquez votre e-mail et nous vous enverrons un lien valable une heure."}</p>{kind === "login" ? <LoginForm /> : kind === "register" ? <RegisterForm /> : <ForgotPasswordForm />}</div></div>;
}

async function DiagnosticRoute() {
  const [copy, user] = await Promise.all([getCopy(), getCurrentUser()]);
  return <div className="rb-diagnostic"><div className="rb-diagnostic-wrap"><RebuildRouteTitle index="01" eyebrow="PERSONNALISÉ" title={<>On commence<br /><em>par vous.</em></>} description="Cinq minutes de questions, une sélection commentée par nos pharmaciens." /><Diagnostic questions={copy.quiz.questions as unknown as { key: string; label: string; options: { v: string; l: string; d: string }[] }[]} isAuthed={!!user} /></div></div>;
}

async function CartRoute() {
  return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="VOTRE SÉLECTION" title={<>Le<br /><em>panier.</em></>} description="Les références que vous avez posées de côté, prêtes pour la suite." /><CartPage /></div></div>;
}

async function CheckoutRoute() {
  const user = await getCurrentUser();
  const [savedAddresses, storesRows] = await Promise.all([
    user ? db.select().from(addresses).where(eq(addresses.userId, user.id)) : Promise.resolve([]),
    db.select().from(stores).where(eq(stores.isActive, true)),
  ]);
  return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="PASSER COMMANDE" title={<>On vous<br /><em>accompagne.</em></>} description="Quelques informations, puis votre commande part du comptoir." /><CheckoutFlow user={user} savedAddresses={savedAddresses} stores={storesRows} methods={[...enabledPaymentMethods()]} /></div></div>;
}

async function ProductRoute({ slug }: { slug: string }) {
  const p = await getProductBySlug(slug); if (!p) return <Generic title="Référence introuvable." />;
  const related = await getRelated(p.id, p.categoryId, p.universeId, 4);
  return <>
    <div className="rb-product-page"><div className="rb-product-page-image">{p.image && <Image src={p.image} alt={p.name} fill priority sizes="(max-width: 800px) 100vw, 55vw" className="object-cover" />}<span>REF / {String(p.id).padStart(3, "0")}</span></div><div className="rb-product-page-copy"><Link href="/boutique" className="rb-back">← Retour au shop</Link><small>{p.brand?.name ?? "Cléopâtre"}</small><h1>{p.name}</h1><p className="rb-product-page-price">{new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3 }).format(p.priceMillimes / 1000)} DT</p><p className="rb-product-page-description">{p.shortDescription ?? p.description ?? "Une référence sélectionnée par nos pharmaciens."}</p><div className="rb-product-facts"><span>Authentique</span><span>Conseillé au comptoir</span><span>{p.volume ?? "Usage quotidien"}</span></div><RebuildBuy product={{ id: p.id, slug: p.slug, name: p.name, brandName: p.brand?.name ?? null, image: p.image, priceMillimes: p.priceMillimes, stock: p.stock, volume: p.volume }} /><Link href="/diagnostic" className="rb-text-link">Une question ? Parler à un pharmacien</Link></div></div>
    <section className="rb-product-notes"><div><span>01 / LA FORMULE</span><h2>Comprendre<br /><em>avant d'appliquer.</em></h2><p>{p.description ?? p.shortDescription ?? "Une référence choisie pour sa formule, son usage et la clarté du conseil qui l'accompagne."}</p></div><div><span>02 / LE CONSEIL</span><h2>Le bon geste<br /><em>au bon moment.</em></h2><p>La quantité et la fréquence dépendent de votre peau, de votre âge et de votre routine. Nos pharmaciens vous répondent avant l'achat.</p><Link href="/diagnostic" className="rb-text-link">Parler à un pharmacien <span>↗</span></Link></div><div><span>03 / LA SUITE</span><h2>Recevoir<br /><em>sans surprise.</em></h2><p>Livraison partout en Tunisie sous 24 à 72 heures, ou retrait en deux heures à nos comptoirs.</p><Link href="/livraison" className="rb-text-link">Voir la logistique <span>↗</span></Link></div></section>
    {related.length > 0 && <section className="rb-section rb-related-products"><div className="rb-section-heading"><div><span className="rb-kicker">À CÔTÉ DE CETTE RÉFÉRENCE</span><h2>Le même<br /><em>terrain.</em></h2></div><Link href="/boutique" className="rb-text-link">Voir tout le shop <span>↗</span></Link></div><RebuildProductGrid products={related} /></section>}
  </>;
}

async function StoresRoute() { const rows = await db.select().from(stores).where(eq(stores.isActive, true)); return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="LES COMPTOIRS" title={<>Venez nous<br /><em>rencontrer.</em></>} description="Deux adresses à Ezzahra et Hammam-Lif. Le même regard, en personne." /><div className="rb-stores">{rows.map((s, i) => <article key={s.id}><span>0{i + 1}</span><h2>{s.name}</h2><p>{s.address}<br />{s.city}</p><strong>{s.hours}</strong><a href={`tel:+216${s.phone}`}>{s.phone}</a><a className="rb-text-link" href={s.mapsUrl ?? "#"}>Voir sur la carte ↗</a></article>)}</div></div></div>; }

async function AccountRoute() { const user = await getCurrentUser(); if (!user) return <Generic title={<>Votre espace<br /><em>vous attend.</em></>} description="Connectez-vous pour retrouver vos commandes, favoris et routines." href="/connexion" />; return <div className="rb-route"><div className="rb-route-wrap"><RebuildRouteTitle index="01" eyebrow="VOTRE ESPACE" title={<>Bonjour,<br /><em>{user.firstName}.</em></>} description="Retrouvez ici les choses que vous voulez garder près de vous." /><div className="rb-account-grid"><Link href="/compte/commandes"><span>01</span><h2>Commandes</h2><p>Suivre vos livraisons et retrouver vos factures.</p>↗</Link><Link href="/compte/favoris"><span>02</span><h2>Favoris</h2><p>Les références que vous voulez garder.</p>↗</Link><Link href="/compte/profil"><span>03</span><h2>Profil</h2><p>Vos informations et vos adresses.</p>↗</Link></div></div></div>; }

async function ServiceRoute({ kind, compareIds = [] }: { kind: string; compareIds?: number[] }) {
  const content: Record<string, { eyebrow: string; title: ReactNode; intro: string }> = {
    aide: { eyebrow: "BESOIN D'AIDE", title: <>Une vraie personne<br /><em>vous répond.</em></>, intro: "Une question sur une formule, une commande ou votre peau ? Écrivez-nous, le comptoir vous répond sous 24 h ouvrées." },
    livraison: { eyebrow: "LOGISTIQUE", title: <>Votre commande<br /><em>en chemin.</em></>, intro: "Livraison standard 24–72 h partout en Tunisie, retrait en deux heures à Ezzahra et Hammam-Lif." },
    cgv: { eyebrow: "LE CADRE", title: <>Les règles<br /><em>du comptoir.</em></>, intro: "Les conditions qui encadrent une commande simple, claire et respectueuse." },
    confidentialite: { eyebrow: "VOS DONNÉES", title: <>Votre confiance<br /><em>reste à vous.</em></>, intro: "Nous ne vendons jamais vos données. Voici ce que nous gardons et pourquoi." },
    suivi: { eyebrow: "SUIVI", title: <>Où est votre<br /><em>commande ?</em></>, intro: "Entrez votre numéro de commande ou écrivez-nous si vous avez besoin d'un point précis." },
    comparer: { eyebrow: "COMPARER", title: <>Regarder<br /><em>deux fois.</em></>, intro: "Comparez les formules et choisissez avec un regard plus sûr." },
    liste: { eyebrow: "LISTE PARTAGÉE", title: <>Une sélection<br /><em>à partager.</em></>, intro: "Envoyez ou retrouvez une liste de références choisies." },
    besoin: { eyebrow: "BESOIN", title: <>Commencer par<br /><em>la vraie question.</em></>, intro: "Un besoin précis, une réponse plus juste." },
  };
  const c = content[kind] ?? content.aide;
  if (kind === "aide") return <div className="rb-service"><div className="rb-service-head"><span className="rb-kicker">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p></div><div className="rb-service-columns"><div className="rb-service-facts"><div><b>01</b><h2>Conseil produit</h2><p>Une formule, une texture ou une routine à comprendre ?</p></div><div><b>02</b><h2>Commande & livraison</h2><p>Nous retrouvons le fil de votre commande avec vous.</p></div><div><b>03</b><h2>Retour au comptoir</h2><p>Une réponse humaine, même quand la question est compliquée.</p></div></div><ContactForm /></div></div>;
  if (kind === "livraison") return <div className="rb-service"><div className="rb-service-head"><span className="rb-kicker">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p></div><div className="rb-service-cards"><div><b>24–72 h</b><h2>Partout en Tunisie</h2><p>Le livreur vous appelle avant son passage. Livraison offerte dès 99 DT.</p></div><div><b>2 h</b><h2>Click & Collect</h2><p>Retirez votre commande à Ezzahra ou Hammam-Lif dès qu'elle est prête.</p></div><div><b>0 surprise</b><h2>Suivi clair</h2><p>Le montant de la livraison est visible avant que vous confirmiez.</p></div></div><Button href="/boutique">Commencer une commande <ArrowRightIcon size={14} /></Button></div>;
  if (kind === "comparer" && compareIds.length) {
    const compared = await getCompareRows(compareIds.slice(0, 3));
    return <div className="rb-service rb-compare-page"><div className="rb-service-head"><span className="rb-kicker">COMPARER / {compared.length} RÉFÉRENCE{compared.length > 1 ? "S" : ""}</span><h1>Regarder<br /><em>deux fois.</em></h1><p>Les formules côte à côte, pour choisir avec un regard plus sûr et garder seulement ce qui vous correspond.</p></div>{compared.length > 0 ? <div className="rb-compare-table" role="table"><div className="rb-compare-table-head"><span>Référence</span><span>Prix</span><span>Format</span><span>Disponibilité</span></div>{compared.map(({ product, brandName }) => <div className="rb-compare-row" key={product.id}><div><small>{brandName ?? "Cléopâtre"}</small><strong>{product.name}</strong><p>{product.shortDescription ?? "Référence sélectionnée par nos pharmaciens."}</p></div><b>{new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 3 }).format(product.priceMillimes / 1000)} DT</b><span>{product.volume ?? "—"}</span><span className={product.stock > 0 ? "is-available" : "is-unavailable"}>{product.stock > 0 ? "En stock" : "Rupture"}</span></div>)}</div> : <div className="rb-compare-empty"><p>Les références comparées ne sont plus disponibles.</p><Button href="/boutique">Retourner au shop <ArrowRightIcon size={14} /></Button></div>}<div className="rb-service-callout"><div><span className="rb-kicker">LE CONSEIL RESTE HUMAIN</span><h2>Encore une hésitation<br /><em>sur votre peau ?</em></h2></div><Button href="/diagnostic">Faire le diagnostic <ArrowRightIcon size={14} /></Button></div></div>;
  }
  const serviceBlocks: Record<string, { label: string; title: string; copy: string }[]> = {
    cgv: [{ label: "01 / COMMANDER", title: "Un prix affiché, un prix confirmé.", copy: "Le panier récapitule les produits, les quantités, la livraison et le total avant la confirmation. Une commande n'est préparée qu'après validation." }, { label: "02 / RECEVOIR", title: "Le comptoir garde le fil.", copy: "Vous recevez les informations utiles par e-mail ou téléphone. En cas d'indisponibilité, nous vous contactons avant toute substitution." }, { label: "03 / RETOURNER", title: "Un délai simple à comprendre.", copy: "Un produit non ouvert peut faire l'objet d'une demande dans les 7 jours après réception, sous réserve de vérification par le comptoir." }],
    confidentialite: [{ label: "01 / CE QUE NOUS GARDONS", title: "Juste ce qui sert.", copy: "Nom, contact, adresse de livraison et historique de commande nous permettent de préparer et suivre votre achat." }, { label: "02 / CE QUE NOUS N'EN FAISONS PAS", title: "Jamais revendu.", copy: "Vos données ne sont ni vendues ni utilisées pour fabriquer un profil publicitaire. Elles restent liées à la relation Cléopâtre." }, { label: "03 / VOTRE MAIN", title: "Vous pouvez demander.", copy: "Pour corriger, récupérer ou supprimer vos informations, écrivez-nous. Le comptoir vous répondra directement." }],
    suivi: [{ label: "01 / CONFIRMÉE", title: "Votre commande est enregistrée.", copy: "Après paiement ou confirmation, l'équipe vérifie les références et prépare votre sélection." }, { label: "02 / EN PRÉPARATION", title: "Le comptoir la rassemble.", copy: "Nous contrôlons les produits, puis le livreur ou l'équipe du retrait prend le relais." }, { label: "03 / EN ROUTE", title: "Un appel avant le passage.", copy: "Le transporteur vous contacte avant la livraison. Pour un point précis, gardez votre numéro de commande près de vous." }],
    comparer: [{ label: "01 / REGARDER", title: "Deux formules face à face.", copy: "Ajoutez jusqu'à trois références au comparateur depuis les cartes produits pour lire les formats, prix et usages côte à côte." }, { label: "02 / COMPRENDRE", title: "Le prix ne dit pas tout.", copy: "Texture, volume, tolérance et geste comptent autant que la remise. Comparez pour choisir, pas pour empiler." }, { label: "03 / DÉCIDER", title: "Une question reste ouverte ?", copy: "Le diagnostic ou le comptoir peuvent reprendre la comparaison avec vous et remettre le conseil au centre." }],
    liste: [{ label: "01 / CHOISIR", title: "Gardez vos essentiels.", copy: "Un favori vous permet de retrouver une référence sans refaire toute la recherche, depuis votre espace personnel." }, { label: "02 / PARTAGER", title: "Une liste, pas un panier imposé.", copy: "Partagez une sélection à une personne proche : elle pourra la regarder tranquillement avant de décider." }, { label: "03 / REVENIR", title: "Le soin suit votre rythme.", copy: "Votre liste reste un point de départ. Les produits ne sont ajoutés au panier qu'au moment qui vous convient." }],
    besoin: [{ label: "01 / NOMMER", title: "Peau qui tire, cuir chevelu qui démange, sommeil fragile.", copy: "Un besoin concret vaut mieux qu'une longue liste de produits. Commencez par ce que vous ressentez." }, { label: "02 / ÉCLAIRCIR", title: "Le diagnostic pose les bonnes questions.", copy: "Cinq minutes pour préciser votre terrain, vos habitudes et ce que vous voulez éviter." }, { label: "03 / CHOISIR", title: "Une sélection commentée.", copy: "Vous repartez avec moins de références, mais une idée plus nette du pourquoi et du comment." }],
  };
  const blocks = serviceBlocks[kind] ?? serviceBlocks.cgv;
  const serviceHref = kind === "besoin" ? "/diagnostic" : kind === "liste" ? "/connexion" : kind === "comparer" ? "/boutique" : kind === "suivi" ? "/aide" : "/aide";
  return <div className="rb-service"><div className="rb-service-head"><span className="rb-kicker">{c.eyebrow}</span><h1>{c.title}</h1><p>{c.intro}</p></div><div className="rb-service-panels">{blocks.map((block) => <article key={block.label}><span>{block.label}</span><h2>{block.title}</h2><p>{block.copy}</p></article>)}</div><div className="rb-service-callout"><div><span className="rb-kicker">LE COMPTOIR RESTE OUVERT</span><h2>Besoin d'une réponse<br /><em>pour votre situation ?</em></h2></div><Button href={serviceHref}>Continuer <ArrowRightIcon size={14} /></Button></div></div>;
}

function Generic({ title, description = "Cette page est en préparation au comptoir.", href = "/boutique" }: { title: ReactNode; description?: string; href?: string }) { return <div className="rb-generic"><span className="rb-kicker">CLÉOPÂTRE / EN COURS</span><h1>{title}</h1><p>{description}</p><Button href={href}>Retourner au shop <ArrowRightIcon size={14} /></Button></div>; }

export default async function RebuiltCatchAll({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug = [] } = await params;
  const search = await searchParams;
  const query = typeof search.q === "string" ? search.q.trim() : undefined;
  const sort = typeof search.sort === "string" ? search.sort : undefined;
  const compareIds = typeof search.p === "string" ? search.p.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0) : [];
  const [first, second] = slug;
  if (!slug.length) return <Home />;
  if (["boutique", "recherche", "promotions", "univers"].includes(first)) return <CatalogRoute kind={first} value={second} query={query} sort={sort} />;
  if (first === "categorie" && second) return <CatalogRoute kind="univers" value={second} />;
  if (first === "journal") return <JournalRoute articleSlug={second} />;
  if (first === "marques" || first === "marque") return <BrandsRoute brandSlug={second} />;
  if (first === "boutiques") return <StoresRoute />;
  if (first === "produit" && second) return <ProductRoute slug={second} />;
  if (first === "compte") return <AccountRoute />;
  if (first === "connexion") return <AuthRoute kind="login" />;
  if (first === "inscription") return <AuthRoute kind="register" />;
  if (first === "mot-de-passe-oublie") return <AuthRoute kind="forgot" />;
  if (first === "panier") return <CartRoute />;
  if (first === "commande") return <CheckoutRoute />;
  if (first === "diagnostic") return <DiagnosticRoute />;
  if (["aide", "livraison", "cgv", "confidentialite", "suivi", "comparer", "liste", "besoin"].includes(first)) return <ServiceRoute kind={first} compareIds={compareIds} />;
  if (first === "reinitialiser-mot-de-passe") return <Generic title={<>Réinitialiser<br /><em>la clé.</em></>} href="/mot-de-passe-oublie" />;
  return <Generic title="Cette page n'existe pas." />;
}
