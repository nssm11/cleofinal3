import type { Metadata } from "next";
import { SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Landing pages" };

const PAGES = [
  { slug: "spf-invisible", title: "SPF invisible", blocks: 7, status: "draft", owner: "Marketing" },
  { slug: "barriere-hiver", title: "Barrière hiver", blocks: 6, status: "scheduled", owner: "Contenu" },
  { slug: "anti-taches", title: "Anti-taches", blocks: 8, status: "published", owner: "Pharmacie" },
];

export default function LandingPagesPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Growth" title="Landing page builder" sub="Hero, sections produits, FAQ, preuve, CTA et métadonnées UTM par page campagne." />
      <div className="grid gap-4 lg:grid-cols-3">
        {PAGES.map((page) => (
          <Sheet key={page.slug}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="os-label text-os-muted">/{page.slug}</p>
                <h2 className="mt-1 text-[15px] font-medium text-os-text">{page.title}</h2>
              </div>
              <Tag tone={page.status === "published" ? "good" : page.status === "scheduled" ? "warn" : "neutral"}>{page.status}</Tag>
            </div>
            <dl className="mt-5 grid gap-2 text-[12px] text-os-muted">
              <div className="flex justify-between border-b border-os-line-soft pb-2"><dt>Blocs</dt><dd>{page.blocks}</dd></div>
              <div className="flex justify-between border-b border-os-line-soft pb-2"><dt>Owner</dt><dd>{page.owner}</dd></div>
              <div className="flex justify-between"><dt>UTM</dt><dd>auto</dd></div>
            </dl>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
