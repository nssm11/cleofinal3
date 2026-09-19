import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { ProductQuestions } from "@/components/new-features/product-questions";

export const metadata: Metadata = { title: "Questions produits", description: "Hub public de questions/réponses produits.", alternates: { canonical: "/questions-produits" } };

export default function ProductQuestionsPage() {
  return <div><PageIntro kicker="Product Q&A" index="Q&A" rail="Advice" title={<>Questions produits,<br />réponses publiques.</>} intro="Un nouveau hub dédié aux questions produit : demander, filtrer, lire les réponses et éviter que la même question reste cachée dans un ticket privé." breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Questions produits" }]} right={<><Link href="/scanner" className="btn-solid">Scanner un produit</Link><Link href="/conseil-pharmacien" className="btn-ghost">Demander conseil</Link></>} /><section className="shell-wide py-block lg:py-block-lg"><ProductQuestions /></section></div>;
}
