"use client";

import { useMemo, useState } from "react";
import { INGREDIENT_ENTRIES, findIngredientMatches, type IngredientEntry } from "@/lib/next-feature-data";
import { Badge, Field } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const SAMPLE = "Aqua, Glycerin, Niacinamide, Zinc PCA, Salicylic Acid, Sodium Hyaluronate, Parfum, Linalool";

function flagLabel(flag: IngredientEntry["flags"][number]) {
  switch (flag) {
    case "pregnancy": return "caution grossesse";
    case "sun": return "SPF conseillé";
    case "acne": return "imperfections";
    case "allergen": return "allergène parfum";
    default: return "peau sensible";
  }
}

export function IngredientChecker() {
  const [text, setText] = useState(SAMPLE);
  const matches = useMemo(() => findIngredientMatches(text), [text]);
  const flags = [...new Set(matches.flatMap((m) => m.flags))];
  const risk = flags.includes("pregnancy") || flags.includes("sun") ? "warning" : flags.includes("allergen") ? "error" : matches.length ? "success" : "neutral";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="border border-line/70 bg-porcelain p-5">
        <Field label="Liste INCI" hint="Collez la formule complète, ou testez l'exemple fourni.">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={12}
            className="w-full border border-line bg-canvas px-4 py-3 text-[14px] leading-relaxed text-carbon outline-none transition-colors focus:border-iodine-deep"
          />
        </Field>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-outline min-h-10" onClick={() => setText(SAMPLE)}>
            Exemple
          </button>
          <button type="button" className="btn-ghost min-h-10" onClick={() => setText("")}>
            Effacer
          </button>
        </div>
      </div>

      <div className="border border-line/70 bg-canvas p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="kicker-xs text-faint">Lecture formule</p>
            <h2 className="mt-2 font-ant uppercase text-[1.7rem] leading-tight text-carbon">
              {matches.length ? `${matches.length} signaux détectés` : "Aucun actif connu détecté"}
            </h2>
          </div>
          <Badge tone={risk === "warning" ? "warning" : risk === "error" ? "error" : risk === "success" ? "success" : "neutral"}>
            {risk === "warning" ? "à vérifier" : risk === "error" ? "sensible" : risk === "success" ? "lisible" : "neutre"}
          </Badge>
        </div>

        {flags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {flags.map((flag) => (
              <Badge key={flag} tone={flag === "pregnancy" || flag === "sun" ? "warning" : flag === "allergen" ? "error" : "accent"}>
                {flagLabel(flag)}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {matches.map((match) => (
            <article key={match.slug} className="border border-line/60 bg-porcelain p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-ant uppercase text-[1.25rem] text-carbon">{match.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{match.family}</span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{match.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="kicker-xs mb-2 text-faint">Intérêt</p>
                  <ul className="space-y-1 text-[12.5px] text-carbon">
                    {match.benefits.map((benefit) => <li key={benefit}>• {benefit}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="kicker-xs mb-2 text-faint">À surveiller</p>
                  <ul className="space-y-1 text-[12.5px] text-muted">
                    {match.cautions.map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-faint">
          Cette lecture repère des signaux de formule. Elle ne remplace pas un avis médical ou pharmaceutique.
        </p>
      </div>
    </div>
  );
}

export function IngredientDictionary({ entries = INGREDIENT_ENTRIES }: { entries?: IngredientEntry[] }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const families = ["all", ...new Set(entries.map((entry) => entry.family))];
  const needle = query.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    const okFamily = family === "all" || entry.family === family;
    const hay = [entry.name, entry.family, entry.summary, ...entry.aliases, ...entry.benefits].join(" ").toLowerCase();
    return okFamily && (!needle || hay.includes(needle));
  });

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Chercher niacinamide, parfum, SPF..."
          className="min-h-12 border border-line bg-canvas px-4 text-[14px] text-carbon outline-none focus:border-iodine-deep"
        />
        <select
          value={family}
          onChange={(event) => setFamily(event.target.value)}
          className="min-h-12 border border-line bg-canvas px-4 text-[13px] text-carbon outline-none focus:border-iodine-deep"
        >
          {families.map((item) => <option key={item} value={item}>{item === "all" ? "Toutes les familles" : item}</option>)}
        </select>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry) => (
          <article key={entry.slug} className="border border-line/70 bg-porcelain p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker-xs text-faint">{entry.family}</p>
                <h2 className="mt-2 font-ant uppercase text-[1.35rem] leading-tight text-carbon">{entry.name}</h2>
              </div>
              {entry.flags.length > 0 && <Badge tone={entry.flags.includes("pregnancy") ? "warning" : "accent"}>{entry.flags.length} signal</Badge>}
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{entry.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {entry.aliases.slice(0, 4).map((alias) => (
                <span key={alias} className="bg-canvas-2 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-faint">{alias}</span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.flags.map((flag) => (
                <Badge key={flag} tone={flag === "pregnancy" || flag === "sun" ? "warning" : flag === "allergen" ? "error" : "neutral"} className={cn("text-[8px]")}>{flagLabel(flag)}</Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
