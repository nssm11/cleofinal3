import type { Metadata } from "next";
import { SectionHead, Metric } from "@/components/admin/os/primitives";
import { WorkflowBoard, type WorkflowItem } from "@/components/admin/workflow-board";
import { pickingOrders } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Préparation entrepôt" };

export default async function PreparationPage() {
  const orders = await pickingOrders();
  const items: WorkflowItem[] = orders.map((order, index) => ({
    id: order.number,
    title: `${order.items.length} lignes à prélever`,
    detail: order.items.slice(0, 3).map((item) => `${item.quantity}× ${item.name}`).join(" · "),
    owner: order.shippingMethod === "pickup" ? "Retrait" : "Livraison",
    priority: index < 3 ? "high" : "normal",
    status: index % 3 === 0 ? "wave" : index % 3 === 1 ? "picking" : "checked",
    meta: order.email,
  }));
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Warehouse" title="Écran de picking" sub="Les commandes confirmées et en préparation deviennent des vagues de prélèvement avec statut déplaçable." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Vagues" value={orders.length} />
        <Metric label="Lignes" value={orders.reduce((sum, order) => sum + order.items.length, 0)} />
        <Metric label="Unités" value={orders.reduce((sum, order) => sum + order.items.reduce((n, item) => n + item.quantity, 0), 0)} />
      </div>
      <WorkflowBoard columns={[{ key: "wave", label: "Vague" }, { key: "picking", label: "À prélever" }, { key: "checked", label: "Contrôlé" }, { key: "packed", label: "Vers packing" }]} initialItems={items} />
    </div>
  );
}
