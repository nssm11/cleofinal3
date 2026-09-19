import type { Metadata } from "next";
import Link from "next/link";
import { statusReport, type Check } from "@/lib/status";
import { SITE_URL } from "@/lib/env";
import { jsonLd } from "@/lib/utils";
import { Kicker } from "@/components/kit/surfaces";
import { MotifLayer } from "@/components/shell/motif";
import { Reveal } from "@/components/motion/reveal";
import { CheckIcon, ClockIcon, RefreshIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "L'état de la maison",
  description:
    "Ce que vérifie Cléopâtre avant de vous laisser commander : base de données, catalogue, lots datés, courrier sortant. Mesuré, jamais affirmé.",
  alternates: { canonical: "/etat" },
};
export const dynamic = "force-dynamic";

/**
 * L'ÉTAT DE LA MAISON.
 *
 * A status page is easy to fake — a green tick and a nice sentence cost
 * nothing. So this one prints the queries: how long the database took, how
 * many lots are dated, which ones are past their date, how much mail is
 * stuck. And it prints what it *cannot* see, because a control is only worth
 * something when it says where it is blind.
 */
const LABELS: Record<string, string> = {
  ok: "normal",
  warn: "à surveiller",
  bad: "à corriger",
};

export default async function EtatPage() {
  const report = await statusReport();
  const tone = (s: Check["state"]) => (s === "ok" ? "text-ok" : s === "warn" ? "text-amber" : "text-crit");

  return (
    <div>
      <section className="relative overflow-hidden bg-petrol text-chalk">
        <MotifLayer motif="architecture" mark={[64, 14]} />
        <div className="shell-wide relative py-16 sm:py-20">
          <Kicker className="text-chalk-faint!">État de la maison</Kicker>
          <h1 className="mt-5 max-w-[24ch] font-ant uppercase text-[clamp(2.2rem,5vw,4rem)] font-light leading-[1.02] text-chalk">
            Ce qui est vérifié,
            <br />
            et ce qui ne l&apos;est pas.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-chalk-muted">
            Chaque ligne ci-dessous est une requête exécutée à l&apos;instant sur la vraie base du magasin, pas une
            décoration. L&apos;état général est <strong className={tone(report.state)}>{LABELS[report.state]}</strong> —
            relevé le {new Date(report.at).toLocaleString("fr-TN")}.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-[13px] text-chalk-muted">
            <span className="inline-flex items-center gap-2">
              <ClockIcon size={14} strokeWidth={1.5} /> Base de données : {report.figures.dbMs} ms
            </span>
            <span className="inline-flex items-center gap-2">
              <RefreshIcon size={14} strokeWidth={1.5} /> Processus en marche depuis {Math.max(1, Math.round(report.figures.processUptimeS / 60))} min
            </span>
            <Link href="/rapidite" className="underline decoration-chalk-faint decoration-dotted underline-offset-4">
              Pourquoi ce site est rapide →
            </Link>
          </div>
        </div>
      </section>

      <section className="shell-wide py-14 sm:py-20">
        <ul className="grid gap-px border border-line/60 bg-line/60 sm:grid-cols-2 lg:grid-cols-3">
          {report.checks.map((c, i) => (
            <li key={c.key} className="bg-porcelain px-6 py-6" id={c.key}>
              <Reveal y={10} delay={(i % 3) * 0.05} amount={0.05}>
                <p className="flex items-center justify-between gap-4">
                  <span className="kicker-xs text-faint">{c.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${tone(c.state)}`}>{LABELS[c.state]}</span>
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-carbon">{c.detail}</p>
                {c.action && <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.action}</p>}
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Les chiffres, tels quels : aucun n'est un objectif. */}
        <div className="mt-10 grid gap-px border border-line/60 bg-line/60 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Références en ligne", report.figures.products],
            ["Lots suivis par date", report.figures.lots],
            ["Unités datées et vendables", report.figures.unitsInLots],
            ["Commandes sur 30 jours", report.figures.orders30],
            ["Avis publiés", report.figures.reviews],
            ["Articles de journal", report.figures.articles],
            ["Comptoirs ouverts", report.figures.counters],
            ["Node", report.figures.node],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-porcelain px-6 py-5">
              <p className="kicker-xs text-faint">{label}</p>
              <p className="mt-2 font-ant text-[1.7rem] leading-none tabular-nums text-carbon">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 border-t border-line/60 pt-10 lg:grid-cols-2">
          <div>
            <p className="kicker-xs mb-4 text-iodine-deep">Ce que cette page ne vérifie pas</p>
            <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-muted">
              <li className="flex gap-3">
                <CheckIcon size={13} strokeWidth={1.6} className="mt-1 shrink-0 text-faint" />
                Le rendu dans votre navigateur : la page est produite par le serveur, ce qui se passe ensuite sur votre appareil nous échappe.
              </li>
              <li className="flex gap-3">
                <CheckIcon size={13} strokeWidth={1.6} className="mt-1 shrink-0 text-faint" />
                La vérité de chaque composition produit : les fiches disent elles-mêmes si un pharmacien les a relues.
              </li>
              <li className="flex gap-3">
                <CheckIcon size={13} strokeWidth={1.6} className="mt-1 shrink-0 text-faint" />
                La livraison, une fois le colis chez le transporteur.
              </li>
            </ul>
          </div>
          <div>
            <p className="kicker-xs mb-4 text-iodine-deep">Pour les machines</p>
            <p className="text-[13.5px] leading-relaxed text-muted">
              Le même rapport est disponible en JSON sur <code className="border border-line/60 bg-mist/50 px-1.5 py-0.5 font-mono text-[12px]">/api/health</code>, avec un
              code <code className="border border-line/60 bg-mist/50 px-1.5 py-0.5 font-mono text-[12px]">503</code> dès qu&apos;un contrôle passe au rouge. Une sonde peut donc
              s&apos;en servir sans lire une page.
            </p>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "L'état de la maison",
            url: `${SITE_URL}/etat`,
            description: "Contrôles vérifiés à l'instant sur la boutique Cléopâtre.",
          }),
        }}
      />
    </div>
  );
}
