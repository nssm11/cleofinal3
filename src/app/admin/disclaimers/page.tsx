import type { Metadata } from "next";
import { SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Disclaimers médicaux" };

const RULES = [
  { id: "MED-RET", label: "Rétinoïdes", trigger: "retinol, retinal, retinyl", warning: "Caution grossesse/allaitement", status: "active" },
  { id: "AGE-BPO", label: "Peroxyde de benzoyle", trigger: "benzoyl peroxide", warning: "Âge minimal et conseil", status: "active" },
  { id: "SUN-AHA", label: "AHA / BHA", trigger: "glycolic, salicylic", warning: "SPF conseillé", status: "review" },
  { id: "ALL-PAR", label: "Allergènes parfumants", trigger: "linalool, limonene, citral", warning: "Peau sensible", status: "active" },
];

export default function DisclaimersPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Safety" title="Gestionnaire de disclaimers" sub="Règles de précaution par ingrédient ou catégorie : médical, âge, grossesse, allergènes et soleil." />
      <div className="grid gap-4 md:grid-cols-2">
        {RULES.map((rule) => (
          <Sheet key={rule.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="os-label text-os-muted">{rule.id}</p>
                <h2 className="mt-1 text-[15px] font-medium text-os-text">{rule.label}</h2>
              </div>
              <Tag tone={rule.status === "active" ? "good" : "warn"}>{rule.status}</Tag>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-os-muted">Déclencheur : {rule.trigger}</p>
            <p className="mt-2 text-[13px] text-os-text">{rule.warning}</p>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
