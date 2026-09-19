"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/primitives";
import { formatDTShort } from "@/lib/money";

type MiniProduct = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  priceMillimes: number;
  stock: number;
  volume: string | null;
};

type BrandRow = { id: number; slug: string; name: string; story: string | null; count: number };

type SavedComparison = { id: string; label: string; productIds: number[]; createdAt: string };
const COMPARE_SAVE_KEY = "cleo.saved-comparisons.v1";
const BRANDS_KEY = "cleo.followed-brands.v1";
const SHELF_KEY = "cleo.personal-shelf.v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function SaveComparisonPanel({ productIds, productNames }: { productIds: number[]; productNames: string[] }) {
  const [items, setItems] = useState<SavedComparison[]>([]);
  const [label, setLabel] = useState(productNames.slice(0, 2).join(" vs "));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setItems(readJson<SavedComparison[]>(COMPARE_SAVE_KEY, [])));
    return () => cancelAnimationFrame(frame);
  }, []);

  const save = () => {
    if (productIds.length < 2) return;
    const next = [
      { id: String(Date.now()), label: label.trim() || productNames.slice(0, 2).join(" vs "), productIds, createdAt: new Date().toISOString() },
      ...items.filter((item) => item.productIds.join(",") !== productIds.join(",")),
    ].slice(0, 12);
    setItems(next);
    writeJson(COMPARE_SAVE_KEY, next);
  };

  return (
    <div className="border border-line/70 bg-porcelain p-5">
      <p className="kicker-xs text-faint">Comparaison sauvegardée</p>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="min-h-11 flex-1 border border-line bg-canvas px-3 text-[13px] text-carbon outline-none focus:border-iodine-deep"
          placeholder="Nom de la comparaison"
        />
        <button type="button" onClick={save} className="btn-solid min-h-11" disabled={productIds.length < 2}>
          Sauvegarder
        </button>
      </div>
      {items.length > 0 && <p className="mt-3 text-[12px] text-muted">{items.length} comparaisons dans ce navigateur.</p>}
    </div>
  );
}

