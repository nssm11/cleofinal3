"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProductAction } from "@/actions/admin";
import { useToast } from "@/components/ui/toaster";
import type { Brand, Category, Concern, Product } from "@/db/schema";
import { AField, abtn, afield } from "./ui";

export function ProductForm({ product, brands, categories, concerns, selectedConcerns }: { product?: Product; brands: Brand[]; categories: Category[]; concerns: Concern[]; selectedConcerns: number[] }) {
  const [state, action, pending] = useActionState(saveProductAction, null);
  const { toast } = useToast();
  const router = useRouter();
  useEffect(() => { if (state) { toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "" : state.error }); if (state.ok && !product) router.push(`/admin/produits/${state.data.id}`); } }, [state, toast, router, product]);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k] : undefined);
  const universes = categories.filter((c) => c.isUniverse);
  const cats = categories.filter((c) => !c.isUniverse);

  /* The gallery is edited as an ordered list; the first plate is the primary
     image. Hidden inputs submit it intact, so saving can never collapse it. */
  const [gallery, setGallery] = useState<{ src: string; alt: string }[]>(() => {
    if (!product) return [];
    const srcs = product.images.length ? product.images : product.image ? [product.image] : [];
    return srcs.map((src, i) => ({ src, alt: product.imageAlts?.[i] ?? "" }));
  });
  const [newUrl, setNewUrl] = useState("");
  const move = (i: number, dir: -1 | 1) =>
    setGallery((g) => {
      const j = i + dir;
      if (j < 0 || j >= g.length) return g;
      const next = [...g];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const addImage = () => {
    const src = newUrl.trim();
    if (!src || gallery.some((g) => g.src === src) || gallery.length >= 8) return;
    setGallery((g) => [...g, { src, alt: "" }]);
    setNewUrl("");
  };
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2"><AField label="Nom" error={err("name")}><input name="name" defaultValue={product?.name} required className={afield} /></AField><AField label="Slug" error={err("slug")}><input name="slug" defaultValue={product?.slug} placeholder="auto" className={afield} /></AField></div>
        <div className="grid gap-4 sm:grid-cols-2"><AField label="SKU" error={err("sku")}><input name="sku" defaultValue={product?.sku} required className={afield} /></AField><AField label="Contenance"><input name="volume" defaultValue={product?.volume ?? ""} className={afield} /></AField></div>
        <AField label="Accroche" error={err("shortDescription")}><input name="shortDescription" defaultValue={product?.shortDescription ?? ""} maxLength={300} className={afield} /></AField>
        <AField label="Description"><textarea name="description" rows={4} defaultValue={product?.description ?? ""} className={afield} /></AField>
        <div className="grid gap-4 sm:grid-cols-2"><AField label="Ingrédients"><textarea name="ingredients" rows={3} defaultValue={product?.ingredients ?? ""} className={afield} /></AField><AField label="Conseils d'utilisation"><textarea name="howToUse" rows={3} defaultValue={product?.howToUse ?? ""} className={afield} /></AField></div>
        <AField label="Galerie photos — la première est l&apos;image principale">
          <div className="space-y-2.5">
            {gallery.map((g, i) => (
              <div key={`${g.src}-${i}`} className="flex items-center gap-3 border border-admin-border bg-admin-panel p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.alt || product?.name || ""} className="h-14 w-12 shrink-0 object-cover" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate font-mono text-[11px] text-admin-muted">
                    {g.src}
                    {i === 0 && <span className="ml-2 font-bold uppercase tracking-[0.14em] text-admin-gold">principale</span>}
                  </p>
                  <input
                    name="imageAlts"
                    value={g.alt}
                    onChange={(e) => setGallery((gal) => gal.map((x, xi) => (xi === i ? { ...x, alt: e.target.value } : x)))}
                    placeholder="Texte alternatif (accessibilité)"
                    className={afield}
                  />
                </div>
                <input type="hidden" name="images" value={g.src} />
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" aria-label="Monter" onClick={() => move(i, -1)} disabled={i === 0} className={`${abtn} px-2 py-0.5 text-[10px]`}>↑</button>
                  <button type="button" aria-label="Descendre" onClick={() => move(i, 1)} disabled={i === gallery.length - 1} className={`${abtn} px-2 py-0.5 text-[10px]`}>↓</button>
                  <button type="button" aria-label="Retirer" onClick={() => setGallery((gal) => gal.filter((_, xi) => xi !== i))} className={`${abtn} px-2 py-0.5 text-[10px]`}>✕</button>
                </div>
              </div>
            ))}
            {gallery.length === 0 && <p className="text-xs text-admin-muted">Aucune image pour l&apos;instant.</p>}
            <div className="flex gap-2">
              <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="/images/products/….jpg ou https://…" className={afield} aria-label="Ajouter une image" />
              <button type="button" onClick={addImage} disabled={!newUrl.trim() || gallery.length >= 8} className={`${abtn} shrink-0`}>Ajouter</button>
            </div>
            <input type="hidden" name="image" value={gallery[0]?.src ?? ""} />
          </div>
        </AField>
        <AField label="Besoins"><div className="grid grid-cols-2 gap-1 sm:grid-cols-3">{concerns.map((c) => <label key={c.id} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="concernIds" value={c.id} defaultChecked={selectedConcerns.includes(c.id)} className="h-4 w-4 accent-champagne" />{c.name}</label>)}</div></AField>
        <div className="grid gap-4 sm:grid-cols-2">
          <AField label="Texture (comparateur)" hint="Une ligne, comme au comptoir : « Baume riche », « Fluide léger »…"><input name="texture" defaultValue={product?.texture ?? ""} maxLength={80} className={afield} /></AField>
          <AField label="Pour qui (comparateur)"><input name="forWhom" defaultValue={product?.forWhom ?? ""} maxLength={160} className={afield} /></AField>
        </div>
        <AField label="Tolérances vérifiées" hint="Ne cocher « Oui » qu’après contrôle de la formule — « Non » et « Inconnu » n’apparaissent jamais publiquement, et aucun filtre n’est proposé sans données.">
          <div className="grid gap-2 sm:grid-cols-2">
            {([["sansParfum", "Sans parfum"], ["grossesse", "Compatible grossesse"], ["peauAtopique", "Peaux à tendance atopique"], ["yeuxSensibles", "Yeux sensibles"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center justify-between gap-3 border border-admin-border bg-admin-panel px-3 py-2 text-sm">
                <span>{l}</span>
                <select name={`tol-${k}`} defaultValue={product?.tolerances?.[k] === true ? "1" : product?.tolerances?.[k] === false ? "0" : ""} className="min-h-9 border border-admin-border bg-admin-bg px-2 text-xs">
                  <option value="">Inconnu</option>
                  <option value="1">Oui</option>
                  <option value="0">Non</option>
                </select>
              </label>
            ))}
          </div>
        </AField>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4"><AField label="Prix (DT)" error={err("priceMillimes")}><input name="priceDT" type="number" step="0.001" min="0" defaultValue={product ? product.priceMillimes / 1000 : ""} required className={afield} /></AField><AField label="Prix barré (DT)"><input name="compareAtDT" type="number" step="0.001" min="0" defaultValue={product?.compareAtMillimes ? product.compareAtMillimes / 1000 : ""} className={afield} /></AField></div>
        <div className="grid grid-cols-2 gap-4"><AField label="Stock" error={err("stock")}><input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} className={afield} /></AField><AField label="Seuil alerte"><input name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 5} className={afield} /></AField></div>
        <AField label="Marque"><select name="brandId" defaultValue={product?.brandId ?? ""} className={afield}><option value="">—</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></AField>
        <AField label="Univers"><select name="universeId" defaultValue={product?.universeId ?? ""} className={afield}><option value="">—</option>{universes.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></AField>
        <AField label="Catégorie"><select name="categoryId" defaultValue={product?.categoryId ?? ""} className={afield}><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{universes.find((u) => u.id === c.parentId)?.name} › {c.name}</option>)}</select></AField>
        <AField label="Statut"><select name="status" defaultValue={product?.status ?? "active"} className={afield}><option value="draft">Brouillon</option><option value="active">Actif</option><option value="archived">Archivé</option></select></AField>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="h-4 w-4 accent-champagne" /> Mis en avant</label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="isCounterPick" defaultChecked={product?.isCounterPick} className="h-4 w-4 accent-champagne" /> Conseillé au comptoir</label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="h-4 w-4 accent-champagne" /> Nouveauté</label>
        <AField label="Arrivé le (rail Nouveautés — 14 jours)" hint="Par défaut, la date de création de la fiche.">
          <input type="date" name="launchedAt" defaultValue={product?.launchedAt ? new Date(product.launchedAt).toISOString().slice(0, 10) : ""} className={afield} />
        </AField>
        <button disabled={pending} className={`${abtn} w-full`}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
