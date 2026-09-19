import type { Metadata } from "next";
import { FeatureHero, MetricStrip } from "@/components/next-features/public-shell";
import { Badge } from "@/components/ui/primitives";
import { RECALL_NOTICES } from "@/lib/next-feature-data";

export const metadata: Metadata = {
  title: "Rappels et sécurité",
  description: "Centre public des rappels, notices de sécurité et cautions produit.",
};

export default function RappelsPage() {
  return (
    <div>
      <FeatureHero
        eyebrow="Sécurité"
        title="Notices de rappel et cautions"
        description="Un centre public pour consulter les alertes, suivre les lots à vérifier et comprendre les actions conseillées."
      />
      <section className="shell-wide space-y-8 py-14 lg:py-20">
        <MetricStrip items={[{ label: "Notices", value: RECALL_NOTICES.length }, { label: "Urgentes", value: RECALL_NOTICES.filter((notice) => notice.severity === "urgent").length }, { label: "Surveillance", value: RECALL_NOTICES.filter((notice) => notice.severity === "watch").length }, { label: "Canal", value: "public" }]} />
        <div className="space-y-4">
          {RECALL_NOTICES.map((notice) => (
            <article key={notice.id} className="border border-line/70 bg-porcelain p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="kicker-xs text-faint">{notice.id} · {new Date(notice.publishedAt).toLocaleDateString("fr-FR")}</p>
                  <h2 className="mt-2 font-ant uppercase text-[1.45rem] leading-tight text-carbon">{notice.title}</h2>
                </div>
                <Badge tone={notice.severity === "urgent" ? "error" : notice.severity === "watch" ? "warning" : "accent"}>{notice.severity}</Badge>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{notice.body}</p>
              <p className="mt-3 text-[13px] text-carbon">Action : {notice.action}</p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Périmètre : {notice.scope}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
