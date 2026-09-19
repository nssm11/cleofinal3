"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductCard } from "@/lib/catalog";
import { CONCERN_LANDING_GROUPS, ROUTINE_STEP_FILTERS, SKIN_TYPE_FILTERS } from "@/lib/shopping-taxonomy";
import { EditorialProductCard } from "@/components/catalog/editorial-product-card";

function scoreProduct(product: ProductCard, concern: string, skin: string, step: string) {
  const hay = `${product.name} ${product.shortDescription ?? ""} ${product.brandName ?? ""}`.toLowerCase();
  let score = product.ratingAvg / 100 + Math.min(5, product.ratingCount / 20);
  const concernWords = concern.split(/[-\s]+/);
  const stepDef = ROUTINE_STEP_FILTERS.find((entry) => entry.slug === step);
  const skinDef = SKIN_TYPE_FILTERS.find((entry) => entry.slug === skin);
  for (const word of concernWords) if (word.length > 2 && hay.includes(word)) score += 6;
  for (const term of stepDef?.terms ?? []) if (hay.includes(term.toLowerCase())) score += 5;
  for (const slug of skinDef?.concerns ?? []) if (hay.includes(slug.replace(/-/g, " "))) score += 3;
  if (product.isCounterPick) score += 3;
  if (product.stock > 0) score += 2;
  return score;
}

export function RecommendationQuiz({ products }: { products: ProductCard[] }) {
  const [concern, setConcern] = useState<string>(CONCERN_LANDING_GROUPS[0].slug);
  const [skin, setSkin] = useState<string>(SKIN_TYPE_FILTERS[2].slug);
  const [step, setStep] = useState<string>(ROUTINE_STEP_FILTERS[0].slug);
  const [budget, setBudget] = useState("100000");

  const selectedConcern = CONCERN_LANDING_GROUPS.find((entry) => entry.slug === concern) ?? CONCERN_LANDING_GROUPS[0];
  const selectedSkin = SKIN_TYPE_FILTERS.find((entry) => entry.slug === skin) ?? SKIN_TYPE_FILTERS[0];
  const selectedStep = ROUTINE_STEP_FILTERS.find((entry) => entry.slug === step) ?? ROUTINE_STEP_FILTERS[0];

  const picks = useMemo(() => {
    const max = Number(budget);
    return products
      .filter((product) => product.priceMillimes <= max && product.stock > 0)
      .map((product) => ({ product, score: scoreProduct(product, selectedConcern.query, skin, step) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.product);
  }, [budget, products, selectedConcern.query, skin, step]);

  const resultHref = `/quiz/result?concern=${encodeURIComponent(selectedConcern.slug)}&skin=${encodeURIComponent(skin)}&step=${encodeURIComponent(step)}&max=${budget}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.4fr_1fr]">
      <aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start">
        <p className="kicker-xs text-muted">Quiz</p>
        <Choice title="Besoin" value={concern} onChange={setConcern} items={CONCERN_LANDING_GROUPS.map((entry) => ({ value: entry.slug, label: entry.fr }))} />
        <Choice title="Type de peau" value={skin} onChange={setSkin} items={SKIN_TYPE_FILTERS.map((entry) => ({ value: entry.slug, label: entry.fr }))} />
        <Choice title="Étape" value={step} onChange={setStep} items={ROUTINE_STEP_FILTERS.map((entry) => ({ value: entry.slug, label: entry.fr }))} />
        <Choice title="Budget" value={budget} onChange={setBudget} items={[{ value: "30000", label: "Sous 30 DT" }, { value: "50000", label: "Sous 50 DT" }, { value: "100000", label: "Sous 100 DT" }, { value: "999000", label: "Ouvert" }]} />
        <Link href={resultHref} className="btn-solid mt-7 w-full justify-center">Voir la recommandation complète</Link>
      </aside>

      <section>
        <div className="border border-line bg-porcelain p-6">
          <p className="kicker-xs text-muted">Recommandation style dermatologue</p>
          <h2 className="mt-3 font-ant text-[2rem] uppercase leading-none text-carbon">{selectedConcern.fr} · {selectedSkin.fr} · {selectedStep.fr}</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            Objectif : une routine courte, testée étape par étape. Introduisez un seul actif fort à la fois, gardez le SPF le matin, et suspendez tout produit qui pique durablement.
          </p>
        </div>
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((product) => <EditorialProductCard key={product.id} p={product} />)}
        </div>
      </section>
    </div>
  );
}

function Choice({ title, value, onChange, items }: { title: string; value: string; onChange: (value: string) => void; items: { value: string; label: string }[] }) {
  return (
    <fieldset className="mt-5 border-t border-line pt-5">
      <legend className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{title}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item.value} type="button" onClick={() => onChange(item.value)} className={value === item.value ? "rounded-full bg-carbon px-3 py-2 text-[12px] text-canvas" : "rounded-full border border-line px-3 py-2 text-[12px] text-muted hover:border-iodine hover:text-carbon"}>
            {item.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
