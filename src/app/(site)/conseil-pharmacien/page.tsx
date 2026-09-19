import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";
import { PharmacistAdviceClient } from "@/components/experience/pharmacist-advice-client";

export const metadata: Metadata = {
  title: "Conseil pharmacien",
  description: "Triage, demande conseil, créneaux, pièces jointes et support guidé pour les clientes Cléopâtre.",
  alternates: { canonical: "/conseil-pharmacien" },
};

const faqs = [
  ["Puis-je superposer deux actifs ?", "Commencez par un seul actif fort. Si la peau reste confortable pendant deux semaines, ajoutez le second progressivement."],
  ["Que faire en cas de picotement ?", "Rincez si la sensation est vive, suspendez le produit suspect et demandez conseil avec la liste des produits utilisés."],
  ["Comment joindre une photo ?", "Depuis le fil support connecté, ajoutez une photo nette en lumière naturelle et précisez la date d'apparition."],
  ["Puis-je demander une vidéo consultation ?", "Oui : le triage prépare un créneau et l'équipe confirme le canal disponible."],
];

export default function ConseilPharmacienPage() {
  return (
    <div>
      <PageIntro
        kicker="Conseil"
        index="Live"
        rail="Support"
        title={
          <>
            Avant le ticket,
            <br />
            poser la bonne question.
          </>
        }
        intro="Le conseil pharmacien rassemble triage, formulaire guidé, créneau, FAQ et direction vers le bon canal support. Les conversations restent liées au compte lorsque la cliente se connecte."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Conseil pharmacien" }]}
        right={
          <>
            <Link href="/compte/support" className="btn-solid">
              Ouvrir mon support
            </Link>
            <Link href="/aide" className="btn-ghost">
              Centre d&apos;aide
            </Link>
          </>
        }
      />

      <section className="shell-wide py-block">
        <PharmacistAdviceClient />
      </section>

      <section className="bg-porcelain py-block">
        <div className="shell-wide">
          <Chapter index="02" label="FAQ" title="Réponses automatiques utiles" lede="Ces réponses aident sans remplacer l'échange humain : elles orientent et évitent les tickets inutiles." />
          <div className="mt-8 grid gap-px bg-line md:grid-cols-2">
            {faqs.map(([q, a]) => (
              <article key={q} className="bg-canvas p-6">
                <h2 className="font-ant text-[1.6rem] uppercase leading-none text-carbon">{q}</h2>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
