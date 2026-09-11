import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, promotions, stores } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getFeatured, getPromoProducts, getUniverses, getConcerns } from "@/lib/catalog";
import { ArrowRightIcon, ChatIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
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

/** The house's four promises, stated as facts rather than as slogans. */
const PROMISES = [
  { n: "01", t: "Authenticité", d: "Approvisionnement direct auprès des laboratoires et des distributeurs officiels. Aucun circuit parallèle, jamais." },
  { n: "02", t: "Conseil de pharmacien", d: "Une équipe diplômée en boutique et au téléphone, du lundi au samedi, de 8 h 30 à 20 h 30." },
  { n: "03", t: "Livraison 24–72 h", d: "Partout en Tunisie, offerte dès 99 DT. Retrait en boutique sous deux heures à Ezzahra ou Hammam-Lif." },
  { n: "04", t: "Prix justes", d: "Nos remises portent sur des références réelles. Nous ne fabriquons pas de faux prix barrés." },
];

export default async function HomePage() {
  const [universes, featured, promos, brandRows, posts, storeRows, concerns, promoRows, user] = await Promise.all([
    getUniverses(),
    getFeatured(12),
    getPromoProducts(4),
    db.select().from(brands).where(eq(brands.isFeatured, true)).orderBy(desc(brands.isFeatured)).limit(8),
    db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(4),
    db.select().from(stores).where(eq(stores.isActive, true)),
    getConcerns(),
    db.select().from(promotions).where(eq(promotions.isActive, true)).limit(4),
    getCurrentUser(),
  ]);

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
        <div className="relative container-wide grid gap-14 py-section-sm lg:grid-cols-12 lg:gap-16 lg:py-section">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="rule-label mb-8">Le propos</p>
              <p className="font-display text-[clamp(1.9rem,3.6vw,3rem)] italic leading-[1.12] tracking-[-0.02em] text-ink">
                <MaskLine immediate={false}>Nous ne vendons pas</MaskLine>
                <MaskLine immediate={false} delay={0.08}>
                  des produits.
                </MaskLine>
                <MaskLine immediate={false} delay={0.16} className="text-champagne-2">
                  Nous conseillons des soins.
                </MaskLine>
              </p>
              <p className="mt-8 max-w-md text-[15px] leading-[1.85] text-muted">
                Quatre-vingts références suffisent lorsqu&apos;elles sont choisies avec exigence. Notre métier n&apos;est
                pas de remplir un rayon, mais de savoir ce qui vous convient — et de savoir vous le dire.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ul className="border-t border-stone/70">
              {PROMISES.map((x, i) => (
                <Reveal key={x.n} as="li" y={12} delay={i * 0.06} className="border-b border-stone/70">
                  <div className="group grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-1.5 py-6">
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

      {/* ══ 03 · LES SEPT RAYONS ══════════════════════════════════════ */}
      <section className="relative container-wide py-band lg:py-rhythm">
        <Reveal>
          <SectionHeading
            index="Les rayons"
            eyebrow="Sept univers, une exigence"
            title="Entrez par ce que vous cherchez"
            description="Chaque rayon est construit avec nos pharmaciens : classé par besoin réel, pas par argument marketing."
            action={{ href: "/boutique", label: "Toute la boutique" }}
          />
        </Reveal>
        <div className="mt-7 lg:mt-9">
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

      {/* ══ 04 · LA SÉLECTION ═════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-y border-stone/70 bg-paper-2/40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-35" />
        </div>
        <div className="relative container-wide py-section-sm lg:py-rhythm-lg">
          <Reveal>
            <SectionHeading
              index="La sélection"
              eyebrow="Ce que nous conseillons le plus"
              title="Les essentiels du comptoir"
              description="Les références que nos pharmaciens recommandent chaque jour — tolérance éprouvée, efficacité démontrée, prix tenu. Un nouveau groupe chaque minute."
              action={{ href: "/boutique?sort=bestsellers", label: "Meilleures ventes" }}
            />
          </Reveal>
          <div className="mt-9 lg:mt-11">
            <SelectionCarousel items={featured} isAuthed={!!user} />
          </div>
          <Reveal className="mt-10 flex justify-center lg:mt-12">
            <Link href="/boutique" className="btn-secondary">
              Parcourir les 80 références <ArrowRightIcon size={13} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ 05 · LES OFFRES ═══════════════════════════════════════════ */}
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
        <div className="relative container-wide grid gap-14 py-section-sm lg:grid-cols-12 lg:gap-16 lg:py-section">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="rule-label mb-8 text-champagne-3/80">Offres du moment</p>
              <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.025em] text-paper">
                Prix justes,
                <br />
                <span className="italic text-champagne-3">sans artifice.</span>
              </h2>
              <p className="mt-7 max-w-sm text-[14.5px] leading-[1.85] text-paper/60">
                Des remises réelles, portées par des codes transparents et valables sur des références que nous
                défendons toute l&apos;année.
              </p>

              <ul className="mt-11 border-t border-paper/12">
                {activePromos.map((p) => (
                  <li key={p.id} className="border-b border-paper/12">
                    <Link href="/promotions" className="group flex items-baseline justify-between gap-5 py-5">
                      <span className="min-w-0">
                        <code className="block font-display text-[22px] tracking-[0.04em] text-champagne-3 transition-colors group-hover:text-paper">
                          {p.code}
                        </code>
                        <span className="mt-1 block text-[12.5px] text-paper/55">{p.label}</span>
                      </span>
                      {p.minSubtotalMillimes > 0 && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/40">
                          dès {formatDTShort(p.minSubtotalMillimes)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/promotions" className="btn-light mt-10">
                Toutes les offres <ArrowRightIcon size={13} />
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-5 lg:gap-6">
              {promos.map((p, i) => (
                <Curtain
                  key={p.id}
                  delay={i * 0.07}
                  from={i % 2 === 0 ? "bottom" : "left"}
                  className={i === 0 ? "col-span-2" : ""}
                >
                  <Link href={`/produit/${p.slug}`} className="group block">
                    <div className={`relative overflow-hidden bg-noir-2 ${i === 0 ? "aspect-[16/9]" : "aspect-[4/5]"}`}>
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
                          Offre
                        </span>
                      )}
                    </div>
                    <div className="mt-3.5 flex items-end justify-between gap-4">
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

      {/* ══ 06 · PAR BESOIN ═══════════════════════════════════════════ */}
      <section className="relative container-wide py-section-sm lg:py-section">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <p className="rule-label mb-7">Par besoin</p>
                <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.04] tracking-[-0.02em] text-ink">
                  Que cherchez-vous
                  <br />
                  <span className="italic">vraiment&nbsp;?</span>
                </h2>
                <p className="mt-6 max-w-sm text-[14.5px] leading-[1.85] text-muted">
                  Peau sensible, taches, chute de cheveux, sommeil difficile… Entrez par votre préoccupation : nous
                  vous guidons vers ce qui y répond, sans jargon.
                </p>
                <Link href="/besoin/peau-sensible" className="btn-ghost mt-9">
                  Commencer par la peau sensible <ArrowRightIcon size={13} />
                </Link>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-stone/70">
              {concerns.map((c, i) => (
                <Reveal key={c.id} as="li" y={10} delay={i * 0.03} className="border-b border-stone/70">
                  <Link href={`/besoin/${c.slug}`} className="group relative flex items-center gap-6 overflow-hidden py-5">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 -z-10 w-full origin-left scale-x-0 bg-cream/80 transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                    />
                    <span className="w-8 shrink-0 font-display text-[12px] italic text-champagne-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[clamp(1.25rem,2.1vw,1.75rem)] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                        {c.name}
                      </span>
                      <span className="mt-1 block line-clamp-1 text-[13px] text-muted">{c.intro}</span>
                    </span>
                    <ArrowRightIcon
                      size={16}
                      className="shrink-0 text-sand-2 transition-all duration-500 group-hover:translate-x-1.5 group-hover:text-ink"
                    />
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══ 07 · LE JOURNAL ═══════════════════════════════════════════ */}
      {lead && (
        <section className="relative overflow-hidden border-y border-stone/70 bg-cream">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="marble-veil opacity-40" />
          </div>
          <div className="relative container-wide py-section-sm lg:py-section">
            <Reveal>
              <SectionHeading
                index="Le Journal"
                eyebrow="Comprendre avant d'acheter"
                title="Écrit par nos pharmaciens"
                action={{ href: "/journal", label: "Tous les articles" }}
              />
            </Reveal>

            <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-14">
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
                  <div className="mt-7 flex items-center gap-5">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-champagne-2">
                      {lead.tag}
                    </span>
                    <span className="h-px flex-1 bg-stone-2/40" aria-hidden />
                    <span className="text-[10.5px] text-muted-2">
                      {lead.readMinutes} min · {formatDate(lead.publishedAt)}
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.06] tracking-[-0.02em] text-ink transition-colors duration-500 group-hover:text-champagne-2">
                    {lead.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-[14.5px] leading-[1.85] text-muted">{lead.excerpt}</p>
                </Link>
              </Curtain>

              <ul className="lg:col-span-5">
                {rest.map((a, i) => (
                  <Reveal key={a.id} as="li" y={14} delay={i * 0.07} className="border-t border-stone/70 first:border-t-0">
                    <Link href={`/journal/${a.slug}`} className="group flex gap-6 py-7">
                      <span className="relative h-[104px] w-[84px] shrink-0 overflow-hidden bg-marble">
                        {a.image && (
                          <Image
                            src={a.image}
                            alt=""
                            fill
                            sizes="84px"
                            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">
                          {a.tag} · {a.readMinutes} min
                        </span>
                        <span className="mt-2 block font-display text-[19px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                          {a.title}
                        </span>
                        <span className="mt-2 block line-clamp-2 text-[13px] leading-relaxed text-muted">
                          {a.excerpt}
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ══ 08 · LES LABORATOIRES ═════════════════════════════════════ */}
      <section className="relative container-wide py-section-sm lg:py-section">
        <Reveal>
          <SectionHeading
            index="Les maisons"
            eyebrow="Nos laboratoires"
            title="Seize maisons, choisies une à une"
            description="Chacune a été retenue pour une raison que nous savons expliquer. Aucune n'achète sa place dans cette liste."
            action={{ href: "/marques", label: "Toutes les marques" }}
          />
        </Reveal>

        {/* A typographic wall: the names carry the section, not the boxes. */}
        <Reveal className="mt-14 lg:mt-20" y={16}>
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
                      className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-champagne-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100"
                    />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-2">{b.country}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-16 grid gap-8 border-t border-stone/70 pt-10 lg:grid-cols-3">
          {brandRows.slice(0, 3).map((b, i) => (
            <Reveal key={b.id} delay={i * 0.08} y={14}>
              <Link href={`/marque/${b.slug}`} className="group block">
                <p className="font-display text-[20px] text-ink transition-colors group-hover:text-champagne-2">
                  {b.name}
                </p>
                <p className="mt-3 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{b.story}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ 09 · LA MAISON ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-stone/70 bg-paper-2/50">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-40" />
          <div className="grain absolute inset-0" />
        </div>
        <div className="relative container-wide grid items-center gap-14 py-section-sm lg:grid-cols-12 lg:gap-16 lg:py-section">
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
            <div className="absolute -bottom-5 left-5 hidden border border-stone-2/40 bg-cream px-5 py-4 shadow-soft backdrop-blur-xl sm:block">
              <p className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.22em] text-champagne-2">
                <MapPinIcon size={12} /> Le Grand Tunis
              </p>
              <p className="mt-1.5 text-[13.5px] text-charcoal">Ezzahra · Hammam-Lif</p>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2 lg:col-span-6">
            <Reveal>
              <p className="rule-label mb-7">La maison</p>
              <h2 className="font-display text-[clamp(2rem,3.8vw,3rem)] leading-[1.03] tracking-[-0.022em] text-ink">
                Deux adresses,
                <br />
                <span className="italic">une exigence.</span>
              </h2>
              <p className="mt-7 max-w-lg text-[15px] leading-[1.85] text-muted">
                Depuis Ezzahra et Hammam-Lif, nos équipes reçoivent, conseillent et préparent vos commandes. Retrait
                sous deux heures, conseil en personne, ou livraison partout en Tunisie.
              </p>

              <ul className="mt-10 border-t border-stone/70">
                {storeRows.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-stone/70 py-5">
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

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/boutiques" className="btn-secondary">
                  Horaires &amp; itinéraires
                </Link>
                <Link href="/aide" className="btn-ghost">
                  <ChatIcon size={14} /> Une question&nbsp;? Aide &amp; FAQ
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
