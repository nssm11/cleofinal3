"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductCard } from "@/lib/catalog";
import { formatDT } from "@/lib/money";

const skinTypes = ["Sensible", "Grasse", "Sèche", "Mixte", "Mature"];
const concerns = ["Imperfections", "Hydratation", "Taches", "Anti-âge", "Protection solaire", "Barrière abîmée", "Cuir chevelu"];
const goals = ["Routine courte", "Tolérance maximale", "Éclat", "Budget maîtrisé", "Résultat rapide"];

const terms: Record<string, string[]> = {
  Imperfections: ["effaclar", "sebum", "acne", "imperfection", "purifiant", "sébium"],
  Hydratation: ["hydra", "hyaluron", "minéral", "crème", "baume"],
  Taches: ["tache", "pigment", "vitamine", "éclat", "spf"],
  "Anti-âge": ["âge", "lift", "rétinol", "collagène", "vitamine"],
  "Protection solaire": ["spf", "solaire", "anthelios", "photoderm", "vinosun"],
  "Barrière abîmée": ["cica", "baume", "répar", "tolérance", "atopique"],
  "Cuir chevelu": ["shampoo", "cheveux", "cuir", "pellicule"],
};

function matches(product: ProductCard, concern: string) {
  const hay = `${product.name} ${product.shortDescription ?? ""} ${product.brandName ?? ""}`.toLowerCase();
  return (terms[concern] ?? []).some((term) => hay.includes(term.toLowerCase()));
}

function routineCopy(skin: string, concern: string, goal: string) {
  const gentle = skin === "Sensible" || goal === "Tolérance maximale";
  const budget = goal === "Budget maîtrisé";
  return {
    score: Math.min(98, 72 + (gentle ? 8 : 4) + (budget ? 5 : 7) + (concern === "Protection solaire" ? 7 : 4)),
    morning: [
      gentle ? "Nettoyant doux, sans multiplier les mousses" : "Nettoyant adapté au type de peau",
      concern === "Protection solaire" ? "Sérum hydratant léger" : `Actif ciblé : ${concern.toLowerCase()}`,
      skin === "Sèche" ? "Crème barrière riche" : "Hydratant fin et confortable",
      "SPF large spectre chaque matin",
    ],
    evening: [
      "Nettoyage simple, sans friction",
      concern === "Imperfections" ? "Traitement local, pas sur tout le visage si la peau pique" : `Soin du soir orienté ${concern.toLowerCase()}`,
      gentle ? "Baume réparateur les soirs de tiraillement" : "Hydratant ou crème de nuit",
    ],
    warnings: [
      concern === "Imperfections" ? "Ne combinez pas acides exfoliants, rétinoïdes et gommages la même semaine sans avis." : null,
      concern === "Anti-âge" ? "Introduisez les actifs forts un soir sur deux, puis augmentez seulement si la peau reste confortable." : null,
      concern === "Protection solaire" ? "Le SPF se remet si exposition prolongée : une seule application ne couvre pas toute la journée." : null,
      skin === "Sensible" ? "Patch test 48 h derrière l'oreille ou sur la mâchoire avant d'ajouter un nouvel actif." : null,
    ].filter(Boolean) as string[],
  };
}

