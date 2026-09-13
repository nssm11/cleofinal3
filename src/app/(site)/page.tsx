import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, promotions, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured, getNewArrivals, getPromoProducts, getUniverses, getConcerns } from "@/lib/catalog";
import { getShelfForToday } from "@/lib/merch";
import { getCopy } from "@/lib/i18n/server";
import { HeroOuverture } from "@/components/home/hero-ouverture";
import { Manifesto } from "@/components/home/manifesto";
import { RayonsIndex } from "@/components/home/rayons-index";
import { Selection } from "@/components/home/selection";
import { Interlude } from "@/components/home/interlude";
import { Curation } from "@/components/home/curation";
import { Offres } from "@/components/home/offres";
import { Besoins } from "@/components/home/besoins";
import { JournalHome } from "@/components/home/journal-home";
import { Maisons } from "@/components/home/maisons";
import { ServicesBand } from "@/components/home/services-band";
import { MaisonClose } from "@/components/home/maison-close";

export const dynamic = "force-dynamic";

/**
 * The homepage deserves its own identity in search results — the inherited
 * default title is just the house name, which wastes the highest-traffic
 * snippet on the site.
 */
export const metadata: Metadata = {
  title: "Parapharmacie en ligne premium — livraison partout en Tunisie",
  description:
    "Dermo-cosmétique, solaire, cheveux, bébé et compléments alimentaires : des produits authentiques, conseillés par nos pharmaciens à Ezzahra et Hammam-Lif, livrés en 24–72 h partout en Tunisie.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cléopâtre — Parapharmacie en ligne premium en Tunisie",
    description:
      "Des soins authentiques, sélectionnés et conseillés par nos pharmaciens. Livraison 24–72 h partout en Tunisie, offerte dès 99 DT.",
    url: "/",
  },
};

/**
 * HM · ACTE III — the homepage as a beauty publication you can buy.
 *
 *   01 L'OUVERTURE   full-bleed cover, choreographed entrance, three doors
 *   02 LES RAYONS    split-screen index: seven names, one pinned plate
 *   03 LE PROPOS     manifesto inked by the scroll + ledger of promises
 *   04 L'ÉTALAGE     the season on one shelf — two tabs, one compact grid
 *   05 L'INTERLUDE   pinned breath — the statement arrives line by line
 *   06 LE PLATEAU    four borderless fiches at a time; the tray turns
 *   07 PAR BESOIN    pinned question + the honest index
 *   08 LES CHIFFRES  offers with no cards — hairline index, codes in a panel
 *   09 LE JOURNAL    the pharmacists' ink
 *   10 LES MAISONS   the laboratories, by name
 *   11 LE COMPTOIR   utility as a hairline ledger
 *   12 LA MAISON     closure — the real room, the two addresses
 *
 * Discovery before story, night as the climax: the narrative deliberately
 * breaks the old skeleton. Same business, same data, same catalogue
 * relations as ever — only the art direction is new. And there is
 * deliberately no green on this page: warm ivory, champagne, sand, braise.
 */
