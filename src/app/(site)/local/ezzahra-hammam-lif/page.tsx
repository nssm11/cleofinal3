import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";

export const metadata: Metadata = { title: "Parapharmacie Ezzahra & Hammam-Lif", description: "Page locale Cléopâtre pour Ezzahra et Hammam-Lif : boutiques, livraison, retrait et conseil.", alternates: { canonical: "/local/ezzahra-hammam-lif" } };

export default function LocalSeoPage() {
  return <div><PageIntro kicker="Local SEO" index="EZZ / HML" rail="Local" title={<>Cléopâtre près de vous,<br />Ezzahra & Hammam-Lif.</>} intro="Une page locale dédiée aux comptoirs, au retrait, à la livraison et au conseil produit autour d'Ezzahra et Hammam-Lif." breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Local" }]} right={<><Link href="/boutiques" className="btn-solid">Nos comptoirs</Link><Link href="/stock-live" className="btn-ghost">Stock live</Link></>} /><section className="shell-wide py-block"><div className="grid gap-px bg-line md:grid-cols-3">{[["Retrait", "Préparez la commande et retirez au comptoir indiqué."], ["Livraison", "Estimations par gouvernorat et ville pendant le checkout."], ["Conseil", "Questions produits, scan SKU et support pharmacie."], ["Stock", "Disponibilité par magasin et lots visibles."], ["Sécurité", "Rappels, lots et alertes produit centralisés."], ["Guides", "Guides d'achat et sélections saisonnières." ]].map(([t,d]) => <article key={t} className="bg-canvas p-6"><h2 className="font-ant text-[1.7rem] uppercase leading-none text-carbon">{t}</h2><p className="mt-4 text-[14px] leading-relaxed text-muted">{d}</p></article>)}</div></section></div>;
}
