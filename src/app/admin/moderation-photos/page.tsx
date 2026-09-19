import type { Metadata } from "next";
import { SectionHead } from "@/components/admin/os/primitives";
import { ModerationQueue, type WorkflowItem } from "@/components/admin/workflow-board";

export const metadata: Metadata = { title: "Modération photos" };

const ITEMS: WorkflowItem[] = [
  { id: "UGC-1042", title: "Photo avis SPF", detail: "Visage non identifiable, produit visible, texte conforme.", owner: "Avis", priority: "normal", status: "pending" },
  { id: "UGC-1043", title: "Avant / après rougeurs", detail: "Demande consentement écrit avant publication.", owner: "Galerie", priority: "high", status: "needs_edit" },
  { id: "UGC-1044", title: "Texture sérum", detail: "Photo nette, pas de donnée sensible.", owner: "Produit", priority: "low", status: "approved" },
  { id: "UGC-1045", title: "Image floue", detail: "Produit illisible, commentaire incomplet.", owner: "Avis", priority: "normal", status: "rejected" },
];

export default function ModerationPhotosPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="UGC" title="Modération photos et avant/après" sub="File dédiée aux photos d'avis, galerie client et contenus avant/après avec consentement." />
      <ModerationQueue initialItems={ITEMS} />
    </div>
  );
}
