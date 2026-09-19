import type { Metadata } from "next";
import { SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";
import { pickingOrders } from "@/lib/next-feature-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checklist packing" };

export default async function PackingPage() {
  const orders = await pickingOrders(12);
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Packing" title="Checklist de colisage" sub="Chaque colis expose les étapes : produits, lots, protection, facture, étiquette et photo preuve." />
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((order, index) => (
          <Sheet key={order.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="os-label text-os-muted">{order.number}</p>
                <h2 className="mt-1 text-[15px] font-medium text-os-text">{order.email}</h2>
              </div>
              <Tag tone={index < 2 ? "warn" : "neutral"}>{order.shippingMethod}</Tag>
            </div>
            <ol className="mt-4 space-y-2 text-[12px] text-os-muted">
              {["Scanner les lignes", "Vérifier les lots", "Ajouter protection", "Glisser facture", "Coller étiquette", "Photo preuve"].map((step, i) => (
                <li key={step} className="flex items-center justify-between border-b border-os-line-soft pb-2 last:border-0">
                  <span>{String(i + 1).padStart(2, "0")} · {step}</span>
                  <Tag tone={i < (index % 4) + 1 ? "good" : "neutral"}>{i < (index % 4) + 1 ? "fait" : "à faire"}</Tag>
                </li>
              ))}
            </ol>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
