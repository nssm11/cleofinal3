import type { Metadata } from "next";
import { SectionHead } from "@/components/admin/os/primitives";
import { WorkflowBoard, type WorkflowItem } from "@/components/admin/workflow-board";

export const metadata: Metadata = { title: "Bannières programmées" };

const ITEMS: WorkflowItem[] = [
  { id: "BAN-SPF-W37", title: "Hero SPF invisible", detail: "Accueil + solaire, du 21 au 28 septembre.", owner: "Homepage", priority: "high", status: "scheduled" },
  { id: "BAN-RET-W38", title: "Caution rétinol", detail: "Bandeau conseil vers rappels et analyse INCI.", owner: "Conformité", priority: "normal", status: "draft" },
  { id: "BAN-BF-W40", title: "Sélection courtes dates", detail: "Lien vers anti-gaspillage, stock lot par lot.", owner: "Promotions", priority: "normal", status: "review" },
];

export default function BannieresPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Merch" title="Promo banner scheduler" sub="Planifiez les bandeaux par page, période, priorité et statut de validation." />
      <WorkflowBoard columns={[{ key: "draft", label: "Brouillon" }, { key: "review", label: "Validation" }, { key: "scheduled", label: "Planifié" }, { key: "live", label: "Live" }]} initialItems={ITEMS} />
    </div>
  );
}
