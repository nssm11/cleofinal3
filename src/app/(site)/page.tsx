import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, promotions, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured, getNewArrivals, getPromoProducts, getUniverses, getConcerns } from "@/lib/catalog";
import { getShelfForToday } from "@/lib/merch";
import { getCopy } from "@/lib/i18n/server";
import { ProductCard } from "@/components/catalog/product-card";
import { ArrowRightIcon, ChatIcon, MapPinIcon, PhoneIcon, SparkIcon } from "@/components/icons";
import { Reveal, Curtain, MaskLine } from "@/components/motion/reveal";
import { SelectionCarousel } from "@/components/catalog/selection-carousel";
import { SectionHeading } from "@/components/ui/primitives";
import { Hero } from "@/components/shell/hero";
import { UniversesCollage } from "@/components/shell/universes-collage";
import { formatDTShort } from "@/lib/money";
import { formatDate } from "@/lib/utils";

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

  const [lead, ...rest] = posts;
  const activePromos = promoRows.filter((p) => !p.endsAt || p.endsAt > new Date()).slice(0, 3);
  const hero = featured[0] ?? null;

  return (
    <>
      {/* ══ 01 · LA VITRINE ═══════════════════════════════════════════ */}
      <Hero
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

      {/* ══ 02 · LE PROPOS ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-stone/70 bg-cream">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-45" />
          <div className="grain absolute inset-0" />
        </div>
        <div className="relative container-wide grid gap-12 py-rhythm lg:grid-cols-12 lg:gap-16 lg:py-rhythm-lg">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="rule-label mb-6">{t.proposEyebrow}</p>
              <p className="font-display text-[clamp(1.8rem,3.4vw,2.8rem)] italic leading-[1.12] tracking-[-0.02em] text-ink">
                <MaskLine immediate={false}>{t.proposLine1}</MaskLine>
                <MaskLine immediate={false} delay={0.08}>
                  {t.proposLine2}
                </MaskLine>
                <MaskLine immediate={false} delay={0.16} className="text-champagne-2">
                  {t.proposLine3}
                </MaskLine>
              </p>
              <p className="mt-6 max-w-md text-[15px] leading-[1.85] text-muted">{t.proposText}</p>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ul className="border-t border-stone/70">
              {t.promises.map((x, i) => (
                <Reveal key={x.n} as="li" y={12} delay={i * 0.06} className="border-b border-stone/70">
                  <div className="group grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-1.5 py-5">
                    <span className="font-display text-[13px] italic text-champagne-2">{x.n}</span>
                    <div>
                      <p className="font-display text-[19px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                        {x.t}
                      </p>
                      <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-muted">{x.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ 03 · LES SEPT RAYONS — a tight gallery wall ═══════════════ */}
      <section className="relative container-wide py-rhythm lg:py-rhythm-lg">
        <Reveal>
          <SectionHeading
            index={t.rayonsIndex}
            eyebrow={t.rayonsEyebrow}
            title={t.rayonsTitle}
            description={t.rayonsDesc}
            action={{ href: "/boutique", label: t.rayonsCta }}
          />
        </Reveal>
        <div className="mt-8 lg:mt-10">
          <UniversesCollage
            universes={universes.map((u) => ({
              id: u.id,
              slug: u.slug,
              name: u.name,
              description: u.description,
              image: u.image,
              childCount: u.children.length || 1,
            }))}
          />
        </div>
      </section>

      {/* ══ 04 · LE COMPTOIR EN LIGNE — the four services ═════════════ */}
      <section className="relative overflow-hidden border-y border-stone/70 bg-paper-2/30">
        <div className="relative container-wide py-band lg:py-rhythm">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <Reveal>
                <p className="rule-label mb-5">{t.conciergeIndex}</p>
                <h2 className="font-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.05] tracking-[-0.02em] text-ink">
                  {t.conciergeTitle1}
                  <br />
                  <span className="italic text-champagne-2">{t.conciergeTitle2}</span>
                </h2>
                <p className="mt-5 max-w-sm text-[14.5px] leading-[1.8] text-muted">{t.conciergeText}</p>
              </Reveal>
            </div>
            <ul className="grid gap-px border border-stone-2/25 bg-stone-2/25 sm:grid-cols-2 lg:col-span-8">
              {t.conciergeItems.map((x, i) => (
                <Reveal key={x.href} as="li" y={10} delay={i * 0.05}>
                  <Link
                    href={x.href}
                    className="group relative flex h-full min-h-[118px] flex-col justify-between overflow-hidden bg-paper px-5 py-4 transition-colors duration-500 hover:bg-cream"
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="min-w-0 font-display text-[18px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                        {x.t}
                      </span>
                      <SparkIcon size={15} className="mt-0.5 shrink-0 text-champagne-2/70 transition-colors group-hover:text-champagne-2" />
                    </span>
                    <span className="mt-3 flex items-end justify-between gap-4">
                      <span className="text-[12.5px] leading-relaxed text-muted">{x.d}</span>
                      <span className="flex shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal">
                        {x.cta}
                        <ArrowRightIcon size={12} className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror" />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ 05 · LA SÉLECTION ═════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-stone/70">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-35" />
        </div>
        <div className="relative container-wide py-rhythm lg:py-rhythm-lg">
          <Reveal>
            <SectionHeading
              index={t.selectionIndex}
              eyebrow={t.selectionEyebrow}
              title={t.selectionTitle}
              description={t.selectionDesc}
              action={{ href: "/boutique?sort=bestsellers", label: t.selectionCta }}
            />
          </Reveal>
          <div className="mt-9 lg:mt-11">
            <SelectionCarousel items={featured} isAuthed={!!user} />
          </div>
          <Reveal className="mt-10 flex justify-center lg:mt-12">
            <Link href="/boutique" className="btn-secondary">
              {t.selectionBrowse} <ArrowRightIcon size={13} className="rtl-mirror" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ 06 · LA VITRINE DE SAISON — dated by the calendar, not by hand ═ */}
      {shelf && (
        <section className="relative overflow-hidden border-b border-stone/70 bg-paper" aria-label={shelf.title}>
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="marble-veil opacity-30" />
          </div>
          <div className="relative container-wide py-rhythm lg:py-rhythm-lg">
            <Reveal>
              <p className="eyebrow mb-3 flex items-center gap-3 text-champagne-2">
                <span aria-hidden className="h-px w-8 bg-champagne-3" />
                {mm.shelfEyebrow}
              </p>
              <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.02] tracking-[-0.025em] text-ink">{shelf.title}</h2>
              {shelf.subtitle && <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.85] text-muted">{shelf.subtitle}</p>}
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7">
              {shelf.items.slice(0, 4).map((sp2, i) => (
                <Reveal key={sp2.id} y={12} delay={i * 0.06}>
                  <ProductCard p={sp2} priority={i === 0} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 07 · LES ARRIVAGES — quatorze jours, pas un de plus ════════ */}
      {novelties.length > 0 && (
        <section className="container-wide py-rhythm lg:py-rhythm-lg" aria-label={mm.newTitle}>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <p className="eyebrow mb-3 text-muted-2">{mm.newEyebrow}</p>
                <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight tracking-[-0.022em] text-ink">{mm.newTitle}</h2>
                <p className="mt-3 max-w-[52ch] text-[13.5px] leading-relaxed text-muted">{mm.newDesc}</p>
              </div>
              <Link href="/boutique?sort=newest" className="btn-ghost">
                {copy.common.viewAll} <ArrowRightIcon size={13} className="rtl-mirror" />
              </Link>
            </div>
          </Reveal>
          <div className="scrollbar-none -mx-4 mt-9 flex snap-x gap-6 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-x-7 lg:overflow-visible lg:px-0">
            {novelties.map((np) => (
              <Link key={np.id} href={`/produit/${np.slug}`} className="w-[70vw] shrink-0 snap-start sm:w-[38vw] lg:w-auto">
                <ProductCard p={np} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══ 08 · LES OFFRES ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-noir text-paper">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-25" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "repeating-linear-gradient(to right, rgba(203,176,120,0.06) 0 1px, transparent 1px 25%)",
            }}
          />
          <div className="grain absolute inset-0" />
        </div>
        <div className="relative container-wide grid gap-12 py-rhythm lg:grid-cols-12 lg:gap-16 lg:py-section-sm">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="rule-label mb-6 text-champagne-3/80">{t.offersEyebrow}</p>
              <h2 className="font-display text-[clamp(1.9rem,3.8vw,3rem)] leading-[1.02] tracking-[-0.025em] text-paper">
                {t.offersTitle1}
                <br />
                <span className="italic text-champagne-3">{t.offersTitle2}</span>
              </h2>
              <p className="mt-6 max-w-sm text-[14.5px] leading-[1.85] text-paper/60">{t.offersText}</p>

              <ul className="mt-9 border-t border-paper/12">
                {activePromos.map((p) => (
                  <li key={p.id} className="border-b border-paper/12">
                    <Link href="/promotions" className="group flex items-baseline justify-between gap-5 py-4">
                      <span className="min-w-0">
                        <code className="block font-display text-[21px] tracking-[0.04em] text-champagne-3 transition-colors group-hover:text-paper">
                          {p.code}
                        </code>
                        <span className="mt-1 block text-[12.5px] text-paper/55">{p.label}</span>
                      </span>
                      {p.minSubtotalMillimes > 0 && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/40">
                          {t.offersFrom} {formatDTShort(p.minSubtotalMillimes)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/promotions" className="btn-light mt-8">
                {t.offersCta} <ArrowRightIcon size={13} className="rtl-mirror" />
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-4 lg:gap-6">
              {promos.map((p, i) => (
                <Curtain
                  key={p.id}
                  delay={i * 0.07}
                  from={i % 2 === 0 ? "bottom" : "left"}
                  className={i === 0 ? "col-span-2" : ""}
                >
                  <Link href={`/produit/${p.slug}`} className="group block">
                    <div className={`relative overflow-hidden bg-noir-2 ${i === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
                      {p.image && (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes={i === 0 ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 50vw, 28vw"}
                          className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                        />
                      )}
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-noir/70 via-transparent to-transparent"
                      />
                      {p.compareAtMillimes && (
                        <span className="absolute left-3 top-3 bg-champagne-3 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-noir">
                          {t.offersBadge}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-paper/45">{p.brandName}</p>
                        <p className="mt-1.5 line-clamp-2 font-display text-[17px] leading-tight text-paper/90 transition-colors group-hover:text-champagne-3">
                          {p.name}
                        </p>
                      </div>
                      <p className="shrink-0 text-[14px] tabular-nums text-paper">
                        {formatDTShort(p.priceMillimes)}
                        {p.compareAtMillimes && (
                          <span className="ml-2 text-[11px] text-paper/40 line-through">
                            {formatDTShort(p.compareAtMillimes)}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                </Curtain>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 09 · PAR BESOIN ═══════════════════════════════════════════ */}
      <section className="relative container-wide py-band lg:py-rhythm-lg">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <p className="rule-label mb-5">{t.needsEyebrow}</p>
                <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.04] tracking-[-0.02em] text-ink">
                  {t.needsTitle1}
                  <br />
                  <span className="italic">{t.needsTitle2}</span>
                </h2>
                <p className="mt-5 max-w-sm text-[14.5px] leading-[1.85] text-muted">{t.needsText}</p>
                <Link href="/diagnostic" className="btn-ghost mt-7">
                  {t.needsCta} <ArrowRightIcon size={13} className="rtl-mirror" />
                </Link>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-stone/70">
              {concerns.map((c, i) => (
                <Reveal key={c.id} as="li" y={10} delay={i * 0.03} className="border-b border-stone/70">
                  <Link href={`/besoin/${c.slug}`} className="group relative flex items-center gap-6 overflow-hidden py-4">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 ltr:left-0 rtl:right-0 -z-10 w-full origin-left scale-x-0 bg-cream/80 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                    />
                    <span className="w-8 shrink-0 font-display text-[12px] italic text-champagne-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[clamp(1.2rem,2vw,1.6rem)] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                        {c.name}
                      </span>
                      <span className="mt-1 block line-clamp-1 text-[13px] text-muted">{c.intro}</span>
                    </span>
                    <ArrowRightIcon
                      size={16}
                      className="shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-ink rtl-mirror"
                    />
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ 10 · LE JOURNAL ═══════════════════════════════════════════ */}
      {lead && (
        <section className="relative overflow-hidden border-y border-stone/70 bg-cream">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="marble-veil opacity-40" />
          </div>
          <div className="relative container-wide py-rhythm lg:py-rhythm-lg">
            <Reveal>
              <SectionHeading index={t.journalIndex} eyebrow={t.journalEyebrow} title={t.journalTitle} action={{ href: "/journal", label: t.journalCta }} />
            </Reveal>

            <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-14">
              <Curtain className="lg:col-span-7" from="bottom">
                <Link href={`/journal/${lead.slug}`} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-marble">
                    {lead.image && (
                      <Image
                        src={lead.image}
                        alt=""
                        fill
                        sizes="(max-width:1024px) 100vw, 56vw"
                        className="object-cover transition-transform duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]"
                      />
                    )}
                  </div>
                  <div className="mt-5 flex items-center gap-5">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-champagne-2">{lead.tag}</span>
                    <span className="h-px flex-1 bg-stone-2/40" aria-hidden />
                    <span className="text-[10.5px] text-muted-2">
                      {lead.readMinutes} {copy.common.minutes} · {formatDate(lead.publishedAt)}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-[clamp(1.5rem,2.8vw,2.3rem)] leading-[1.06] tracking-[-0.02em] text-ink transition-colors duration-500 group-hover:text-champagne-2">
                    {lead.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-[14.5px] leading-[1.85] text-muted">{lead.excerpt}</p>
                </Link>
              </Curtain>

              <ul className="lg:col-span-5">
                {rest.map((a, i) => (
                  <Reveal key={a.id} as="li" y={14} delay={i * 0.07} className="border-t border-stone/70 first:border-t-0">
                    <Link href={`/journal/${a.slug}`} className="group flex gap-6 py-5">
                      <span className="relative h-[88px] w-[72px] shrink-0 overflow-hidden bg-marble">
                        {a.image && (
                          <Image
                            src={a.image}
                            alt=""
                            fill
                            sizes="72px"
                            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">
                          {a.tag} · {a.readMinutes} {copy.common.minutes}
                        </span>
                        <span className="mt-1.5 block font-display text-[18px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                          {a.title}
                        </span>
                        <span className="mt-1.5 block line-clamp-2 text-[13px] leading-relaxed text-muted">{a.excerpt}</span>
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ══ 11 · LES LABORATOIRES ═════════════════════════════════════ */}
      <section className="relative container-wide py-rhythm lg:py-rhythm-lg">
        <Reveal>
          <SectionHeading
            index={t.housesIndex}
            eyebrow={t.housesEyebrow}
            title={t.housesTitle}
            description={t.housesDesc}
            action={{ href: "/marques", label: t.housesCta }}
          />
        </Reveal>

        {/* A typographic wall: the names carry the section, not the boxes. */}
        <Reveal className="mt-10 lg:mt-14" y={16}>
          <ul className="flex flex-wrap items-baseline gap-x-10 gap-y-5 lg:gap-x-16 lg:gap-y-7">
            {brandRows.map((b, i) => (
              <li key={b.id}>
                <Link
                  href={`/marque/${b.slug}`}
                  className={`group inline-flex items-baseline gap-3 transition-colors duration-500 ${
                    i % 5 === 0
                      ? "font-display text-[clamp(1.7rem,3.4vw,2.8rem)] text-ink"
                      : "font-display text-[clamp(1.15rem,1.9vw,1.6rem)] text-charcoal"
                  }`}
                >
                  <span className="relative">
                    {b.name}
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 ltr:left-0 rtl:right-0 h-px w-full origin-right scale-x-0 bg-champagne-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100"
                    />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-2">{b.country}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-10 grid gap-8 border-t border-stone/70 pt-8 lg:grid-cols-3">
          {brandRows.slice(0, 3).map((b, i) => (
            <Reveal key={b.id} delay={i * 0.08} y={14}>
              <Link href={`/marque/${b.slug}`} className="group block">
                <p className="font-display text-[20px] text-ink transition-colors group-hover:text-champagne-2">{b.name}</p>
                <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{b.story}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ 10 · LA MAISON ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-stone/70 bg-paper-2/50">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-40" />
          <div className="grain absolute inset-0" />
        </div>
        <div className="relative container-wide grid items-center gap-12 py-rhythm lg:grid-cols-12 lg:gap-16 lg:py-rhythm-lg">
          <Reveal className="relative order-2 lg:order-1 lg:col-span-6" y={20}>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-marble lg:aspect-[5/4]">
              <Image
                src="/images/maison.jpg"
                alt="La maison Cléopâtre, à Ezzahra"
                fill
                sizes="(max-width:1024px) 100vw, 48vw"
                className="object-cover"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" />
            </div>
            <div className="absolute -bottom-5 ltr:left-5 rtl:right-5 hidden border border-stone-2/40 bg-cream px-5 py-4 shadow-soft backdrop-blur-xl sm:block">
              <p className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.22em] text-champagne-2">
                <MapPinIcon size={12} /> {t.maisonLocal}
              </p>
              <p className="mt-1.5 text-[13.5px] text-charcoal">Ezzahra · Hammam-Lif</p>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2 lg:col-span-6">
            <Reveal>
              <p className="rule-label mb-5">{t.maisonIndex}</p>
              <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.03] tracking-[-0.022em] text-ink">
                {t.maisonTitle1}
                <br />
                <span className="italic">{t.maisonTitle2}</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-[1.85] text-muted">{t.maisonText}</p>

              <ul className="mt-8 border-t border-stone/70">
                {storeRows.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-stone/70 py-4">
                    <div className="min-w-0">
                      <p className="font-display text-[19px] text-ink">{s.name}</p>
                      <p className="mt-1 text-[12.5px] text-muted">
                        {s.address} · {s.hours}
                      </p>
                    </div>
                    <a href={`tel:+216${s.phone}`} className="btn-secondary min-h-11 px-5">
                      <PhoneIcon size={13} /> {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/boutiques" className="btn-secondary">
                  {t.maisonHoursCta}
                </Link>
                <Link href="/aide" className="btn-ghost">
                  <ChatIcon size={14} /> {t.maisonQuestion}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
