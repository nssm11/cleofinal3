import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { ProductAlerts } from "@/components/new-features/product-alerts";

export const metadata: Metadata = { title: "Alertes produit", description: "Alertes back-in-stock, price-drop, safety and expiry.", alternates: { canonical: "/alertes-produit" } };
export default function ProductAlertsPage() { return <div><PageIntro kicker="Alerts" index="Watch" rail="Notify" title={<>Back-in-stock,<br />prix et sécurité.</>} intro="Un centre d'alertes produit indépendant : retours en stock, baisses de prix, rappels sécurité et échéances d'ouverture." breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Alertes produit" }]} right={<><Link href="/stock-live" className="btn-solid">Voir stock live</Link><Link href="/scanner" className="btn-ghost">Scanner</Link></>} /><section className="shell-wide py-block lg:py-block-lg"><ProductAlerts /></section></div>; }
