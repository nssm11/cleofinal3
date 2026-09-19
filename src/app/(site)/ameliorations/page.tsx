import type { Metadata } from "next";
import Link from "next/link";
import { enhancementBatches, enhancementStats, excludedEnhancements } from "@/lib/enhancement-batches";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";

export const metadata: Metadata = {
  title: "Améliorations livrées",
  description:
    "La matrice complète des améliorations ajoutées ou raccordées au site Cléopâtre, hors arabe, variantes tunisiennes et paiement.",
  alternates: { canonical: "/ameliorations" },
};

const modeLabel = {
  new: "Nouveau dans ce lot",
  existing: "Déjà raccordé",
  covered: "Couvert par le système",
} as const;

const modeClass = {
  new: "border-iodine bg-iodine/10 text-iodine-deep",
  existing: "border-line bg-canvas text-carbon",
  covered: "border-line bg-porcelain text-muted",
} as const;

export default function AmeliorationsPage() {
  return (
    <div>
      <PageIntro
        kicker="Livraison"
        index={String(enhancementStats.items)}
        rail="Batches"
        title={
          <>
            Toutes les améliorations,
            <br />
            sans arabe, tunisien ni paiement.
          </>
        }
        intro="Cette page est la matrice livrée avec le ZIP : chaque carte pointe vers une zone réelle du produit. Les sujets exclus sont listés clairement pour respecter la contrainte donnée."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Améliorations" }]}
        right={
          <>
            <Link href="/collections" className="btn-solid">
              Voir les collections
            </Link>
            <Link href="/api/addons/export" className="btn-ghost">
              Export CSV des 240
            </Link>
          </>
        }
      >
        <dl className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Batches", enhancementStats.batches],
            ["Points couverts", enhancementStats.items],
            ["Nouveaux écrans", enhancementStats.newItems],
            ["Raccordés", enhancementStats.existingItems + enhancementStats.coveredItems],
          ].map(([label, value]) => (
            <div key={label} className="bg-canvas p-6">
              <dt className="kicker-xs text-muted">{label}</dt>
              <dd className="mt-3 font-ant text-[2.6rem] uppercase leading-none text-carbon">{value}</dd>
            </div>
          ))}
        </dl>
      </PageIntro>

      <section className="shell-wide py-block">
        <Chapter
          index="00"
          label="Contraintes respectées"
          title="Ce qui n'a volontairement pas été ajouté"
          lede="Les points suivants restent hors périmètre de cette livraison, exactement comme demandé."
        />
        <ul className="mt-8 grid gap-px bg-line lg:grid-cols-3">
          {excludedEnhancements.map((item) => (
            <li key={item} className="bg-canvas p-6 text-[14px] leading-relaxed text-muted">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="shell-wide pb-block-lg">
        <Chapter
          index="01"
          label="Matrice"
          title="Les 12 lots livrés"
          lede="Les cartes sont volontairement opérationnelles : elles renvoient vers les collections, comptes, pages conseil, sections admin ou surfaces déjà présentes."
        />

        <div className="mt-10 space-y-10">
          {enhancementBatches.map((batch, batchIndex) => (
            <article key={batch.id} id={batch.id} className="border-t border-line pt-8">
              <div className="grid gap-6 lg:grid-cols-[0.42fr_1fr]">
                <div>
                  <p className="tick text-iodine">{String(batchIndex + 1).padStart(2, "0")}</p>
                  <h2 className="mt-3 font-ant text-[clamp(1.9rem,3vw,3rem)] uppercase leading-none text-carbon">
                    {batch.title}
                  </h2>
                  <p className="mt-4 max-w-[38ch] text-[14px] leading-relaxed text-muted">{batch.deck}</p>
                  <Link href={batch.href} className="btn-ghost mt-6 inline-flex">
                    Ouvrir la zone
                  </Link>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {batch.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex min-h-28 flex-col justify-between border border-line bg-canvas p-4 transition-colors hover:border-iodine hover:bg-iodine/5"
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span className="kicker-xs text-faint">{item.id}</span>
                        <span className={`border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${modeClass[item.mode]}`}>
                          {modeLabel[item.mode]}
                        </span>
                      </span>
                      <span className="mt-6 text-[13px] leading-snug text-carbon transition-colors group-hover:text-iodine-deep">
                        {item.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
