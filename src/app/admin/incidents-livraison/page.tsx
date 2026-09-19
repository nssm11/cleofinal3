import type { Metadata } from "next";
import { SectionHead, Metric } from "@/components/admin/os/primitives";
import { WorkflowBoard, type WorkflowItem } from "@/components/admin/workflow-board";
import { deliveryIssueRows } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Incidents livraison" };

export default async function IncidentsLivraisonPage() {
  const orders = await deliveryIssueRows();
  const items: WorkflowItem[] = orders.map((order, index) => ({
    id: order.number,
    title: order.status === "returned" ? "Retour transporteur" : order.status === "cancelled" ? "Commande annulée" : "Livraison à suivre",
    detail: `${order.shippingAddress.city} · ${order.items.length} lignes · ${order.trackingCode ?? "sans tracking"}`,
    owner: order.phone,
    priority: order.status === "returned" ? "urgent" : index < 3 ? "high" : "normal",
    status: order.status === "returned" ? "failed" : index % 3 === 0 ? "triage" : "carrier",
  }));
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Delivery" title="Tracker des incidents livraison" sub="Adresse à corriger, colis abîmé, absence client, retour transporteur et relance opérateur." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Dossiers" value={items.length} />
        <Metric label="Urgents" value={items.filter((item) => item.priority === "urgent").length} tone="bad" />
        <Metric label="Chez transporteur" value={items.filter((item) => item.status === "carrier").length} />
      </div>
      <WorkflowBoard columns={[{ key: "triage", label: "Triage" }, { key: "carrier", label: "Transporteur" }, { key: "failed", label: "Échec" }, { key: "closed", label: "Clos" }]} initialItems={items} />
    </div>
  );
}