export default async function HomePage() {
  const [universes, featured, promos, brandRows, posts, storeRows, concerns, promoRows, user, copy, shelf, novelties] = await Promise.all([
    getUniverses(),
    getFeatured(12),
    getPromoProducts(4),
    db.select().from(brands).where(eq(brands.isFeatured, true)).orderBy(desc(brands.isFeatured)).limit(8),
    db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(4),
    db.select().from(stores).where(eq(stores.isActive, true)),
    getConcerns(),
    db.select().from(promotions).where(eq(promotions.isActive, true)).limit(4),
    getCurrentUser(),
    getCopy(),
    getShelfForToday(),
    getNewArrivals(8),
  ]);
  const t = copy.home;
  const mm = copy.merch;

  const activePromos = promoRows.filter((p) => !p.endsAt || p.endsAt > new Date()).slice(0, 3);
  const hero = featured[0] ?? null;
  const interludeShot = universes.find((u) => u.image) ?? null;

  return (
    <div className="hm-ground relative">
            {/* ══ 01 · L'OUVERTURE ════════════════════════════════════ */}
      <HeroOuverture
        hero={
          hero
            ? {
                slug: hero.slug,
                name: hero.name,
                brandName: hero.brandName,
                image: hero.image,
                priceMillimes: hero.priceMillimes,
                compareAtMillimes: hero.compareAtMillimes,
                volume: hero.volume,
              }
            : null
        }
        universes={universes.map((u) => ({ slug: u.slug, name: u.name }))}
      />

      
      {/* ══ 02 · LES SEPT RAYONS ════════════════════════════════ */}
      <RayonsIndex
        universes={universes.map((u) => ({
          id: u.id,
          slug: u.slug,
          name: u.name,
          description: u.description,
          image: u.image,
          childCount: u.children.length || 1,
        }))}
        copy={{
          index: t.rayonsIndex,
          eyebrow: t.rayonsEyebrow,
          title: t.rayonsTitle,
          description: t.rayonsDesc,
          action: { href: "/boutique", label: t.rayonsCta },
          categories: copy.common.categories,
          enter: copy.common.discover,
          swipeHint: t.rayonsSwipe,
        }}
      />

      
      {/* ══ 03 · LE PROPOS ══════════════════════════════════════ */}
      <Manifesto
        eyebrow={t.proposEyebrow}
        lines={[t.proposLine1, t.proposLine2]}
        accentLine={t.proposLine3}
        text={t.proposText}
        promises={t.promises}
      />

      
      {/* ══ 04 · L'ÉTALAGE ══════════════════════════════════════ */}
      <Curation
        shelf={shelf}
        novelties={novelties}
        isAuthed={!!user}
        copy={{
          shelfEyebrow: mm.shelfEyebrow,
          newEyebrow: mm.newEyebrow,
          newTitle: mm.newTitle,
          newDesc: mm.newDesc,
          viewAll: copy.common.viewAll,
          newestHref: "/boutique?sort=newest",
        }}
      />

      
      {/* ══ 05 · L'INTERLUDE ════════════════════════════════════ */}
      <Interlude
        statement={copy.footer.statement}
        image={interludeShot ? { src: interludeShot.image as string, alt: interludeShot.name } : undefined}
        cta={{ href: "/diagnostic", label: copy.hero.adviceCta }}
        caption={copy.hero.edition}
      />

      
      {/* ══ 06 · LE PLATEAU ═════════════════════════════════════ */}
      <Selection
        items={featured.slice(1)}
        isAuthed={!!user}
        copy={{
          index: t.selectionIndex,
          eyebrow: t.selectionEyebrow,
          title: t.selectionTitle,
          action: { href: "/boutique?sort=bestsellers", label: t.selectionCta },
          browse: t.selectionBrowse,
          prev: copy.common.previous,
          following: copy.common.following,
        }}
      />

      
      {/* ══ 07 · PAR BESOIN ═════════════════════════════════════ */}
      <Besoins
        concerns={concerns}
        copy={{
          eyebrow: t.needsEyebrow,
          title1: t.needsTitle1,
          title2: t.needsTitle2,
          text: t.needsText,
          cta: t.needsCta,
        }}
      />

      
      {/* ══ 08 · LES CHIFFRES ═══════════════════════════════════ */}
      <Offres
        promos={promos}
        codes={activePromos}
        copy={{
          eyebrow: t.offersEyebrow,
          title1: t.offersTitle1,
          title2: t.offersTitle2,
          text: t.offersText,
          from: t.offersFrom,
          cta: t.offersCta,
        }}
      />

      
      {/* ══ 09 · LE JOURNAL ═════════════════════════════════════ */}
      <JournalHome
        posts={posts}
        minutesLabel={copy.common.minutes}
        copy={{
          index: t.journalIndex,
          eyebrow: t.journalEyebrow,
          title: t.journalTitle,
          cta: t.journalCta,
        }}
      />

      
      {/* ══ 10 · LES MAISONS ════════════════════════════════════ */}
      <Maisons
        brands={brandRows}
        copy={{
          index: t.housesIndex,
          eyebrow: t.housesEyebrow,
          title: t.housesTitle,
          description: t.housesDesc,
          cta: t.housesCta,
        }}
      />

      
      {/* ══ 11 · LE COMPTOIR, EN LIGNE ══════════════════════════ */}
      <ServicesBand
        copy={{
          index: t.conciergeIndex,
          title1: t.conciergeTitle1,
          title2: t.conciergeTitle2,
          text: t.conciergeText,
          items: t.conciergeItems,
        }}
      />

      
      {/* ══ 12 · LA MAISON ══════════════════════════════════════ */}
      <MaisonClose
        stores={storeRows}
        copy={{
          index: t.maisonIndex,
          title1: t.maisonTitle1,
          title2: t.maisonTitle2,
          text: t.maisonText,
          local: t.maisonLocal,
          hoursCta: t.maisonHoursCta,
          question: t.maisonQuestion,
        }}
      />
    </div>
  );
}
