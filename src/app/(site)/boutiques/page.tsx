import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { ClockIcon, ExternalIcon, MapPinIcon, PhoneIcon, StoreIcon, TruckIcon } from "@/components/icons";
import { SITE_URL } from "@/lib/env";
import { jsonLd, safeHttpsUrl } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";

export const metadata: Metadata = {
  title: "Nos boutiques",
  description: "Parapharmacie Cléopâtre à Ezzahra et Hammam-Lif : adresses, horaires, téléphone, retrait de commande.",
  alternates: { canonical: "/boutiques" },
};
export const dynamic = "force-dynamic";

/**
 * THE TWO ADDRESSES.
 *
 * A visit is a physical thing, so this page opens on the room itself rather
 * than on a headline: a full-bleed photograph of the shop floor, with the two
 * addresses set over it as a directory. Everything practical follows.
 */
export default async function BoutiquesPage() {
  const list = await db.select().from(stores).where(eq(stores.isActive, true));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cléopâtre — Espace Santé Beauté",
    url: SITE_URL,
    location: list.map((s) => ({
      "@type": "Pharmacy",
      name: s.name,
      telephone: `+216${s.phone}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: s.address,
        addressLocality: s.city,
        addressCountry: "TN",
      },
      openingHours: s.hours,
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />

      {/* ── La salle d'accueil ─────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-noir text-paper">
        <Image
          src="/images/maison.jpg"
          alt="Intérieur de la parapharmacie Cléopâtre"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/70 to-noir/40" />
        <div aria-hidden className="grain absolute inset-0 opacity-40" />

        <div className="relative container-wide pb-14 pt-28 lg:pb-20 lg:pt-36">
          <MotifLayer motif="architecture" light={[18, 20]} />
          <p className="rule-label mb-7 text-champagne-3/80">La maison</p>
          <Reveal y={14} amount={0.1}>
            <h1 className="max-w-[24ch] font-display text-[clamp(2.3rem,5.2vw,4.2rem)] leading-[0.98] tracking-[-0.028em]">
              Venez rencontrer
              <span className="italic text-champagne-3"> vos pharmaciens.</span>
            </h1>
            <p className="mt-7 max-w-[42rem] text-[15px] leading-[1.85] text-paper/65">
              Deux adresses, une même équipe derrière le comptoir : analyse du besoin, choix des actifs, retrait de votre
              commande en ligne sous deux heures. Le conseil est gratuit et sans engagement.
            </p>
            <ul className="mt-9 flex flex-wrap gap-x-9 gap-y-3 border-t border-paper/12 pt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/55">
              <li className="flex items-center gap-2.5">
                <TruckIcon size={14} className="text-champagne-3" /> Expédition partout en Tunisie
              </li>
              <li className="flex items-center gap-2.5">
                <StoreIcon size={14} className="text-champagne-3" /> Retrait en 2 h
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Le répertoire ──────────────────────────────────────────── */}
      <section className="container-wide py-rhythm lg:py-rhythm-lg">
        <p className="rule-label mb-10">Le répertoire</p>
        <div className="grid gap-x-14 gap-y-14 lg:grid-cols-12">
          {list.map((s, i) => (
            <Reveal key={s.id} y={14} delay={i * 0.08} className="lg:col-span-6">
              <article className="flex h-full flex-col border-t border-ink pt-6">
                <div className="flex items-baseline gap-5">
                  <span className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] italic leading-none text-champagne-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-[clamp(1.4rem,2.4vw,1.9rem)] text-ink">
                    {s.name.replace("Cléopâtre ", "")}
                  </h2>
                </div>

                <dl className="mt-8 flex-1 space-y-6">
                  {[
                    { i: MapPinIcon, t: "Adresse", v: `${s.address}, ${s.city}` },
                    { i: ClockIcon, t: "Horaires", v: s.hours },
                  ].map((row) => (
                    <div key={row.t} className="grid grid-cols-[18px_1fr] gap-4 border-b border-stone/60 pb-5">
                      <row.i size={15} className="mt-0.5 text-champagne-2" />
                      <div>
                        <dt className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">{row.t}</dt>
                        <dd className="mt-1.5 text-[14px] leading-relaxed text-charcoal">{row.v}</dd>
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-[18px_1fr] gap-4">
                    <PhoneIcon size={15} className="mt-0.5 text-champagne-2" />
                    <div>
                      <dt className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">Téléphone</dt>
                      <dd className="mt-1.5">
                        <a
                          href={`tel:+216${s.phone}`}
                          className="link-underline font-display text-[20px] text-ink"
                        >
                          {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-9 flex flex-wrap gap-3">
                  <a href={`tel:+216${s.phone}`} className="btn-primary">
                    Appeler la boutique
                  </a>
                  <a
                    href={`https://wa.me/21671450210?text=${encodeURIComponent(`Bonjour, je souhaite un rendez-vous conseil à la boutique ${s.name}.\n\nJour envisagé : \nCréneau : \nMa question : `)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Rendez-vous conseil
                  </a>
                  {(() => {
                    const maps = safeHttpsUrl(s.mapsUrl);
                    return maps ? (
                      <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                        Itinéraire <ExternalIcon size={13} />
                      </a>
                    ) : null;
                  })()}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Les trois services ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-stone/70 bg-cream">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="marble-veil opacity-35" />
        </div>
        <div className="relative container-wide grid gap-px bg-stone-2/20 sm:grid-cols-3">
          {[
            { n: "01", t: "Conseil sans rendez-vous", d: "Un doute sur une routine ? L'analyse est gratuite et sans engagement — et si vous préférez un moment à deux, le rendez-vous se demande ici, en un message." },
            { n: "02", t: "Retrait en deux heures", d: "Commandez en ligne, choisissez « retrait en boutique » : c'est prêt sous 2 h." },
            { n: "03", t: "Expédition 24–72 h", d: "Nos boutiques préparent et expédient vos commandes partout en Tunisie." },
          ].map((x) => (
            <div key={x.n} className="bg-cream px-7 py-10 lg:px-9">
              <p className="font-display text-[clamp(1.5rem,2.4vw,2rem)] italic leading-none text-champagne-2">{x.n}</p>
              <h2 className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">{x.t}</h2>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="container-wide flex flex-col items-start gap-6 py-rhythm sm:flex-row lg:py-rhythm-lg sm:items-center sm:justify-between">
        <p className="max-w-md text-[13.5px] leading-relaxed text-muted">
          Une question avant de vous déplacer ? Nos équipes répondent au téléphone pendant les horaires d&apos;ouverture.
        </p>
        <Link href="/aide" className="btn-secondary">
          Aide &amp; FAQ
        </Link>
      </div>
    </div>
  );
}
