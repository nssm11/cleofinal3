import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { Kicker, Rule } from "@/components/kit/surfaces";
import { MotifLayer } from "@/components/shell/motif";
import { Reveal } from "@/components/motion/reveal";
import { SpeedProbe } from "@/components/home/speed-probe";
import { CheckIcon, ClockIcon, SparkIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Pourquoi ce site est rapide",
  description:
    "Mesuré sur votre appareil : temps de réponse, poids réel, nombre de requêtes. Les choix qui font qu'une page de parapharmacie s'ouvre vite, même sur une 3G tunisienne.",
  alternates: { canonical: "/rapidite" },
};
export const dynamic = "force-dynamic";

/**
 * POURQUOI CE SITE EST RAPIDE.
 *
 * A speed page is only worth writing if it can be caught out. This one
 * measures itself on the visitor's own device and prints whatever comes back —
 * and it states the two things a speed page usually hides: that most of the
 * JavaScript is the framework, not the shop, and that the films are heavy by
 * design and only load where a film actually plays.
 */

const CHOICES: { title: string; body: string }[] = [
  {
    title: "Les figures sont dessinées, pas téléchargées",
    body:
      "Le cadran des besoins, les barres des laboratoires, l'échelle des prix, le plan de la maison et la courbe du registre sont du SVG rendu sur le serveur. Aucune bibliothèque de graphiques : la décoration ne coûte pas un octet de JavaScript.",
  },
  {
    title: "Les motifs sont du CSS",
    body:
      "Traits, hachures, cotes et cercles de mesure sont écrits en CSS et en SVG. Rien n'est animé pour faire joli, et le grain de papier est une texture, pas une image.",
  },
  {
    title: "Les polices habitent ici",
    body:
      "Anton, Instrument Sans et JetBrains Mono sont auto-hébergées et découpées par next/font/local. Le premier dessin n'attend jamais un serveur tiers, et la mise en page ne se décale pas sous vos doigts.",
  },
  {
    title: "Aucun script tiers",
    body:
      "Pas de traceur, pas de régie, pas de carte venue d'ailleurs, pas de bandeau à cookies : la page ne charge que le sien. Vos données de navigation restent chez vous — et chez personne d'autre.",
  },
  {
    title: "Le serveur fait le travail",
    body:
      "Les pages sont rendues côté serveur avec les chiffres déjà dedans : le prix, le stock et le nombre de références arrivent écrits dans le HTML. Le navigateur n'a pas à deviner, puis à corriger.",
  },
  {
    title: "Les films restent à leur place",
    body:
      "Les reels de la maison pèsent entre 1,5 et 3,5 Mo et ne se téléchargent que là où le film se joue vraiment. Une fiche produit n'en voit jamais la couleur : la légèreté n'est pas un accident, c'est une consigne.",
  },
];

