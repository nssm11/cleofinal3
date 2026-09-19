import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";

export const metadata: Metadata = { title: "Guides d'achat", description: "Buying guides, ingredient guides, brand stories and seasonal campaign entries.", alternates: { canonical: "/guides-achat" } };

const guides = [
  ["Best SPF", "Comparer textures, fini invisible, peau sensible et stock.", "/boutique?step=spf&sort=rating"],
  ["Best cleanser", "Nettoyants doux, moussants, micellaires et bébé.", "/boutique?step=cleanser"],
  ["Ingredient encyclopedia", "Actifs, notes, familles et produits associés.", "/actifs"],
  ["Brand stories", "Laboratoires, pays, produits héros et avis.", "/marques"],
  ["Seasonal campaigns", "Été, hiver, rentrée, bébé, cheveux et short-date.", "/collections"],
  ["Best products by concern", "Acné, taches, sécheresse, chute, peau sensible.", "/besoins"],
];

export default function BuyingGuidesPage() {
  return <div><PageIntro kicker="Content commerce" index="Guides" rail="Growth" title={<>Guides d&apos;achat,<br />pages campagne.</>} intro="Une nouvelle entrée marketing et SEO qui rassemble guides d&apos;achat, brand stories, ingrédients, collections et pages best-products." breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Guides d’achat" }]} right={<><Link href="/collections" className="btn-solid">Collections</Link><Link href="/api/feeds/google" className="btn-ghost">Flux produit</Link></>} /><section className="shell-wide py-block"><Chapter index="01" label="Guides" title="Six portes éditoriales" /><div className="mt-8 grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">{guides.map(([title, text, href]) => <Link key={title} href={href} className="group bg-canvas p-6 transition-colors hover:bg-iodine/5"><h2 className="font-ant text-[1.8rem] uppercase leading-none text-carbon group-hover:text-iodine-deep">{title}</h2><p className="mt-4 text-[14px] leading-relaxed text-muted">{text}</p></Link>)}</div></section></div>;
}
