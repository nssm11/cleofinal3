"use client";

import { useMemo, useState } from "react";

type Question = { id: string; product: string; question: string; answer: string; status: "answered" | "pending"; tag: string };
const SEED: Question[] = [
  { id: "q-001", product: "SPF visage", question: "Peut-on remettre le SPF au-dessus du maquillage ?", answer: "Oui, idéalement avec une texture fluide ou un spray adapté. La quantité reste le point important.", status: "answered", tag: "SPF" },
  { id: "q-002", product: "Gel nettoyant", question: "Un nettoyant qui mousse est-il toujours décapant ?", answer: "Non. Regardez surtout la tolérance, la fréquence et la sensation après rinçage.", status: "answered", tag: "Nettoyage" },
  { id: "q-003", product: "Produit inconnu", question: "Pouvez-vous identifier ce produit à partir d'un code ?", answer: "En attente de vérification par l'équipe.", status: "pending", tag: "Identification" },
];

export function ProductQuestions() {
  const [items, setItems] = useState<Question[]>(SEED);
  const [product, setProduct] = useState("");
  const [question, setQuestion] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");

  const tags = ["all", ...Array.from(new Set(items.map((x) => x.tag)))];
  const filtered = useMemo(() => items.filter((item) => {
    const hay = `${item.product} ${item.question} ${item.answer} ${item.tag}`.toLowerCase();
    return (tag === "all" || item.tag === tag) && (!query || hay.includes(query.toLowerCase()));
  }), [items, query, tag]);

  const submit = () => {
    if (!question.trim()) return;
    setItems((current) => [{ id: `q-${Date.now()}`, product: product || "Produit à préciser", question, answer: "Votre question est enregistrée localement pour cette démonstration. L'équipe peut la reprendre dans l'admin Q&A.", status: "pending", tag: "Nouveau" }, ...current]);
    setProduct("");
    setQuestion("");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.38fr_1fr]">
      <aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start">
        <p className="kicker-xs text-muted">Ask product team</p>
        <h2 className="mt-3 font-ant text-[2rem] uppercase leading-none text-carbon">Nouvelle question</h2>
        <label className="mt-5 block"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Produit ou code</span><input value={product} onChange={(e) => setProduct(e.target.value)} className="mt-2 w-full border border-line bg-porcelain p-3 outline-none focus:border-iodine" /></label>
        <label className="mt-4 block"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Question</span><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} className="mt-2 w-full border border-line bg-porcelain p-3 outline-none focus:border-iodine" /></label>
        <button type="button" onClick={submit} className="btn-solid mt-5 w-full justify-center">Submit question</button>
      </aside>
      <section>
        <div className="flex flex-wrap gap-3 border border-line bg-canvas p-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search answers" className="min-w-60 flex-1 border border-line bg-porcelain p-3 text-[14px] outline-none focus:border-iodine" />
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="border border-line bg-canvas p-3 text-[14px]"><option value="all">All tags</option>{tags.filter((x) => x !== "all").map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <div className="mt-6 grid gap-px bg-line">
          {filtered.map((item) => <article key={item.id} className="bg-canvas p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="kicker-xs text-faint">{item.product} · {item.tag}</p><h3 className="mt-2 font-ant text-[1.5rem] uppercase leading-none text-carbon">{item.question}</h3></div><span className={item.status === "answered" ? "badge-success" : "badge-warning"}>{item.status}</span></div><p className="mt-4 text-[14px] leading-relaxed text-muted">{item.answer}</p></article>)}
        </div>
      </section>
    </div>
  );
}
