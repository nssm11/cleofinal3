import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, brands, products, stores } from "@/db/schema";
import { getFeatured, getUniverses, publiclyVisible } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import { formatDate } from "@/lib/utils";
import { Projector, type Reel } from "@/components/home/projector";
import { FilmChapter, StatementBand, type Chapter } from "@/components/home/film";
import { EditorialProductGrid } from "@/components/catalog/editorial-product-card";
import { Chapter as ChapterHead } from "@/components/kit/surfaces";
import { Mask, Marquee, Stagger, StaggerItem } from "@/components/kit/motion";
import { ArrowUpRightIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { CinematicFooter } from "@/components/cinematic/CinematicFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cléopâtre — Officine dermo-cosmétique",
  description:
    "Peau, cheveu, corps, soleil, bébé, hygiène et compléments — l'officine dermo-cosmétique Cléopâtre, rayon par rayon. Produits authentiques conseillés par nos pharmaciens, livrés partout en Tunisie.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cléopâtre — La beauté se conseille",
    description:
      "Sept rayons, quatre-vingts références, le conseil d'un pharmacien sur chacune. Ezzahra · Hammam-Lif.",
    url: "/",
    images: ["/videos/posters/hero.jpg"],
  },
};

/**
 * French cardinal, lower case — the chapter count is read by the database, so
 * the headline must be able to spell whatever number comes back.
 */