export default async function RapiditePage() {
  // The page times itself: one query, one clock. If the database is slow on
  // this visit, the page says so rather than printing a flattering average.
  //
  // A clock during render is impure by definition, and that is the point: the
  // figure must describe *this* request, not a constant baked at build time.
  // eslint-disable-next-line react-hooks/purity -- measuring the render is the feature
  const t0 = Date.now();
  const [count, latency] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(products),
    db.execute(sql`select 1`),
  ]);
  // eslint-disable-next-line react-hooks/purity -- see above
  const serverMs = Date.now() - t0;
  const references = count[0]?.n ?? 0;

  return (
    <div className="pb-24">
      <section className="relative isolate overflow-hidden border-b border-line/60 bg-mist/50">
        <MotifLayer motif="clarity" mark={[76, 12]} />
        <div className="shell-wide py-20 lg:py-28">
          <Reveal>
            <Kicker>Mesuré, pas promis</Kicker>
            <h1 className="mt-7 max-w-[26ch] font-ant uppercase text-[clamp(2.1rem,5.2vw,4rem)] font-light leading-[1.05] text-carbon">
              Pourquoi cette page
              <br />
              <span className="text-iodine-deep">s&apos;ouvre vite.</span>
            </h1>
          </Reveal>
          <Reveal y={14} delay={0.08}>
            <p className="mt-8 max-w-[58ch] text-[15px] leading-[1.85] text-muted">
              Une boutique en ligne se juge à la vitesse à laquelle elle rend le prix et le stock.
              Cette page ne raconte pas une performance : elle la mesure chez vous, à l&apos;instant,
              et elle imprime le résultat — même s&apos;il est mauvais.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── La mesure ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-petrol text-chalk">
        <div className="shell-wide py-16 lg:py-24">
          <Reveal>
            <p className="kicker mb-8 text-chalk-faint!">Chez vous, maintenant</p>
          </Reveal>
          <Reveal y={12} delay={0.06}>
            <SpeedProbe />
          </Reveal>
          <Reveal y={12} delay={0.1}>
            <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-night-line pt-8 sm:grid-cols-3">
              <div>
                <dt className="kicker-xs text-chalk-faint">Rendu serveur, cette visite</dt>
                <dd className="mt-2 font-ant text-[26px] text-chalk">
                  {serverMs.toFixed(0)} ms
                </dd>
              </div>
              <div>
                <dt className="kicker-xs text-chalk-faint">Références comptées</dt>
                <dd className="mt-2 font-ant text-[26px] text-chalk">{references}</dd>
              </div>
              <div>
                <dt className="kicker-xs text-chalk-faint">Aller-retour base</dt>
                <dd className="mt-2 font-ant text-[26px] text-chalk">
                  {latency ? "ok" : "indisponible"}
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── Les choix ─────────────────────────────────────────────────── */}
      <section className="shell-wide py-20">
        <Reveal>
          <div className="flex items-baseline gap-5">
            <p className="kicker whitespace-nowrap">Six choix qui se voient</p>
            <Rule className="flex-1" />
          </div>
        </Reveal>
        <ul className="mt-10 grid gap-x-10 gap-y-10 lg:grid-cols-2">
          {CHOICES.map((c, i) => (
            <li key={c.title}>
              <Reveal y={12} delay={Math.min(i, 5) * 0.05}>
                <div className="flex items-start gap-4 border-t border-line/70 pt-5">
                  <span aria-hidden className="mt-0.5 shrink-0 text-iodine-deep">
                    <CheckIcon size={14} strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="font-ant text-[17px] uppercase leading-tight text-carbon">
                      {c.title}
                    </p>
                    <p className="mt-2.5 max-w-[58ch] text-[13.5px] leading-[1.8] text-muted">
                      {c.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Les limites ───────────────────────────────────────────────── */}
      <section className="shell-wide pb-20">
        <Reveal>
          <div className="border border-line/70 bg-canvas p-8 lg:p-12">
            <div className="flex items-start gap-4">
              <span aria-hidden className="mt-0.5 shrink-0 text-iodine-deep">
                <SparkIcon size={16} strokeWidth={1.4} />
              </span>
              <div>
                <p className="kicker mb-4 text-carbon">Ce que nous ne prétendons pas</p>
                <div className="max-w-[68ch] space-y-3.5 text-[13.5px] leading-[1.85] text-muted">
                  <p>
                    L&apos;essentiel du JavaScript que vous recevez n&apos;est pas le nôtre : c&apos;est
                    le moteur de Next.js et de React, qui fait tourner le panier, la recherche, les
                    favoris et le suivi de commande. Nous le gardons parce qu&apos;il rend ces gestes
                    fiables — mais nous ne le comptons pas comme une prouesse.
                  </p>
                  <p>
                    La page d&apos;accueil est la plus lourde de la maison, parce qu&apos;elle ouvre
                    un film. Ailleurs, une fiche produit tient dans quelques dizaines de kilo-octets.
                    Un garde-fou automatique pèse chaque page à chaque construction et refuse de
                    publier au-delà du budget : la légèreté n&apos;est pas un discours, c&apos;est une
                    porte qui ferme.
                  </p>
                  <p>
                    Et si vos chiffres sont mauvais, ils sont vrais : réseau chargé, téléphone
                    ancien, mémoire pleine. Nous préférons les lire avec vous que les cacher derrière
                    une moyenne.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── La porte ──────────────────────────────────────────────────── */}
      <section className="shell-wide pb-4">
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/boutique" className="btn-solid">
              Essayer sur une fiche <ClockIcon size={13} />
            </Link>
            <Link href="/diagnostic" className="btn-ghost">
              Diagnostic peau
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
