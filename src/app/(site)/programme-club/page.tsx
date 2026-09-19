import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";

export const metadata: Metadata = {
  title: "Cléopâtre Club",
  description: "Programme fidélité, niveaux VIP, parrainage, défis beauté et routines partagées.",
  alternates: { canonical: "/programme-club" },
};

const tiers = [
  { name: "Bronze", points: "0—999", perk: "Points de bienvenue, rappels de réachat et accès aux défis mensuels." },
  { name: "Silver", points: "1 000—2 999", perk: "Accès anticipé aux offres, badges visibles et missions avis." },
  { name: "Gold", points: "3 000—7 999", perk: "Conseil prioritaire, routines sauvegardées et invitations aux ateliers." },
  { name: "VIP", points: "8 000+", perk: "Avant-premières, récompense anniversaire et suivi personnalisé." },
];

const missions = [
  "Compléter son profil peau, cheveux ou bébé",
  "Publier un avis vérifié utile",
  "Partager une routine publique",
  "Parrainer une amie ou un proche",
  "Participer au défi beauté du mois",
  "Ajouter une photo d'usage responsable",
];

const community = [
  { title: "Q&A produit", text: "Les questions publiques se rattachent à une fiche produit et peuvent être reprises par le support." },
  { title: "Routines partagées", text: "Une routine peut devenir une liste publique, consultable par lien sans afficher de données privées." },
  { title: "Galerie clientes", text: "Les contenus envoyés sont modérés avant affichage et peuvent être retirés depuis le compte." },
  { title: "Badges", text: "Avis utile, routine claire, fidélité longue durée, participation aux défis : chaque badge explique ce qu'il récompense." },
];

export default function ProgrammeClubPage() {
  return (
    <div>
      <PageIntro
        kicker="Fidélité"
        index="Club"
        rail="Community"
        title={
          <>
            Récompenser les gestes
            <br />
            qui aident vraiment.
          </>
        }
        intro="Le Club ne remplace pas le conseil : il l'encourage. Points, niveaux, parrainage, routines partagées, défis et contributions utiles sont rassemblés dans une mécanique claire, sans ajout de paiement."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Cléopâtre Club" }]}
        right={
          <>
            <Link href="/compte/fidelite" className="btn-solid">
              Voir mes points
            </Link>
            <Link href="/liste/demo-partage-2026" className="btn-ghost">
              Exemple de liste publique
            </Link>
          </>
        }
      />

      <section className="shell-wide py-block">
        <Chapter index="01" label="Niveaux" title="Bronze, Silver, Gold, VIP" lede="Les seuils restent simples : la cliente comprend ce qu'elle gagne et pourquoi." />
        <div className="mt-8 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <article key={tier.name} className="bg-canvas p-6">
              <p className="kicker-xs text-muted">{tier.points} points</p>
              <h2 className="mt-4 font-ant text-[2.1rem] uppercase leading-none text-carbon">{tier.name}</h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">{tier.perk}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-porcelain py-block">
        <div className="shell-wide grid gap-10 lg:grid-cols-[0.42fr_1fr]">
          <Chapter index="02" label="Missions" title="Gagner des points sans pousser à acheter" lede="Le programme récompense aussi l'entraide, les profils complets et les avis vérifiés." />
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {missions.map((mission, index) => (
              <div key={mission} className="bg-canvas p-5">
                <span className="tick text-iodine">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-4 text-[14px] leading-relaxed text-carbon">{mission}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell-wide py-block-lg">
        <Chapter index="03" label="Communauté" title="Routines, Q&A, galeries et badges" lede="Tout est modéré et relié à des usages concrets : pas de promesse médicale, pas de données privées exposées." />
        <div className="mt-8 grid gap-px bg-line md:grid-cols-2">
          {community.map((item) => (
            <article key={item.title} className="bg-canvas p-6">
              <h2 className="font-ant text-[1.8rem] uppercase leading-none text-carbon">{item.title}</h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
