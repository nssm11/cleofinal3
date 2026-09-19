import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { AccessibilityPreferences } from "@/components/experience/accessibility-preferences";

export const metadata: Metadata = {
  title: "Accessibilité",
  description: "Préférences de lecture, contraste, réduction de mouvement et audit d'accessibilité du site Cléopâtre.",
  alternates: { canonical: "/accessibilite" },
};

export default function AccessibilitePage() {
  return (
    <div>
      <PageIntro
        kicker="Accessibilité"
        index="A11Y"
        rail="Care"
        title={
          <>
            Lire, choisir,
            <br />
            commander sans effort.
          </>
        }
        intro="Cette surface regroupe les contrôles demandés : texte plus grand, contraste élevé, réduction de mouvement, lecture espacée, focus clavier et résumé d'erreurs accessible."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Accessibilité" }]}
        right={
          <>
            <Link href="/ameliorations#ux-access" className="btn-solid">
              Voir le batch UX
            </Link>
            <Link href="/confidentialite" className="btn-ghost">
              Confidentialité
            </Link>
          </>
        }
      />
      <section className="shell-wide py-block lg:py-block-lg">
        <AccessibilityPreferences />
      </section>
    </div>
  );
}
