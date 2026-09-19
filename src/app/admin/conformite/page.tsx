import type { Metadata } from "next";
import { SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Conformité" };
const rows = [
  ["Recall manager", "Affected lots, notification queue, public archive", "ready"],
  ["Medical disclaimers", "Category/product disclaimers and review queue", "ready"],
  ["Age restrictions", "Minimum age display and rules", "ready"],
  ["Pregnancy warnings", "Caution block and staff review", "ready"],
  ["Consent log", "Cookie, email, terms acceptance history", "ready"],
  ["Data requests", "Export and deletion queue", "ready"],
];
export default function CompliancePage() { return <div className="space-y-5"><SectionHead eyebrow="Trust" title="Safety, recall and compliance centre" sub="New compliance module collecting medical disclaimers, age warnings, pregnancy warnings, recall notices, consent logs and data-rights queues." /><Sheet><div className="grid gap-px bg-os-line md:grid-cols-2 xl:grid-cols-3">{rows.map(([name, text, status]) => <article key={name} className="bg-os-surface p-4"><div className="flex items-start justify-between gap-3"><h2 className="text-lg text-os-text">{name}</h2><Tag tone="good">{status}</Tag></div><p className="mt-3 text-sm text-os-muted">{text}</p></article>)}</div></Sheet></div>; }
