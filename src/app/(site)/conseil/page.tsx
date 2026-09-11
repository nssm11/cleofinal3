import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AdvisorQuiz } from "@/components/account/advisor-quiz";
import { Breadcrumbs, PageHeader } from "@/components/ui/primitives";
import { HOURS_LABEL } from "@/lib/hours";

export const metadata: Metadata = {
  title: "Diagnostic beauté",
  description:
    "Quatre questions à un pharmacien Cléopâtre : type de peau, priorité du moment, moment de la routine. Un conseil expliqué, pas une liste de promotions.",
  alternates: { canonical: "/conseil" },
};
export const dynamic = "force-dynamic";

/**
 * LE DIAGNOSTIC.
 *
 * La page reste lisible sans JavaScript — les questions et le principe du
 * conseil sont dans le HTML — mais le parcours se vit une question à la fois.
 *
 * Rien ici ne promet un résultat personnalisé magique : on dit explicitement
 * que le conseil vient des réponses et des références **réellement en stock**,
 * et qu'un pharmacien reste joignable au téléphone. Un quiz qui refuse de
 * mentir garde sa valeur la deuxième fois.
 */
export default async function ConseilPage() {
  const me = await getCurrentUser();

  return (
    <div className="container-lux py-section-sm">
      <Breadcrumbs items={[{ label: "Diagnostic beauté" }]} />

      <div className="mt-8">
        <PageHeader
          eyebrow="Conseil"
          title="Trouver votre soin"
          description="Quatre questions, un conseil expliqué. Aucune inscription nécessaire — mais un compte le garde en mémoire."
          align="center"
        />
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <AdvisorQuiz isAuthed={!!me} />
      </div>

      {/* Ce que le diagnostic n'est pas — écrit noir sur blanc, avant que la
          personne n'ait à le deviner. */}
      <section className="mx-auto mt-16 grid max-w-4xl gap-8 border-t border-stone pt-10 sm:grid-cols-3">
        {[
          {
            title: "Ce que nous regardons",
            body: "Votre type de peau, votre priorité du moment, le temps dont vous disposez. Rien de plus : le reste ne changerait pas le conseil.",
          },
          {
            title: "Ce que nous ne faisons pas",
            body: "Nous ne conseillons que des références disponibles et nous n'ajoutons aucune étape inutile. Une routine tenue vaut mieux qu'une routine abandonnée.",
          },
          {
            title: "Quand nous appeler",
            body: `Une peau qui réagit, un traitement en cours, une grossesse : le téléphone vaut mieux qu'un questionnaire. ${HOURS_LABEL} — 71 450 210.`,
          },
        ].map((c) => (
          <div key={c.title}>
            <p className="eyebrow mb-2">{c.title}</p>
            <p className="text-[13.5px] leading-relaxed text-charcoal">{c.body}</p>
          </div>
        ))}
      </section>

      <p className="mt-10 text-center text-[12px] text-muted-2">
        Le diagnostic ne remplace pas une consultation. En cas de doute persistant,&nbsp;
        <Link href="/aide" className="text-ink underline underline-offset-4">
          écrivez-nous
        </Link>
        .
      </p>
    </div>
  );
}