export function RoutineBuilderClient({ products }: { products: ProductCard[] }) {
  const [skin, setSkin] = useState(skinTypes[0]);
  const [concern, setConcern] = useState(concerns[0]);
  const [goal, setGoal] = useState(goals[0]);
  const [copied, setCopied] = useState(false);

  const routine = useMemo(() => routineCopy(skin, concern, goal), [skin, concern, goal]);
  const picks = useMemo(() => {
    const direct = products.filter((product) => matches(product, concern));
    return (direct.length ? direct : products).slice(0, 4);
  }, [products, concern]);

  const copyRoutine = async () => {
    const text = [
      `Routine ${skin} — ${concern} — ${goal}`,
      `Score: ${routine.score}/100`,
      "Matin:",
      ...routine.morning.map((step, index) => `${index + 1}. ${step}`),
      "Soir:",
      ...routine.evening.map((step, index) => `${index + 1}. ${step}`),
      "Produits:",
      ...picks.map((product) => `- ${product.name}`),
    ].join("\n");
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
      <aside className="border border-line bg-canvas p-5 lg:sticky lg:top-28 lg:self-start">
        <p className="kicker-xs text-muted">Profil</p>
        <div className="mt-5 space-y-5">
          <ChoiceGroup label="Type de peau" value={skin} values={skinTypes} onChange={setSkin} />
          <ChoiceGroup label="Besoin prioritaire" value={concern} values={concerns} onChange={setConcern} />
          <ChoiceGroup label="Objectif" value={goal} values={goals} onChange={setGoal} />
        </div>
        <button type="button" onClick={copyRoutine} className="btn-solid mt-7 w-full justify-center">
          {copied ? "Routine copiée" : "Copier la routine"}
        </button>
        <Link href="/compte/rituels" className="btn-ghost mt-3 w-full justify-center">
          Sauvegarder dans le compte
        </Link>
      </aside>

      <div className="space-y-8">
        <section className="grid gap-px bg-line md:grid-cols-3">
          <Metric label="Score compatibilité" value={`${routine.score}/100`} />
          <Metric label="Durée matin" value="4 gestes" />
          <Metric label="Durée soir" value="3 gestes" />
        </section>

        <section className="grid gap-px bg-line lg:grid-cols-2">
          <RoutineCard title="Matin" steps={routine.morning} />
          <RoutineCard title="Soir" steps={routine.evening} />
        </section>

        <section className="border border-line bg-porcelain p-6">
          <p className="kicker-xs text-muted">Ne pas combiner sans avis</p>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-muted">
            {(routine.warnings.length ? routine.warnings : ["Ajoutez un seul nouveau produit à la fois : c'est le moyen le plus simple de repérer ce qui irrite ou ce qui aide."]).map((warning) => (
              <li key={warning} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-iodine" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker-xs text-muted">Sélection produit</p>
              <h2 className="mt-2 font-ant text-[2.2rem] uppercase leading-none text-carbon">Les 4 fiches à regarder</h2>
            </div>
            <Link href={`/recherche?q=${encodeURIComponent(concern)}`} className="btn-ghost">
              Chercher plus
            </Link>
          </div>
          <div className="mt-6 grid gap-px bg-line md:grid-cols-2">
            {picks.map((product) => (
              <Link key={product.id} href={`/produit/${product.slug}`} className="group bg-canvas p-5 transition-colors hover:bg-iodine/5">
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-faint">{product.brandName}</p>
                <h3 className="mt-2 font-ant text-[1.5rem] uppercase leading-none text-carbon group-hover:text-iodine-deep">{product.name}</h3>
                {product.shortDescription && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{product.shortDescription}</p>}
                <p className="mt-4 text-[14px] tabular-nums text-carbon">{formatDT(product.priceMillimes)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ChoiceGroup({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={value === option ? "rounded-full bg-carbon px-3 py-2 text-[12px] text-canvas" : "rounded-full border border-line px-3 py-2 text-[12px] text-muted transition-colors hover:border-iodine hover:text-carbon"}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas p-6">
      <p className="kicker-xs text-muted">{label}</p>
      <p className="mt-3 font-ant text-[2rem] uppercase leading-none text-carbon">{value}</p>
    </div>
  );
}

function RoutineCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <article className="bg-canvas p-6">
      <p className="kicker-xs text-muted">Routine</p>
      <h2 className="mt-2 font-ant text-[2rem] uppercase leading-none text-carbon">{title}</h2>
      <ol className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[2.5rem_1fr] gap-4 text-[14px] leading-relaxed text-muted">
            <span className="tick text-iodine">{String(index + 1).padStart(2, "0")}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