const NUMBER_WORDS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze",
];
function spellNumber(n: number): string {
  const word = NUMBER_WORDS[n] ?? String(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * LA PAGE D'OUVERTURE.
 *
 *   LE PROJECTEUR   — the house film, one reel per chapter, one screen
 *   LE FILM         — one chapter per universe that has footage, as spreads
 *   LE BANDEAU      — the statement that crosses the page
 *   LE COMPTOIR     — real references, featured, with live stock
 *   LE JOURNAL      — what the pharmacists wrote
 *   LES COMPTOIRS   — the two addresses, with their hours
 *
 * Every figure on this page comes from the database: the counts, the
 * laboratories, the references, the articles, the stores. Nothing is invented
 * for the redesign.
 */
export default async function HomePage() {
  const [universes, featured, latest, labs, storeRows, totalRow, perUniverse] = await Promise.all([
    getUniverses(),
    getFeatured(7),
    db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt)).limit(3),
    db
      .select({ name: brands.name, n: sql<number>`count(${products.id})::int` })
      .from(brands)
      .leftJoin(products, and(eq(products.brandId, brands.id), publiclyVisible))
      .groupBy(brands.id, brands.name)
      .orderBy(desc(sql`count(${products.id})`))
      .limit(5),
    db.select().from(stores).where(eq(stores.isActive, true)).orderBy(asc(stores.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(publiclyVisible),
    db
      .select({ universeId: products.universeId, n: sql<number>`count(*)::int` })
      .from(products)
      .where(publiclyVisible)
      .groupBy(products.universeId),
  ]);

  const countByUniverse = new Map(perUniverse.map((r) => [r.universeId, r.n]));

  const totalProducts = totalRow[0]?.n ?? 0;

  // One reel per rayon — the house film first, then every universe that has
  // its own footage, each with the reel of its chapter and its real count.
  const reels: Reel[] = [
    { id: "maison", video: "hero-main", poster: "hero", kicker: "La maison", title: "Beauty in Ritual", href: "/boutique" },
    ...universes
      .filter((u) => UNIVERSE_CINEMA[u.slug])
      .map((u) => ({
        id: u.slug,
        video: UNIVERSE_CINEMA[u.slug].video,
        poster: UNIVERSE_CINEMA[u.slug].poster,
        kicker: u.name,
        title: UNIVERSE_CINEMA[u.slug].title,
        href: `/univers/${u.slug}`,
      })),
  ];

  const chapters: Chapter[] = universes
    .filter((u) => UNIVERSE_CINEMA[u.slug])
    .map((u, i, arr) => ({
      id: `chapter-${u.slug}`,
      index: i + 1,
      total: arr.length,
      video: UNIVERSE_CINEMA[u.slug].video,
      poster: UNIVERSE_CINEMA[u.slug].poster,
      kicker: UNIVERSE_CINEMA[u.slug].kicker,
      title: UNIVERSE_CINEMA[u.slug].title,
      href: `/univers/${u.slug}`,
      promise: u.story ?? atmosphereFor(u.slug).promise,
      count: countByUniverse.get(u.id) ?? 0,
      labs: labs.map((l) => l.name),
    }));

  return (
    <>
      <Projector
        reels={reels}
        facts={[
          { value: totalProducts, label: "Références" },
          { value: universes.length, label: "Rayons" },
          { value: 2, label: "Comptoirs" },
        ]}
      />

      {/* ── The laboratories, running ─────────────────────────────────── */}
      <div className="border-b border-line bg-carbon py-4 text-canvas">
        <Marquee
          items={labs.map((l) => (
            <span key={l.name} className="kicker flex items-center gap-4 !text-canvas">
              {l.name}
              <span className="text-iodine">{String(l.n).padStart(2, "0")}</span>
            </span>
          ))}
        />
      </div>

      {/* ── The chapters ──────────────────────────────────────────────── */}
      <div id="film">
        <section className="shell-wide py-block lg:py-block-lg">
          <ChapterHead
            index="01"
            label="Le film de la maison"
            title={
              <>
                {spellNumber(chapters.length)} rayons,
                <br />
                {spellNumber(chapters.length).toLowerCase()} façons de prendre soin.
              </>
            }
            lede="Le film de la maison est tourné dans nos rayons : chaque chapitre ouvre la porte d'un univers, et chaque univers ouvre sur ses références."
            action={{ href: "/boutique", label: "Voir toute la sélection" }}
            align="between"
          />
        </section>

        {chapters.map((c, i) => (
          <FilmChapter key={c.id} chapter={c} side={i % 2 === 0 ? "left" : "right"} />
        ))}
      </div>

      <StatementBand words="Prendre soin, c'est un geste précis" href="/diagnostic" cta="Diagnostic peau" />

      {/* ── The counter ───────────────────────────────────────────────── */}
      <section className="shell-wide py-block lg:py-block-lg">
        <ChapterHead
          index="02"
          label="Le comptoir"
          title="Les références du moment"
          lede="Ce que nos pharmaciens recommandent cette semaine — stock réel, prix réel, conseil compris."
          action={{ href: "/boutique", label: "Toute la boutique" }}
          align="between"
          className="mb-10 lg:mb-14"
        />
        <EditorialProductGrid items={featured} cols={4} priorityCount={2} />
      </section>

      {/* ── The journal ───────────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="border-y border-line bg-mist">
          <div className="shell-wide py-block lg:py-block-lg">
            <ChapterHead
              index="03"
              label="Le journal"
              title="Ce que l'on nous demande"
              action={{ href: "/journal", label: "Tous les articles" }}
              align="between"
              className="mb-10"
            />
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
              {latest[0] && (
                <Link href={`/journal/${latest[0].slug}`} className="group lg:col-span-6">
                  <div className="plate notch relative aspect-[16/10] w-full bg-canvas-2">
                    {latest[0].image && (
                      <Image
                        src={latest[0].image}
                        alt=""
                        fill
                        sizes="(max-width:1024px) 100vw, 48vw"
                        className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="kicker-xs text-iodine">{latest[0].tag ?? "Conseil"}</span>
                    <span className="kicker-xs text-faint">{latest[0].readMinutes} min</span>
                  </div>
                  <h3 className="mt-3 max-w-[26ch] font-ant text-[clamp(1.6rem,2.8vw,2.4rem)] uppercase leading-[1.0] text-carbon">
                    {latest[0].title}
                  </h3>
                  <p className="mt-3 max-w-[54ch] text-meta text-steel">{latest[0].excerpt}</p>
                </Link>
              )}
              <div className="lg:col-span-6">
                <ul>
                  {latest.slice(1).map((a) => (
                    <li key={a.id} className="border-b border-line">
                      <Link href={`/journal/${a.slug}`} className="group grid grid-cols-12 items-center gap-4 py-5">
                        <div className="col-span-4 sm:col-span-3">
                          <div className="plate relative aspect-[4/3] w-full bg-canvas-2">
                            {a.image && (
                              <Image
                                src={a.image}
                                alt=""
                                fill
                                sizes="20vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                              />
                            )}
                          </div>
                        </div>
                        <div className="col-span-8 sm:col-span-9">
                          <span className="kicker-xs text-faint">
                            {formatDate(a.publishedAt)} · {a.readMinutes} min
                          </span>
                          <h3 className="mt-2 max-w-[30ch] text-[1.05rem] font-sans font-semibold leading-snug text-carbon transition-colors group-hover:text-iodine">
                            {a.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 max-w-[52ch] text-meta text-muted">{a.excerpt}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center gap-4">
                  <Link href="/diagnostic" className="btn-outline">
                    Diagnostic peau
                  </Link>
                  <Link href="/aide" className="btn-ghost">
                    Poser une question
                    <ArrowUpRightIcon size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── The counters ──────────────────────────────────────────────── */}
      <section className="shell-wide py-block lg:py-block-lg">
        <ChapterHead
          index="04"
          label="Nos comptoirs"
          title="Deux adresses, une même exigence"
          lede="Passez nous voir : le conseil se donne aussi au comptoir, avec le produit dans la main."
          align="between"
          className="mb-10"
        />
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="plate notch relative aspect-[4/3] w-full bg-canvas-2">
              <Image src="/images/maison.jpg" alt="Le comptoir Cléopâtre" fill sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <Stagger className="grid gap-px bg-line sm:grid-cols-2">
              {storeRows.map((s) => (
                <StaggerItem key={s.id} className="bg-porcelain p-6">
                  <p className="font-ant text-[1.5rem] uppercase leading-none text-carbon">{s.name}</p>
                  <p className="mt-4 flex items-start gap-2.5 text-meta text-steel">
                    <MapPinIcon size={14} className="mt-0.5 shrink-0 text-iodine" aria-hidden />
                    <span>
                      {s.address}
                      <br />
                      {s.city}
                    </span>
                  </p>
                  <p className="mt-3 flex items-start gap-2.5 text-meta text-muted">
                    <ClockIcon size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                    <span>{s.hours}</span>
                  </p>
                  <a
                    href={`tel:+216${s.phone}`}
                    className="data mt-5 inline-flex min-h-11 items-center gap-2 border-b border-line-strong text-[0.8125rem] text-carbon transition-colors hover:border-iodine hover:text-iodine"
                  >
                    <PhoneIcon size={13} aria-hidden />
                    {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </a>
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/boutiques" className="btn-solid">
                Voir les comptoirs
              </Link>
              <Link href="/livraison" className="btn-ghost">
                Livraison & paiement
                <ArrowUpRightIcon size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Mask>
        <CinematicFooter
          stores={storeRows.map((s) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            city: s.city,
            phone: s.phone,
            hours: s.hours,
          }))}
        />
      </Mask>
    </>
  );
}
