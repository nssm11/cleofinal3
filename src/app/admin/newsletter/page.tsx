import type { Metadata } from "next";
import { SectionHead, Metric, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Newsletter centre" };

const SEGMENTS = [
  { label: "Guides d'achat", contacts: 1820, status: "prêt" },
  { label: "Alertes stock", contacts: 640, status: "transactionnel" },
  { label: "Actifs", contacts: 910, status: "brouillon" },
  { label: "Promotions", contacts: 1230, status: "planifié" },
];

export default function AdminNewsletterPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="CRM" title="Newsletter capture centre" sub="Segments d'intérêt, export interne, consentement et planning éditorial sans fournisseur externe obligatoire." />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Segments" value={SEGMENTS.length} />
        <Metric label="Contacts" value={SEGMENTS.reduce((sum, segment) => sum + segment.contacts, 0)} />
        <Metric label="Planifiés" value={SEGMENTS.filter((segment) => segment.status === "planifié").length} />
        <Metric label="Exports" value="CSV" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SEGMENTS.map((segment) => (
          <Sheet key={segment.label}>
            <p className="os-label text-os-muted">Segment</p>
            <h2 className="mt-2 text-[15px] font-medium text-os-text">{segment.label}</h2>
            <p className="os-num mt-4 text-[1.8rem] text-os-text">{segment.contacts}</p>
            <Tag tone={segment.status === "prêt" ? "good" : segment.status === "planifié" ? "warn" : "neutral"}>{segment.status}</Tag>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
