"use client";

import { useEffect, useState } from "react";

type Po = { id: string; supplier: string; status: "draft" | "sent" | "received"; lines: number; eta: string };
const KEY = "cleo.purchase-orders.v1";
const seed: Po[] = [{ id: "PO-2609-001", supplier: "Laboratoire principal", status: "draft", lines: 12, eta: "7 days" }];

export function PurchaseOrderBoard() {
  const [items, setItems] = useState<Po[]>(seed);
  const [supplier, setSupplier] = useState("");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { setItems(JSON.parse(localStorage.getItem(KEY) || JSON.stringify(seed))); } catch {}
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items]);
  const add = () => { if (!supplier) return; setItems((x) => [{ id: `PO-${Date.now().toString().slice(-6)}`, supplier, status: "draft", lines: 1, eta: "to confirm" }, ...x]); setSupplier(""); };
  const advance = (id: string) => setItems((x) => x.map((po) => po.id === id ? { ...po, status: po.status === "draft" ? "sent" : po.status === "sent" ? "received" : "received" } : po));
  return <div className="grid gap-5 lg:grid-cols-[0.34fr_1fr]"><section className="border border-os-line bg-os-surface p-4"><p className="os-label text-os-faint">New PO</p><input value={supplier} onChange={(e)=>setSupplier(e.target.value)} placeholder="Supplier" className="mt-4 w-full border border-os-line bg-os-surface-2 p-3 text-sm" /><button onClick={add} className="mt-3 border border-os-line px-4 py-2 text-xs uppercase tracking-widest">Create draft</button></section><section className="grid gap-3 md:grid-cols-3">{items.map((po) => <article key={po.id} className="border border-os-line bg-os-surface p-4"><p className="os-label text-os-faint">{po.id}</p><h3 className="mt-2 text-lg text-os-text">{po.supplier}</h3><p className="mt-2 text-sm text-os-muted">{po.lines} line(s) · ETA {po.eta}</p><button onClick={() => advance(po.id)} className="mt-4 border border-os-line px-3 py-2 text-xs uppercase tracking-widest">{po.status}</button></article>)}</section></div>;
}
