import type { Metadata } from "next";
import { SectionHead, Metric } from "@/components/admin/os/primitives";
import { WorkflowBoard, type WorkflowItem } from "@/components/admin/workflow-board";
import { returnOrderRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Retours RMA" };

export default async function RetoursRmaPage() {
  const orders = await returnOrderRows();
  const items: WorkflowItem[] = orders.map((order, index) => ({
    id: `RMA-${order.number}`,
    title: order.status === "returned" ? "Retour reçu" : "Demande potentielle",
    detail: `${order.email} · ${order.items.slice(0, 2).map((item) => item.name).join(" · ")}`,
    owner: order.phone,
    priority: index < 2 ? "high" : "normal",
    status: order.status === "returned" ? "received" : index % 2 === 0 ? "requested" : "review",
  }));
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="RMA" title="Portail retours et autorisations" sub="File d'acceptation, contrôle lot, décision, avoir manuel ou remise en rayon." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Dossiers" value={items.length} />
        <Metric label="À examiner" value={items.filter((item) => item.status === "review").length} />
        <Metric label="Reçus" value={items.filter((item) => item.status === "received").length} />
      </div>
      <WorkflowBoard columns={[{ key: "requested", label: "Demandé" }, { key: "review", label: "Analyse" }, { key: "approved", label: "Accepté" }, { key: "received", label: "Reçu" }]} initialItems={items} />
    </div>
  );
}
