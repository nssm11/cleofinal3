"use client";

import { useMemo, useState } from "react";

type Photo = { id: string; product: string; caption: string; status: "pending" | "approved"; url?: string };
const seed: Photo[] = [
  { id: "ugc-1", product: "SPF visage", caption: "Texture légère en journée", status: "approved" },
  { id: "ugc-2", product: "Baume réparateur", caption: "Avant/après confort barrière", status: "approved" },
];

export function UgcGallery() {
  const [items, setItems] = useState(seed);
  const [product, setProduct] = useState("");
  const [caption, setCaption] = useState("");
  const approved = useMemo(() => items.filter((x) => x.status === "approved"), [items]);
  const submit = () => { if (!product) return; setItems((x) => [{ id: String(Date.now()), product, caption, status: "pending" }, ...x]); setProduct(""); setCaption(""); };
  return <div className="grid gap-8 lg:grid-cols-[0.36fr_1fr]"><aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start"><p className="kicker-xs text-muted">UGC upload</p><h2 className="mt-3 font-ant text-[2rem] uppercase leading-none text-carbon">Photo cliente</h2><input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Produit" className="mt-6 w-full border border-line bg-porcelain p-3" /><textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} placeholder="Légende" className="mt-3 w-full border border-line bg-porcelain p-3" /><input type="file" accept="image/*" className="mt-3 w-full text-[12px] text-muted" /><button onClick={submit} className="btn-solid mt-4 w-full justify-center">Submit for moderation</button></aside><section><div className="grid gap-px bg-line md:grid-cols-3">{approved.map((item) => <article key={item.id} className="bg-canvas p-5"><div className="aspect-square bg-porcelain"><span className="grid h-full place-items-center text-[11px] uppercase tracking-[0.18em] text-faint">Photo</span></div><p className="mt-4 font-ant text-[1.3rem] uppercase text-carbon">{item.product}</p><p className="mt-2 text-[13px] text-muted">{item.caption}</p></article>)}</div>{items.some((x) => x.status === "pending") && <p className="mt-6 border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-800">{items.filter((x) => x.status === "pending").length} submission(s) awaiting moderation.</p>}</section></div>;
}
