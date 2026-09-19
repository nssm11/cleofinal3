import type { Metadata } from "next";
import { FeatureHero } from "@/components/next-features/public-shell";
import { DataRequestCenter } from "@/components/next-features/customer-workflows";

export const metadata: Metadata = {
  title: "Demandes données personnelles",
  description: "Créer une demande export, suppression ou rectification des données.",
};

export default function DonneesPersonnellesPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Données"
        title="Exporter ou supprimer mes données"
        description="Une porte claire pour créer une demande de droits : export, suppression ou correction, avec une référence de suivi."
      />
      <section className="shell-wide py-14 lg:py-20">
        <DataRequestCenter />
      </section>
    </div>
  );
}
