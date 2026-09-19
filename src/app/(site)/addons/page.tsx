import type { Metadata } from "next";
import Link from "next/link";
import { addonImplementationStats, addonImplementations } from "@/lib/addon-implementation";
import { PageIntro } from "@/components/shell/page-intro";
import { AddonsWorkspace } from "@/components/addons/addons-workspace";

export const metadata: Metadata = {
  title: "240 add-ons",
  description: "Workspace interactif des 240 add-ons installés, hors arabe, tunisien et paiement.",
  alternates: { canonical: "/addons" },
};

export const dynamic = "force-dynamic";

export default function AddonsPage() {
  return (
    <div>
      <PageIntro
        kicker="Add-ons"
        index="240"
        rail="Installed"
        title={
          <>
            Les 240 add-ons,
            <br />
            maintenant pilotables.
          </>
        }
        intro="Ce n'est plus une simple liste : chaque add-on possède un état local, une destination, une fiche JSON, des critères d'acceptation, un export CSV/JSON et une page détail. Les ajouts arabe, tunisien et paiement restent exclus."
        breadcrumbs={[{ href: "/", label: "Accueil" }, { label: "240 add-ons" }]}
        right={
          <>
            <Link href="/api/addons/export" className="btn-solid">
              Export CSV
            </Link>
            <Link href="/ameliorations" className="btn-ghost">
              Matrice complète
            </Link>
          </>
        }
      >
        <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total" value={addonImplementationStats.total} />
          <Stat label="Nouveaux" value={addonImplementationStats.byMode.new} />
          <Stat label="Workflows" value={addonImplementationStats.byKind.workflow} />
          <Stat label="Admin/API/auto" value={addonImplementationStats.byKind.admin + addonImplementationStats.byKind.api + addonImplementationStats.byKind.automation} />
        </div>
      </PageIntro>

      <section className="shell-wide py-block lg:py-block-lg">
        <AddonsWorkspace items={addonImplementations} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-canvas p-6">
      <p className="kicker-xs text-muted">{label}</p>
      <p className="mt-3 font-ant text-[2.6rem] uppercase leading-none text-carbon">{value}</p>
    </div>
  );
}
