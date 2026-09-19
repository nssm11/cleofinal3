import type { Metadata } from "next";
import { SectionHead } from "@/components/admin/os/primitives";
import { OperationsBoard } from "@/components/admin/operations-board";

export const metadata: Metadata = { title: "Opérations livraison" };
export default function OperationsPage() { return <div className="space-y-5"><SectionHead eyebrow="Fulfilment" title="Operations and delivery board" sub="New board for courier assignment, packing scan mode, failed delivery workflow, pickup readiness, proof upload and partial shipment follow-up." /><OperationsBoard /></div>; }
