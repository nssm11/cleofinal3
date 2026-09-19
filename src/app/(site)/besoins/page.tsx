import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { concerns } from "@/db/schema";
import { CONCERN_LANDING_GROUPS, SKIN_TYPE_FILTERS, ROUTINE_STEP_FILTERS } from "@/lib/shopping-taxonomy";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";

export const metadata: Metadata = {
  title: "Shop by concern",
  description: "Entrer dans la boutique par besoin : acné, taches, chute, sécheresse, bébé, solaire, peau sensible et anti-âge.",
  alternates: { canonical: "/besoins" },
};

export const dynamic = "force-dynamic";

export default async function BesoinsPage() {
  const liveConcerns = await db.select({ slug: concerns.slug, name: concerns.name, intro: concerns.intro }).from(concerns).orderBy(asc(concerns.name));
  return (
    <div>
      <PageIntro
        kicker="Shop by concern"
        index="Needs"
        rail="Concern"
        title={
          <>
            Trouver par besoin,
            <br />
            pas par rayon.
          </>
        }
        intro="Acné, taches, chute, sécheresse, bébé, solaire, peau sensible : chaque porte mène à une sélection filtrée et peut encore être affinée par type de peau ou étape de routine."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "Besoins" }]}
        right={
          <>
            <Link href="/quiz" className="btn-solid">Faire le quiz</Link>
            <Link href="/boutique" className="btn-ghost">Toute la boutique</Link>
          </>
        }
      />

      <section className="shell-wide py-block">
        <Chapter index="01" label="Entrées rapides" title="Les grands besoins" />
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {CONCERN_LANDING_GROUPS.map((group, i) => (
            <Link key={group.slug} href={group.href} className="group flex min-h-56 flex-col justify-between bg-canvas p-6 transition-colors hover:bg-iodine/5">
              <span className="tick text-iodine">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block font-ant text-[1.8rem] uppercase leading-none text-carbon group-hover:text-iodine-deep">{group.fr}</span>
                <span className="mt-3 block text-[13px] leading-relaxed text-muted">Chercher aussi : {group.query}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-porcelain py-block">
        <div className="shell-wide grid gap-10 lg:grid-cols-[0.4fr_1fr]">
          <Chapter index="02" label="Filtres" title="Type de peau et étape" lede="Ces filtres sont maintenant dans la boutique et modifient les résultats en temps réel." />
          <div className="grid gap-px bg-line md:grid-cols-2">
            <div className="bg-canvas p-6">
              <p className="kicker-xs text-muted">Type de peau</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SKIN_TYPE_FILTERS.map((skin) => <Link key={skin.slug} href={`/boutique?skin=${skin.slug}`} className="btn-ghost">{skin.fr}</Link>)}
              </div>
            </div>
            <div className="bg-canvas p-6">
              <p className="kicker-xs text-muted">Étape routine</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {ROUTINE_STEP_FILTERS.map((step) => <Link key={step.slug} href={`/boutique?step=${step.slug}`} className="btn-ghost">{step.fr}</Link>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell-wide py-block-lg">
        <Chapter index="03" label="Tous les besoins" title="Le lexique vivant du catalogue" />
        <div className="mt-8 grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
          {liveConcerns.map((concern) => (
            <Link key={concern.slug} href={`/besoin/${concern.slug}`} className="group bg-canvas p-5 transition-colors hover:bg-iodine/5">
              <h2 className="font-ant text-[1.5rem] uppercase leading-none text-carbon group-hover:text-iodine-deep">{concern.name}</h2>
              {concern.intro && <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted">{concern.intro}</p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
