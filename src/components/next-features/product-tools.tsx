"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/primitives";
import { formatDTShort } from "@/lib/money";
import { normaliseText } from "@/lib/next-feature-data";

export type ToolProduct = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  categoryName: string | null;
  priceMillimes: number;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  ingredients: string | null;
  shortDescription: string | null;
  keyActives: string[];
  texture: string | null;
  volume: string | null;
};

function tokens(value: string | null | undefined) {
  return new Set(
    normaliseText(value ?? "")
      .split(/[^a-z0-9]+/i)
      .filter((part) => part.length > 3),
  );
}

function overlap(a: Set<string>, b: Set<string>) {
  let n = 0;
  for (const item of a) if (b.has(item)) n += 1;
  return n;
}

export function DupeFinder({ products }: { products: ToolProduct[] }) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? 0);
  const [mode, setMode] = useState<"cheaper" | "similar" | "available">("cheaper");
  const selected = products.find((product) => product.id === selectedId) ?? products[0];
  const rows = useMemo(() => {
    if (!selected) return [];
    const baseIngredients = tokens([selected.ingredients, ...selected.keyActives].join(" "));
    return products
      .filter((product) => product.id !== selected.id)
      .map((product) => {
        const ingredientScore = overlap(baseIngredients, tokens([product.ingredients, ...product.keyActives].join(" ")));
        const categoryScore = product.categoryName && selected.categoryName && product.categoryName === selected.categoryName ? 3 : 0;
        const textureScore = product.texture && selected.texture && product.texture === selected.texture ? 1 : 0;
        const priceDelta = product.priceMillimes - selected.priceMillimes;
        const score = ingredientScore * 5 + categoryScore + textureScore + (product.stock > 0 ? 1 : 0) - Math.max(0, priceDelta / 10_000);
        return { product, score, ingredientScore, priceDelta };
      })
      .filter((row) => row.score > 0)
      .filter((row) => (mode === "cheaper" ? row.priceDelta < 0 : mode === "available" ? row.product.stock > 0 : true))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [mode, products, selected]);

  if (!selected) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Référence source</p>
        <select
          value={selected.id}
          onChange={(event) => setSelectedId(Number(event.target.value))}
          className="mt-3 min-h-12 w-full border border-line bg-canvas px-4 text-[13px] text-carbon outline-none focus:border-iodine-deep"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.brandName ? `${product.brandName} — ${product.name}` : product.name}</option>
          ))}
        </select>
        <div className="mt-5 border border-line/60 bg-canvas p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{selected.brandName}</p>
          <h2 className="mt-1 font-ant uppercase text-[1.45rem] leading-tight text-carbon">{selected.name}</h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{selected.shortDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="ink">{formatDTShort(selected.priceMillimes)}</Badge>
            {selected.categoryName && <Badge>{selected.categoryName}</Badge>}
            {selected.stock > 0 ? <Badge tone="success">en stock</Badge> : <Badge tone="warning">épuisé</Badge>}
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {[
            ["cheaper", "Moins cher"],
            ["similar", "Le plus proche"],
            ["available", "Disponible"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key as typeof mode)}
              className={mode === key ? "btn-solid justify-center" : "btn-outline justify-center"}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(({ product, ingredientScore, priceDelta }, index) => (
          <article key={product.id} className="grid gap-4 border border-line/70 bg-canvas p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="font-ant text-[1.8rem] text-iodine-deep">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{product.brandName}</p>
              <Link href={`/produit/${product.slug}`} className="mt-1 block font-ant uppercase text-[1.2rem] leading-tight text-carbon hover:text-iodine-deep">
                {product.name}
              </Link>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{ingredientScore} ingrédients ou actifs proches · {product.categoryName ?? "rayon non classé"}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-ant text-[1.25rem] text-carbon">{formatDTShort(product.priceMillimes)}</p>
              <Badge tone={priceDelta < 0 ? "success" : "neutral"}>{priceDelta < 0 ? `${formatDTShort(Math.abs(priceDelta))} moins cher` : "prix supérieur"}</Badge>
            </div>
          </article>
        ))}
        {rows.length === 0 && <p className="border border-dashed border-line p-6 text-[13px] text-muted">Aucun dupe assez proche avec ce filtre.</p>}
      </div>
    </div>
  );
}

const PRODUCT_TYPES = ["Nettoyant", "Sérum", "Crème", "SPF", "Shampooing", "Baume"];
const NEEDS = ["imperfections", "taches", "hydratation", "rougeurs", "anti-age", "solaire", "sécheresse"];

export function ProductFinderWizard({ products }: { products: ToolProduct[] }) {
  const [type, setType] = useState(PRODUCT_TYPES[0]);
  const [need, setNeed] = useState(NEEDS[0]);
  const [budget, setBudget] = useState("all");
  const results = useMemo(() => {
    const t = normaliseText(type);
    const n = normaliseText(need);
    const max = budget === "low" ? 30_000 : budget === "mid" ? 70_000 : Number.POSITIVE_INFINITY;
    return products
      .map((product) => {
        const hay = normaliseText([product.name, product.categoryName, product.shortDescription, product.ingredients, product.texture, ...product.keyActives].join(" "));
        const typeHit = hay.includes(t) || (t === "spf" && hay.includes("solaire"));
        const needHit = hay.includes(n) || (n === "anti-age" && (hay.includes("retinol") || hay.includes("hyaluron")));
        const score = (typeHit ? 4 : 0) + (needHit ? 5 : 0) + (product.stock > 0 ? 1 : 0) + product.ratingAvg / 500;
        return { product, score };
      })
      .filter((row) => row.score >= 4 && row.product.priceMillimes <= max)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [budget, need, products, type]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Assistant de choix</p>
        <h2 className="mt-2 font-ant uppercase text-[1.6rem] text-carbon">Un produit, pas une routine</h2>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Type</span>
            <select value={type} onChange={(event) => setType(event.target.value)} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
              {PRODUCT_TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Besoin</span>
            <select value={need} onChange={(event) => setNeed(event.target.value)} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
              {NEEDS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-faint">Budget</span>
            <select value={budget} onChange={(event) => setBudget(event.target.value)} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
              <option value="all">Ouvert</option>
              <option value="low">Moins de 30 DT</option>
              <option value="mid">Moins de 70 DT</option>
            </select>
          </label>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map(({ product }) => (
          <article key={product.id} className="border border-line/70 bg-canvas p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{product.brandName}</p>
            <Link href={`/produit/${product.slug}`} className="mt-1 block font-ant uppercase text-[1.2rem] leading-tight text-carbon hover:text-iodine-deep">
              {product.name}
            </Link>
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{product.shortDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="ink">{formatDTShort(product.priceMillimes)}</Badge>
              {product.stock > 0 ? <Badge tone="success">stock {product.stock}</Badge> : <Badge tone="warning">épuisé</Badge>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