export function SavedComparisonsPage({ products }: { products: MiniProduct[] }) {
  const [items, setItems] = useState<SavedComparison[]>([]);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setItems(readJson<SavedComparison[]>(COMPARE_SAVE_KEY, [])));
    return () => cancelAnimationFrame(frame);
  }, []);

  const remove = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    writeJson(COMPARE_SAVE_KEY, next);
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const rows = item.productIds.map((id) => byId.get(id)).filter((product): product is MiniProduct => Boolean(product));
        return (
          <article key={item.id} className="border border-line/70 bg-porcelain p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="kicker-xs text-faint">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                <h2 className="mt-2 font-ant uppercase text-[1.35rem] text-carbon">{item.label}</h2>
              </div>
              <div className="flex gap-2">
                <Link href={`/comparer?p=${item.productIds.join(",")}`} className="btn-outline min-h-10">Ouvrir</Link>
                <button type="button" onClick={() => remove(item.id)} className="btn-ghost min-h-10">Retirer</button>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {rows.map((product) => (
                <li key={product.id} className="border border-line/60 bg-canvas p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{product.brandName}</p>
                  <Link href={`/produit/${product.slug}`} className="mt-1 block text-[13px] font-medium text-carbon hover:text-iodine-deep">{product.name}</Link>
                  <p className="mt-2 text-[12px] tabular-nums text-muted">{formatDTShort(product.priceMillimes)}</p>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
      {items.length === 0 && <p className="border border-dashed border-line p-8 text-[13px] text-muted">Aucune comparaison sauvegardée sur ce navigateur.</p>}
    </div>
  );
}

export function FavoriteBrandsPage({ brands }: { brands: BrandRow[] }) {
  const [followed, setFollowed] = useState<number[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFollowed(readJson<number[]>(BRANDS_KEY, [])));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = (id: number) => {
    const next = followed.includes(id) ? followed.filter((item) => item !== id) : [...followed, id];
    setFollowed(next);
    writeJson(BRANDS_KEY, next);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {brands.map((brand) => {
        const on = followed.includes(brand.id);
        return (
          <article key={brand.id} className="border border-line/70 bg-porcelain p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker-xs text-faint">{brand.count} références</p>
                <h2 className="mt-2 font-ant uppercase text-[1.35rem] text-carbon">{brand.name}</h2>
              </div>
              {on && <Badge tone="success">suivie</Badge>}
            </div>
            <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-muted">{brand.story ?? "Laboratoire présent dans le catalogue."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => toggle(brand.id)} className={on ? "btn-solid min-h-10" : "btn-outline min-h-10"}>{on ? "Suivie" : "Suivre"}</button>
              <Link href={`/marque/${brand.slug}`} className="btn-ghost min-h-10">Voir</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function RecentlyViewedAccount({ products }: { products: MiniProduct[] }) {
  const cart = useCart();
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const rows = cart.recentlyViewed.map((id) => byId.get(id)).filter((product): product is MiniProduct => Boolean(product));
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((product) => (
        <article key={product.id} className="border border-line/70 bg-porcelain p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{product.brandName}</p>
          <Link href={`/produit/${product.slug}`} className="mt-1 block font-ant uppercase text-[1.25rem] leading-tight text-carbon hover:text-iodine-deep">{product.name}</Link>
          <p className="mt-3 text-[13px] text-muted">{formatDTShort(product.priceMillimes)} · {product.stock > 0 ? `${product.stock} en stock` : "épuisé"}</p>
        </article>
      ))}
      {rows.length === 0 && <p className="border border-dashed border-line p-8 text-[13px] text-muted">Les fiches consultées apparaîtront ici.</p>}
    </div>
  );
}

type ShelfItem = { id: string; productId: number; openedAt: string; note: string; expiresAt: string };

export function PersonalShelf({ products }: { products: MiniProduct[] }) {
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [now, setNow] = useState(0);
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setItems(readJson<ShelfItem[]>(SHELF_KEY, []));
      setNow(Date.now());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const add = () => {
    const opened = new Date(openedAt);
    const expires = new Date(opened);
    expires.setMonth(expires.getMonth() + 6);
    const next = [{ id: String(Date.now()), productId, openedAt, note, expiresAt: expires.toISOString().slice(0, 10) }, ...items].slice(0, 24);
    setItems(next);
    writeJson(SHELF_KEY, next);
    setNote("");
  };
  const remove = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    writeJson(SHELF_KEY, next);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="border border-line/70 bg-porcelain p-5">
        <p className="kicker-xs text-faint">Ajouter à mon étagère</p>
        <div className="mt-5 space-y-4">
          <select value={productId} onChange={(event) => setProductId(Number(event.target.value))} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep">
            {products.map((product) => <option key={product.id} value={product.id}>{product.brandName ? `${product.brandName} — ${product.name}` : product.name}</option>)}
          </select>
          <input type="date" value={openedAt} onChange={(event) => setOpenedAt(event.target.value)} className="min-h-12 w-full border border-line bg-canvas px-4 text-carbon outline-none focus:border-iodine-deep" />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note privée" className="min-h-24 w-full border border-line bg-canvas px-4 py-3 text-carbon outline-none focus:border-iodine-deep" />
          <button type="button" onClick={add} className="btn-solid w-full">Ajouter</button>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const product = byId.get(item.productId);
          if (!product) return null;
          const days = now ? Math.ceil((new Date(item.expiresAt).getTime() - now) / 86_400_000) : 0;
          return (
            <article key={item.id} className="border border-line/70 bg-canvas p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-faint">{product.brandName}</p>
                  <Link href={`/produit/${product.slug}`} className="mt-1 block font-ant uppercase text-[1.2rem] text-carbon hover:text-iodine-deep">{product.name}</Link>
                </div>
                <Badge tone={days < 30 ? "warning" : "success"}>{days > 0 ? `${days} jours` : "à retirer"}</Badge>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">Ouvert le {item.openedAt} · estimation PAO six mois · {item.note || "sans note"}</p>
              <button type="button" onClick={() => remove(item.id)} className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-faint hover:text-carbon">Retirer</button>
            </article>
          );
        })}
        {items.length === 0 && <p className="border border-dashed border-line p-8 text-[13px] text-muted">Ajoutez les produits ouverts à la maison pour suivre une date indicative.</p>}
      </div>
    </div>
  );
}
