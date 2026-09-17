import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, MapPinIcon, PhoneIcon, StarIcon, ClockIcon, TagIcon } from "@/components/icons";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Rule } from "@/components/ui/primitives";
import { formatDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { ProductCard as PC } from "@/lib/catalog";

/* ══════════════════════════════════════════════════════════════════════════
   LES SECTIONS DE LA VITRINE
   ──────────────────────────────────────────────────────────────────────────
   The homepage is a sequence, and every section has one job:

     01 · LE COMPTOIR — what the pharmacists actually put forward this week.
     02 · LES OFFRES   — the promo codes that are live right now, in the DB.
     03 · LA PAROLE    — four measured figures and three real reviews.
     04 · LE JOURNAL   — the editorial voice, signed by its authors.
     05 · LE SEUIL     — where the house physically is, and how to reach it.

   Quiet, loud, quiet, quiet, loud. The contrast is the luxury: the film is
   allowed to be enormous precisely because these sections are exact.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── 01 · LE COMPTOIR ─────────────────────────────────────────────────────── */
export function Comptoir({ featured }: { featured: PC[] }) {
  const [lead, ...rest] = featured;
  if (!lead) return null;

  return (
    <section className="relative overflow-hidden bg-porcelain py-section-sm lg:py-section">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="light-field opacity-70" />
      </div>

      <div className="relative container-wide">
        <Reveal>
          <Rule index="01" label="Le comptoir" action={{ href: "/boutique", label: "Toute la boutique" }} />
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* The piece the pharmacists lead with. */}
          <div className="lg:col-span-5">
            <Reveal y={18}>
              <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.06] tracking-[-0.02em] text-ink">
                Ce que nos pharmaciennes mettent en avant <em className="italic text-cinabre">cette semaine</em>.
              </p>
              <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.7] text-graphite">
                Chaque référence est vérifiée — origine, tolérance, date. Aucun produit n&apos;entre ici sans qu&apos;un
                pharmacien l&apos;ait lu.
              </p>
            </Reveal>
            <div className="mt-10 max-w-sm">
              <EditorialProductCard p={lead} priority />
            </div>
          </div>

          {/* The shelf. */}
          <div className="lg:col-span-7">
            <Stagger step={0.06} className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:gap-x-6">
              {rest.slice(0, 6).map((p) => (
                <StaggerItem key={p.id}>
                  <EditorialProductCard p={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 02 · LES OFFRES ──────────────────────────────────────────────────────── */
export function Offres({
  products,
  promos,
}: {
  products: PC[];
  promos: { code: string; label: string }[];
}) {
  const best = products.reduce((max, p) => {
    if (!p.compareAtMillimes || p.compareAtMillimes <= p.priceMillimes) return max;
    return Math.max(max, Math.round(((p.compareAtMillimes - p.priceMillimes) / p.compareAtMillimes) * 100));
  }, 0);

  return (
    <section className="relative overflow-hidden bg-bone py-section-sm lg:py-section">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgba(17,17,19,0.05)_0_1px,transparent_1px_16.6666%)]"
      />
      <div className="relative container-wide">
        <Reveal>
          <Rule index="02" label="Les offres" action={{ href: "/promotions", label: "Toutes les offres" }} />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Reveal y={18}>
              <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] tracking-[-0.03em] text-ink">
                {best > 0 ? (
                  <>
                    Jusqu&apos;à <span className="num text-cinabre">−{best}%</span>
                  </>
                ) : (
                  "Les offres du moment"
                )}
              </h2>
              <p className="mt-5 max-w-sm text-[0.9375rem] leading-[1.7] text-graphite">
                Des remises réelles, sur des références qui restent authentiques. Les codes se cumulent avec la livraison
                offerte.
              </p>
            </Reveal>

            {promos.length > 0 && (
              <Stagger step={0.07} className="mt-9 space-y-3">
                {promos.map((p) => (
                  <StaggerItem key={p.code}>
                    <div className="flex items-center gap-4 border border-rule-strong bg-alabaster px-4 py-3">
                      <TagIcon size={15} className="shrink-0 text-cinabre" />
                      <span className="num text-[0.8125rem] tracking-[0.08em] text-ink">{p.code}</span>
                      <span className="flex-1 truncate text-[0.8125rem] text-graphite">{p.label}</span>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>

          <div className="lg:col-span-8">
            <Stagger step={0.05} className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:gap-x-6">
              {products.slice(0, 6).map((p) => (
                <StaggerItem key={p.id}>
                  <EditorialProductCard p={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 03 · LA PAROLE ───────────────────────────────────────────────────────── */
export function Parole({
  figures,
  reviews,
}: {
  figures: { value: string; label: string }[];
  reviews: { id: number; author: string; rating: number; title: string | null; body: string; productName: string; productSlug: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-porcelain py-section-sm lg:py-section">
      <div className="relative container-wide">
        <Reveal>
          <Rule index="03" label="La parole" />
        </Reveal>

        <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Stagger step={0.07} className="grid grid-cols-2 gap-x-8 gap-y-10">
              {figures.map((f) => (
                <StaggerItem key={f.label}>
                  <p className="num text-[clamp(1.9rem,3.6vw,3rem)] leading-none text-ink">{f.value}</p>
                  <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-graphite">{f.label}</p>
                  <span aria-hidden className="mt-4 block h-px w-8 bg-cinabre" />
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="lg:col-span-7">
            <Stagger step={0.08} className="space-y-px">
              {reviews.map((r) => (
                <StaggerItem key={r.id}>
                  <blockquote className="border-t border-rule py-7">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-0.5 text-cinabre" aria-label={`${r.rating} sur 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon key={i} size={12} filled={i < r.rating} />
                        ))}
                      </span>
                      <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash">{r.author}</span>
                    </div>
                    {r.title && (
                      <p className="mt-4 font-display text-[1.15rem] leading-snug text-ink">{r.title}</p>
                    )}
                    <p className="mt-3 max-w-2xl text-[0.9375rem] leading-[1.72] text-graphite">{r.body}</p>
                    <Link
                      href={`/produit/${r.productSlug}`}
                      className="mt-4 inline-flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash transition-colors hover:text-cinabre"
                    >
                      {r.productName} <ArrowRightIcon size={11} className="rtl:rotate-180" />
                    </Link>
                  </blockquote>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 04 · LE JOURNAL ──────────────────────────────────────────────────────── */
export function Journal({
  articles,
}: {
  articles: { slug: string; title: string; excerpt: string | null; image: string | null; tag: string | null; author: string | null; readMinutes: number; publishedAt: Date }[];
}) {
  const [lead, ...rest] = articles;
  if (!lead) return null;

  return (
    <section className="relative overflow-hidden bg-bone py-section-sm lg:py-section">
      <div className="relative container-wide">
        <Reveal>
          <Rule index="04" label="Le Journal" action={{ href: "/journal", label: "Tous les articles" }} />
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-7">
            <Link href={`/journal/${lead.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden bg-bone-2">
                {lead.image && (
                  <Image
                    src={lead.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-[1100ms] ease-[var(--ease-luxe)] group-hover:scale-[1.035]"
                  />
                )}
                {lead.tag && (
                  <span className="absolute start-3 top-3 border border-rule-strong bg-alabaster/85 px-2 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink backdrop-blur-md">
                    {lead.tag}
                  </span>
                )}
              </div>
              <h3 className="mt-6 max-w-xl font-display text-[clamp(1.5rem,2.8vw,2.2rem)] leading-tight text-ink transition-colors group-hover:text-cinabre">
                {lead.title}
              </h3>
              {lead.excerpt && <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.7] text-graphite">{lead.excerpt}</p>}
              <p className="mt-5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ash">
                {lead.author ?? "La maison"} · {lead.readMinutes} min · {formatDate(lead.publishedAt)}
              </p>
            </Link>
          </Reveal>

          <Stagger step={0.08} className="lg:col-span-5">
            {rest.slice(0, 3).map((a) => (
              <StaggerItem key={a.slug}>
                <Link href={`/journal/${a.slug}`} className="group flex gap-5 border-t border-rule py-6 first:border-t-0 first:pt-0">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-bone-2 sm:h-28 sm:w-28">
                    {a.image && <Image src={a.image} alt="" fill sizes="112px" className="object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ash">
                      {a.tag ?? "Journal"} · {a.readMinutes} min
                    </p>
                    <h4 className="mt-2 font-display text-[1.05rem] leading-snug text-ink transition-colors group-hover:text-cinabre">
                      {a.title}
                    </h4>
                    {a.excerpt && <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-graphite">{a.excerpt}</p>}
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ── 05 · LE SEUIL ────────────────────────────────────────────────────────── */
export function Seuil({
  stores,
}: {
  stores: { id: number; name: string; address: string; city: string; phone: string; hours: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-obsidian py-section-sm text-alabaster lg:py-section">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="night-field opacity-80" />
        <div className="absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgba(244,243,240,0.05)_0_1px,transparent_1px_12.5%)]" />
      </div>

      <div className="relative container-wide grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-cinabre-3">05 — Le seuil</p>
            <h2 className="mt-6 font-display text-[clamp(2.1rem,4.8vw,3.8rem)] leading-[0.96] tracking-[-0.03em] text-alabaster">
              La maison a <em className="italic text-cinabre-3">deux adresses</em>.
            </h2>
            <p className="mt-5 max-w-md text-[0.9375rem] leading-[1.72] text-alabaster/65">
              Passez au comptoir : conseil sur place, tests de tolérance, et la même sélection que dans la boutique en
              ligne.
            </p>
            <Link href="/boutiques" className="btn-pale mt-8">
              Voir les boutiques <ArrowRightIcon size={13} className="rtl:rotate-180" />
            </Link>
          </Reveal>
        </div>

        <Stagger step={0.09} className="grid gap-px sm:grid-cols-2 lg:col-span-7">
          {stores.map((s) => (
            <StaggerItem key={s.id}>
              <div className="flex h-full flex-col border border-film-line p-6">
                <p className="font-display text-[1.3rem] text-alabaster">{s.name}</p>
                <p className="mt-4 flex items-start gap-2.5 text-[0.875rem] text-alabaster/65">
                  <MapPinIcon size={14} className="mt-1 shrink-0 text-cinabre-3" />
                  {s.address}, {s.city}
                </p>
                <p className="mt-3 flex items-center gap-2.5 text-[0.875rem] text-alabaster/65">
                  <ClockIcon size={14} className="shrink-0 text-cinabre-3" /> {s.hours}
                </p>
                <a
                  href={`tel:+216${s.phone}`}
                  className="mt-3 flex items-center gap-2.5 font-mono text-[0.8125rem] text-alabaster transition-colors hover:text-cinabre-3"
                >
                  <PhoneIcon size={14} className="shrink-0" /> {s.phone}
                </a>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/** A quoted price, set the way the house sets money. */
export function PriceLine({ millimes, compareAt }: { millimes: number; compareAt?: number | null }) {
  return (
    <span className="num text-[0.9375rem] text-ink">
      {formatDT(millimes)}
      {compareAt && compareAt > millimes ? (
        <span className="ms-2 text-[0.75rem] text-faint line-through">{formatDT(compareAt)}</span>
      ) : null}
    </span>
  );
}

export function Band({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
