import type { Metadata } from "next";
import Link from "next/link";
import { FeatureHero, FeatureCard, FeatureGrid } from "@/components/next-features/public-shell";

export const metadata: Metadata = {
  title: "Portail retours RMA",
  description: "Créer et suivre une demande de retour depuis le compte client.",
};

export default function RetoursRmaPublicPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Retours"
        title="Portail retours et RMA"
        description="Une porte claire pour préparer une demande de retour, suivre son statut et joindre les informations nécessaires."
      />
      <section className="shell-wide space-y-8 py-14 lg:py-20">
        <FeatureGrid>
          <FeatureCard title="Créer une demande" description="Depuis une commande livrée, sélectionnez la ligne concernée et le motif." href="/compte/retours" />
          <FeatureCard title="Suivre un dossier" description="Les statuts pending, in review, approved, rejected et completed sont visibles côté compte." href="/compte/retours" />
          <FeatureCard title="Back-office RMA" description="L'équipe accepte, refuse, complète et clôture les dossiers depuis le module admin." href="/admin/retours-rma" />
        </FeatureGrid>
        <Link href="/compte/retours" className="btn-solid">Ouvrir mes retours</Link>
      </section>
    </div>
  );
}
