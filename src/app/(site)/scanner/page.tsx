import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { BarcodeLookup } from "@/components/new-features/barcode-lookup";

export const metadata: Metadata = {
  title: "Scanner produit",
  description: "Vérifier un code-barres, un SKU ou une référence produit Cléopâtre.",
  alternates: { canonical: "/scanner" },
};

export const dynamic = "force-dynamic";

export default function ScannerPage() {
  return (
    <div>
      <PageIntro
        kicker="Product scanner"
        index="SKU"
        rail="Lookup"
        title={<>Vérifier un produit,<br />sans attendre.</>}
        intro="Un nouveau module dédié au scan et à l'authenticité : SKU, code-barres, disponibilité et lien direct vers la fiche produit."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Scanner" }]}
        right={<><Link href="/stock-live" className="btn-solid">Stock live</Link><Link href="/questions-produits" className="btn-ghost">Question produit</Link></>}
      />
      <section className="shell-wide py-block lg:py-block-lg"><BarcodeLookup /></section>
    </div>
  );
}
