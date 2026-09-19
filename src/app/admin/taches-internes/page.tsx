import type { Metadata } from "next";
import { SectionHead } from "@/components/admin/os/primitives";
import { WorkflowBoard, type WorkflowItem } from "@/components/admin/workflow-board";

export const metadata: Metadata = { title: "Tâches internes" };

const ITEMS: WorkflowItem[] = [
  { id: "TASK-CAT-01", title: "Compléter les fiches sans actifs", detail: "Ajouter actifs clés, tolérances connues et précautions.", owner: "Catalogue", priority: "high", status: "todo" },
  { id: "TASK-CONT-02", title: "Préparer guide SPF semaine", detail: "Bloc hero, sélection produits et FAQ associée.", owner: "Contenu", priority: "normal", status: "doing" },
  { id: "TASK-SAV-03", title: "Relancer avis photo", detail: "Valider trois médias client avant publication.", owner: "Support", priority: "normal", status: "todo" },
  { id: "TASK-OPS-04", title: "Contrôler lots non datés", detail: "Sortir les lots sans DLC de la surface de vente.", owner: "Stock", priority: "urgent", status: "blocked" },
];

export default function TachesInternesPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Tasks" title="Board de tâches internes" sub="Un tableau transversal pour catalogue, support, opérations, contenu et conformité." />
      <WorkflowBoard columns={[{ key: "todo", label: "À faire" }, { key: "doing", label: "En cours" }, { key: "blocked", label: "Bloqué" }, { key: "done", label: "Terminé" }]} initialItems={ITEMS} />
    </div>
  );
}
