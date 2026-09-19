import type { ReactNode } from "react";
import Link from "next/link";
import type { ProductCard } from "@/lib/catalog";
import { formatDT } from "@/lib/money";

type IntelligenceProduct = {
  slug: string;
  name: string;
  shortDescription: string | null;
  priceMillimes: number;
  brandName?: string | null;
};

type ProductIntelligenceProps = {
  product: {
    name: string;
    description: string | null;
    ingredients: string | null;
    howToUse: string | null;
    texture: string | null;
    forWhom: string | null;
    audience: string | null;
    precautions: string | null;
    useWhen: string | null;
    useAmount: string | null;
    useOrder: string | null;
    keyActives: string[];
    allergens: string[];
    paoMonths: number | null;
    ageMinMonths: number | null;
    tolerances: Partial<Record<"sansParfum" | "grossesse" | "peauAtopique" | "yeuxSensibles", boolean>> | null;
  };
  pairs: IntelligenceProduct[];
  substitutes: ProductCard[];
};

function detectFinish(texture: string | null, name: string) {
  const text = `${texture ?? ""} ${name}`.toLowerCase();
  if (/mat|nude/.test(text)) return "Matte";
  if (/fluide|invisible|fusion/.test(text)) return "Invisible";
  if (/baume|riche|nourrissant/.test(text)) return "Rich";
  if (/vitamine|éclat|boost|glow/.test(text)) return "Glowy";
  return "Comfort finish";
}

function compatibility(product: ProductIntelligenceProps["product"]) {
  let score = 72;
  if (product.tolerances?.sansParfum) score += 6;
  if (product.tolerances?.peauAtopique) score += 6;
  if (product.tolerances?.yeuxSensibles) score += 4;
  if (product.allergens.length === 0 && product.ingredients) score += 4;
  if (product.precautions) score += 3;
  return Math.min(98, score);
}

function avoidList(product: ProductIntelligenceProps["product"]) {
  const text = `${product.name} ${product.ingredients ?? ""} ${product.keyActives.join(" ")}`.toLowerCase();
  const out = [];
  if (/retinol|rétinol|aha|bha|acide/.test(text)) out.push("Avoid stacking with exfoliating acids, retinoids or scrubs on the same evening unless advised.");
  if (/vitamine c|ascorb/.test(text)) out.push("Pair with SPF in the morning; avoid introducing multiple brightening actives at once.");
  if (/spf|solaire/.test(text)) out.push("Do not use as your only protection for a full day of exposure; reapply during prolonged exposure.");
  if (product.allergens.length) out.push("Avoid if you already know you react to the listed fragrance allergens.");
  return out.length ? out : ["Introduce one new product at a time and stop if burning, swelling or persistent irritation appears."];
}

function timeline(product: ProductIntelligenceProps["product"]) {
  if (/spf|solaire/i.test(product.name)) return ["Day 1: apply generously", "Every exposure: reapply", "Ongoing: watch comfort and eye tolerance"];
  if (/anti|âge|vitamine|rétinol|retinol|serum|sérum/i.test(`${product.name} ${product.keyActives.join(" ")}`)) return ["Week 1: two or three nights", "Week 2: increase only if comfortable", "Weeks 4–8: judge tone, texture and tolerance"];
  return ["Day 1: patch test", "Week 1: use as directed", "Week 2: keep only if comfort improves"];
}

function ingredientExplainers(product: ProductIntelligenceProps["product"]) {
  const active = product.keyActives.slice(0, 4).map((name) => ({ name, note: "Key active highlighted by the product sheet." }));
  if (active.length) return active;
  const first = (product.ingredients ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 4);
  return first.map((name) => ({ name, note: /aqua|water/i.test(name) ? "Formula base." : "Ingredient listed on pack; check with the pharmacist if you are sensitive." }));
}

