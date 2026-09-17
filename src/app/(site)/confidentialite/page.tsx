import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
};

const SECTIONS: [string, string][] = [
  ["Données collectées", "Nom, e-mail, téléphone, adresse de livraison, historique de commandes. Aucune donnée bancaire n'est stockée sur nos serveurs."],
  ["Finalités", "Traitement et livraison des commandes, service client, et — avec votre accord — envoi de notre Journal mensuel."],
  ["Conservation", "Les données de commande sont conservées 10 ans à des fins comptables ; les données de compte jusqu'à la suppression du compte."],
  ["Vos droits", "Conformément à la loi organique n° 2004-63, vous disposez d'un droit d'accès, de rectification et de suppression. Écrivez-nous via la page Aide."],
  ["Cookies", "Nous utilisons uniquement des cookies strictement nécessaires (session, panier). Aucun traceur publicitaire tiers."],
];

export default function ConfidentialitePage() {
  return (
    <div className="shell-narrow pb-16 pt-28 lg:pb-24 lg:pt-36">
      <Breadcrumbs items={[{ label: "Confidentialité" }]} />
      <div className="mt-8">
        <PageHeader eyebrow="Confidentialité" title="Ce que nous gardons, et pourquoi" />
      </div>
      <ol className="mt-12">
        {SECTIONS.map(([t, b], i) => (
          <Reveal key={t} as="li" y={8} delay={i * 0.03} className="grid gap-4 border-t border-line/70 py-6 sm:grid-cols-[auto_1fr] sm:gap-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-carbon sm:w-56">{t}</h2>
            <p className="text-[14px] leading-[1.9] text-carbon">{b}</p>
          </Reveal>
        ))}
      </ol>
      <p className="mt-10 border-t border-line/70 pt-6 text-[12.5px] leading-relaxed text-faint">
        Une question sur vos données ? Appelez le 71 450 210 ou écrivez-nous depuis la page Aide — la même équipe vous
        répond.
      </p>
    </div>
  );
}
