import type { Metadata } from "next";
import { SectionHead, Metric, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Questions et votes" };

const QUESTIONS = [
  { id: "Q-381", product: "Sérum niacinamide", text: "Compatible avec vitamine C le matin ?", votes: 42, status: "à répondre" },
  { id: "Q-382", product: "SPF invisible", text: "Laisse-t-il un film blanc ?", votes: 31, status: "publié" },
  { id: "Q-383", product: "Crème barrière", text: "Convient aux peaux atopiques ?", votes: 26, status: "pharmacien" },
];

export default function QuestionsVotesPage() {
  return (
    <div className="space-y-5">
      <SectionHead eyebrow="Community" title="Questions produit et votes utiles" sub="Priorisez les réponses par votes, statut et sensibilité conseil." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Questions" value={QUESTIONS.length} />
        <Metric label="Votes" value={QUESTIONS.reduce((sum, q) => sum + q.votes, 0)} />
        <Metric label="À répondre" value={QUESTIONS.filter((q) => q.status !== "publié").length} tone="warn" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {QUESTIONS.map((q) => (
          <Sheet key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="os-label text-os-gold">{q.id}</p>
              <Tag tone={q.status === "publié" ? "good" : q.status === "pharmacien" ? "warn" : "neutral"}>{q.status}</Tag>
            </div>
            <h2 className="mt-3 text-[14px] font-medium text-os-text">{q.text}</h2>
            <p className="mt-2 text-[12px] text-os-muted">{q.product}</p>
            <p className="os-num mt-5 text-[1.6rem] text-os-text">{q.votes}<span className="ml-1 text-[12px] text-os-muted">votes</span></p>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