export function ProductIntelligence({ product, pairs, substitutes }: ProductIntelligenceProps) {
  const finish = detectFinish(product.texture, product.name);
  const score = compatibility(product);
  const avoid = avoidList(product);
  const steps = timeline(product);
  const explainers = ingredientExplainers(product);
  const frequency = product.useWhen ?? (/spf|solaire/i.test(product.name) ? "Morning and reapplication" : "As directed on pack");
  const order = product.useOrder ?? (product.howToUse ? "Follow the application instructions above" : "After cleansing, before richer creams when relevant");

  return (
    <section className="shell-wide py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="kicker mb-8">Product intelligence</p>
            <h2 className="font-ant text-[clamp(2.4rem,4vw,4rem)] uppercase leading-none text-carbon">Why this fits</h2>
            <p className="mt-5 text-[14px] leading-relaxed text-muted">Pharmacist-style reading of the formula, tolerance, routine order, pairings and warnings.</p>
          </div>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <div className="grid gap-px bg-line md:grid-cols-3">
            <Metric label="Compatibility" value={`${score}/100`} />
            <Metric label="Texture" value={product.texture ?? "Not stated"} />
            <Metric label="Finish" value={finish} />
          </div>

          <div className="mt-8 grid gap-px bg-line md:grid-cols-2">
            <Panel title="Why we recommend it">
              {product.description ?? product.audience ?? "A clear product sheet, visible stock and routine guidance make it easy to evaluate before buying."}
            </Panel>
            <Panel title="Who should avoid this">
              <ul className="space-y-2">{avoid.map((line) => <li key={line}>• {line}</li>)}</ul>
            </Panel>
            <Panel title="Usage frequency">
              {frequency}{product.useAmount ? ` · ${product.useAmount}` : ""}
            </Panel>
            <Panel title="Layering order">
              {order}
            </Panel>
          </div>

          <div className="mt-8 grid gap-px bg-line md:grid-cols-2">
            <Panel title="Ingredient explanations">
              <ul className="space-y-3">
                {explainers.map((entry) => <li key={entry.name}><strong className="text-carbon">{entry.name}</strong><br /><span>{entry.note}</span></li>)}
              </ul>
            </Panel>
            <Panel title="Before / after timeline">
              <ol className="space-y-3">
                {steps.map((step, i) => <li key={step}><span className="text-iodine">{String(i + 1).padStart(2, "0")}</span> {step}</li>)}
              </ol>
            </Panel>
          </div>

          <div className="mt-8 grid gap-px bg-line md:grid-cols-3">
            <Panel title="Allergy badges">{product.allergens.length ? product.allergens.join(", ") : "No fragrance allergen detected in the stored formula."}</Panel>
            <Panel title="Comedogenic risk">{/(oil|beurre|butter|rich|baume)/i.test(`${product.texture ?? ""} ${product.name}`) ? "Medium: patch test if acne-prone." : "Low to moderate: monitor congestion."}</Panel>
            <Panel title="PAO / age / pH">{[product.paoMonths ? `${product.paoMonths}M after opening` : null, product.ageMinMonths ? `From ${product.ageMinMonths} months` : "No stated age limit", "pH: shown when declared by brand"].filter(Boolean).join(" · ")}</Panel>
          </div>

          {(pairs.length > 0 || substitutes.length > 0) && (
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {pairs.length > 0 && <Related title="Pairs well with" items={pairs.slice(0, 3)} />}
              {substitutes.length > 0 && <Related title="If unavailable, consider" items={substitutes.slice(0, 3)} />}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-canvas p-5"><p className="kicker-xs text-muted">{label}</p><p className="mt-3 font-ant text-[1.8rem] uppercase leading-none text-carbon">{value}</p></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <article className="bg-canvas p-5 text-[13.5px] leading-relaxed text-muted"><h3 className="mb-3 font-ant text-[1.35rem] uppercase leading-none text-carbon">{title}</h3>{children}</article>;
}

function Related({ title, items }: { title: string; items: IntelligenceProduct[] }) {
  return <div><p className="kicker-xs mb-4 text-muted">{title}</p><div className="space-y-3">{items.map((item) => <Link key={item.slug} href={`/produit/${item.slug}`} className="block border border-line p-4 transition-colors hover:border-iodine"><span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{item.brandName}</span><span className="mt-1 block text-[14px] text-carbon">{item.name}</span><span className="mt-1 block text-[12px] text-muted">{formatDT(item.priceMillimes)}</span></Link>)}</div></div>;
}
