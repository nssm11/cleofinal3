"use client";

import { useEffect, useMemo, useState } from "react";

type Alert = { id: string; product: string; kind: "back-stock" | "price-drop" | "recall" | "expiry"; target?: string; createdAt: string };
const KEY = "cleo.product-alerts.v1";

export function ProductAlerts() {
  const [items, setItems] = useState<Alert[]>([]);
  const [product, setProduct] = useState("");
  const [kind, setKind] = useState<Alert["kind"]>("back-stock");
  const [target, setTarget] = useState("");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items]);
  const grouped = useMemo(() => ({ stock: items.filter((x) => x.kind === "back-stock"), price: items.filter((x) => x.kind === "price-drop"), safety: items.filter((x) => x.kind === "recall" || x.kind === "expiry") }), [items]);
  const add = () => { if (!product.trim()) return; setItems((x) => [{ id: String(Date.now()), product, kind, target, createdAt: new Date().toISOString() }, ...x]); setProduct(""); setTarget(""); };
  return <div className="grid gap-8 lg:grid-cols-[0.38fr_1fr]"><aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start"><p className="kicker-xs text-muted">Watch product</p><h2 className="mt-3 font-ant text-[2rem] uppercase leading-none text-carbon">Nouvelle alerte</h2><input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Nom, SKU ou marque" className="mt-6 w-full border border-line bg-porcelain p-3 outline-none focus:border-iodine" /><select value={kind} onChange={(e) => setKind(e.target.value as Alert["kind"])} className="mt-3 w-full border border-line bg-canvas p-3"><option value="back-stock">Back in stock</option><option value="price-drop">Price drop</option><option value="recall">Safety / recall</option><option value="expiry">Expiry reminder</option></select><input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target price/date (optional)" className="mt-3 w-full border border-line bg-porcelain p-3 outline-none focus:border-iodine" /><button onClick={add} className="btn-solid mt-4 w-full justify-center">Create alert</button></aside><section className="grid gap-6 md:grid-cols-3">{[["Back in stock", grouped.stock], ["Price drops", grouped.price], ["Safety & expiry", grouped.safety]].map(([title, list]) => <div key={title as string} className="border border-line bg-canvas p-5"><p className="kicker-xs text-muted">{String(title)}</p><p className="mt-3 font-ant text-[2.4rem] uppercase leading-none text-carbon">{(list as Alert[]).length}</p><ul className="mt-5 space-y-3">{(list as Alert[]).map((item) => <li key={item.id} className="border-t border-line pt-3 text-[13px]"><span className="block text-carbon">{item.product}</span><span className="text-muted">{item.target || item.kind}</span></li>)}</ul></div>)}</section></div>;
}
