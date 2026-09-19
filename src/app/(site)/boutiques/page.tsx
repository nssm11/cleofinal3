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
import { CounterClock } from "@/components/kit/counter-clock";
import { SPECIAL_DAYS, hoursForDate } from "@/lib/open-hours";

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
      <section className="relative isolate overflow-hidden bg-petrol text-canvas">
        <Image
          src="/images/maison.jpg"
          alt="Intérieur de la parapharmacie Cléopâtre"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden className="cine-scrim-band absolute inset-x-0 bottom-0 h-[42%]" />

        <div className="cine-type relative shell-wide pb-14 pt-28 lg:pb-20 lg:pt-36">
          <MotifLayer motif="architecture" mark={[18, 20]} />
          <p className="kicker mb-7 text-iodine/80">La maison</p>
          <Reveal y={14} amount={0.1}>
            <h1 className="max-w-[24ch] font-ant uppercase text-[clamp(2.3rem,5.2vw,4.2rem)] leading-[0.98] tracking-[-0.028em]">
              Venez rencontrer
              <span className="text-iodine"> vos pharmaciens.</span>
            </h1>
            <p className="mt-7 max-w-[42rem] text-[15px] leading-[1.85] text-canvas/90">
              Deux adresses, une même équipe derrière le comptoir : analyse du besoin, choix des actifs, retrait de votre
              commande en ligne sous deux heures. Le conseil est gratuit et sans engagement.
            </p>
            <ul className="mt-9 flex flex-wrap gap-x-9 gap-y-3 border-t border-canvas/25 pt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-canvas/75">
              <li className="flex items-center gap-2.5">
                <TruckIcon size={14} className="text-iodine" /> Expédition partout en Tunisie
              </li>
              <li className="flex items-center gap-2.5">
                <StoreIcon size={14} className="text-iodine" /> Retrait en 2 h
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Le répertoire ──────────────────────────────────────────── */}
      <section className="shell-wide py-block lg:py-block-lg">
        <p className="kicker mb-10">Le répertoire</p>
        <div className="grid gap-x-14 gap-y-14 lg:grid-cols-12">
          {list.map((s, i) => (
            <Reveal key={s.id} y={14} delay={i * 0.08} className="lg:col-span-6">
              <article className="flex h-full flex-col border-t border-carbon pt-6">
                <div className="flex items-baseline gap-5">
                  <span className="font-ant uppercase text-[clamp(1.6rem,2.6vw,2.2rem)] leading-none text-iodine-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-ant uppercase text-[clamp(1.4rem,2.4vw,1.9rem)] text-carbon">
                    {s.name.replace("Cléopâtre ", "")}
                  </h2>
                </div>

                <dl className="mt-8 flex-1 space-y-6">
                  {[
                    { i: MapPinIcon, t: "Adresse", v: `${s.address}, ${s.city}` },
                    { i: ClockIcon, t: "Horaires", v: s.hours },
                  ].map((row) => (
                    <div key={row.t} className="grid grid-cols-[18px_1fr] gap-4 border-b border-line/60 pb-5">
                      <row.i size={15} className="mt-0.5 text-iodine-deep" />
                      <div>
                        <dt className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-faint">{row.t}</dt>
                        <dd className="mt-1.5 text-[14px] leading-relaxed text-carbon">{row.v}</dd>
                        {/* Le jour du comptoir — computed from the visitor's
                            own watch, so the page can never claim the counter
                            is open when the street says it is shut. */}
                        {row.t === "Horaires" && (
                          <div className="mt-3">
                            <CounterClock hours={s.hours} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-[18px_1fr] gap-4">
                    <PhoneIcon size={15} className="mt-0.5 text-iodine-deep" />
                    <div>
                      <dt className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-faint">Téléphone</dt>
                      <dd className="mt-1.5">
                        <a
                          href={`tel:+216${s.phone}`}
                          className="link-underline font-ant uppercase text-[20px] text-carbon"
                        >
                          {s.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-9 flex flex-wrap gap-3">
                  <a href={`tel:+216${s.phone}`} className="btn-solid">
                    Appeler la boutique
                  </a>
                  <a
                    href={`https://wa.me/21671450210?text=${encodeURIComponent(`Bonjour, je souhaite un rendez-vous conseil à la boutique ${s.name}.\n\nJour envisagé : \nCréneau : \nMa question : `)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                  >
                    Rendez-vous conseil
                  </a>
                  {(() => {
                    const maps = safeHttpsUrl(s.mapsUrl);
                    return maps ? (
                      <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-outline">
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

      {/* ── Le calendrier des exceptions ────────────────────────────────
          Ramadan, fêtes, inventaire: the days the two counters do not keep
          their ordinary hours. Server-rendered, so a phone on a slow
          connection reads the same truth as a desktop. */}
      <section className="shell-wide py-16">
        <Reveal>
          <div className="flex items-baseline gap-5">
            <p className="kicker whitespace-nowrap">Les jours d&apos;exception</p>
            <div aria-hidden className="hairline flex-1" />
          </div>
        </Reveal>
        <ul className="mt-8 divide-y divide-line/70 border-y border-line/70">
          {SPECIAL_DAYS.map((d) => {
            const from = new Date(`${d.from}T00:00:00`);
            const to = new Date(`${d.to}T00:00:00`);
            const now = new Date();
            const inForce = now >= from && now <= to;
            const fmt = (x: Date) =>
              x.toLocaleDateString("fr-TN", { day: "numeric", month: "long" });
            return (
              <li key={`${d.from}-${d.label}`} className="grid gap-2 py-5 sm:grid-cols-12 sm:items-baseline sm:gap-6">
                <p className="font-ant uppercase text-[15px] text-carbon sm:col-span-3">{d.label}</p>
                <p className="kicker-xs text-faint sm:col-span-3">
                  {fmt(from)} → {fmt(to)}
                </p>
                <p className="text-[13.5px] leading-relaxed text-muted sm:col-span-5">
                  {d.hours ?? "Comptoirs fermés"}
                </p>
                <p className="sm:col-span-1 sm:text-end">
                  {inForce ? (
                    <span className="kicker-xs text-iodine-deep">en cours</span>
                  ) : (
                    <span className="kicker-xs text-faint">{to < now ? "passé" : "à venir"}</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 max-w-[62ch] text-[12.5px] leading-relaxed text-faint">
          Le reste de l&apos;année, chaque comptoir garde les horaires écrits plus haut. Le
          pharmacien prévient en vitrine huit jours avant tout changement.
        </p>
      </section>

      {/* ── Les trois services ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-line/70 bg-mist">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dispensary absolute inset-0 opacity-40" />
        </div>
        <div className="relative shell-wide grid gap-px bg-line-strong/20 sm:grid-cols-3">
          {[
            { n: "01", t: "Conseil sans rendez-vous", d: "Un doute sur une routine ? L'analyse est gratuite et sans engagement — et si vous préférez un moment à deux, le rendez-vous se demande ici, en un message." },
            { n: "02", t: "Retrait en deux heures", d: "Commandez en ligne, choisissez « retrait en boutique » : c'est prêt sous 2 h." },
            { n: "03", t: "Expédition 24–72 h", d: "Nos boutiques préparent et expédient vos commandes partout en Tunisie." },
          ].map((x) => (
            <div key={x.n} className="bg-mist px-7 py-10 lg:px-9">
              <p className="font-ant uppercase text-[clamp(1.5rem,2.4vw,2rem)] leading-none text-iodine-deep">{x.n}</p>
              <h2 className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-carbon">{x.t}</h2>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="shell-wide flex flex-col items-start gap-6 py-block sm:flex-row lg:py-block-lg sm:items-center sm:justify-between">
        <p className="max-w-md text-[13.5px] leading-relaxed text-muted">
          Une question avant de vous déplacer ? Nos équipes répondent au téléphone pendant les horaires d&apos;ouverture.
        </p>
        <Link href="/aide" className="btn-outline">
          Aide &amp; FAQ
        </Link>
      </div>
    </div>
  );
}
