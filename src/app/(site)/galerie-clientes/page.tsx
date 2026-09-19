import type { Metadata } from "next";
import { PageIntro } from "@/components/shell/page-intro";
import { UgcGallery } from "@/components/new-features/ugc-gallery";

export const metadata: Metadata = { title: "Galerie clientes", description: "Galerie UGC et photos clientes modérées.", alternates: { canonical: "/galerie-clientes" } };
export default function GalerieClientesPage() { return <div><PageIntro kicker="UGC" index="Gallery" rail="Community" title={<>Photos clientes,<br />modérées avant publication.</>} intro="Un nouveau module de galerie : soumission locale, statut de modération et affichage public des photos approuvées." breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Galerie clientes" }]} /><section className="shell-wide py-block lg:py-block-lg"><UgcGallery /></section></div>; }
