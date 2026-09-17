import type { Metadata } from "next";
import { Breadcrumbs, PageHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Conditions générales de vente", alternates: { canonical: "/cgv" } };

const SECTIONS: [string, string][] = [
  ["1. Objet", "Les présentes conditions régissent les ventes réalisées sur le site para-cleopatre.tn par Cléopâtre — Espace Santé Beauté, Ezzahra, Tunisie."],
  ["2. Prix", "Les prix sont exprimés en dinars tunisiens (DT), toutes taxes comprises. Les frais de livraison sont indiqués avant la validation de la commande."],
  ["3. Commande", "Toute commande vaut acceptation des présentes conditions. Cléopâtre se réserve le droit d'annuler une commande en cas d'indisponibilité ou de suspicion de fraude, avec remboursement intégral."],
  ["4. Paiement", "Paiement à la livraison en espèces, virement bancaire, ou carte cadeau. Le paiement par carte bancaire en ligne sera proposé prochainement."],
  ["5. Livraison", "Délais indicatifs de 24 à 72 h ouvrées selon le gouvernorat. Le client vérifie l'état du colis à la réception et signale toute anomalie sous 48 h."],
  ["6. Rétractation & retours", "Le client dispose de 7 jours à compter de la réception pour retourner un produit non ouvert, dans son emballage d'origine. Les frais de retour restent à sa charge, sauf erreur de notre part."],
  ["7. Garantie", "Tous les produits sont authentiques et proviennent des circuits officiels de distribution. En cas de défaut, contactez-nous sous 48 h."],
  ["8. Données personnelles", "Voir notre politique de confidentialité."],
];

/** Legal pages are read once, carefully — so they are set as plain text, not as design. */
export default function CGVPage() {
  return (
    <div className="shell-narrow pb-16 pt-28 lg:pb-24 lg:pt-36">
      <Breadcrumbs items={[{ label: "CGV" }]} />
      <div className="mt-8">
        <PageHeader eyebrow="Informations" title="Conditions générales de vente" />
      </div>
      <ol className="mt-12">
        {SECTIONS.map(([t, b], i) => (
          <Reveal key={t} as="li" y={8} delay={i * 0.03} className="grid gap-4 border-t border-line/70 py-6 sm:grid-cols-[auto_1fr] sm:gap-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-carbon sm:w-56">{t}</h2>
            <p className="text-[14px] leading-[1.9] text-carbon">{b}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
