import type { Metadata } from "next";
import { SectionHead } from "@/components/admin/os/primitives";
import { PurchaseOrderBoard } from "@/components/admin/purchase-order-board";

export const metadata: Metadata = { title: "Achats" };
export default function PurchaseOrdersPage() { return <div className="space-y-5"><SectionHead eyebrow="Procurement" title="Purchase order module" sub="New module for draft purchase orders, sending, receiving workflow and lot intake preparation." /><PurchaseOrderBoard /></div>; }
