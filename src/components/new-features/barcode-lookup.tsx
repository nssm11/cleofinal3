"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type Result = {
  item: null | {
    slug: string;
    sku: string;
    barcode: string | null;
    name: string;
    image: string | null;
    brandName: string | null;
    stock: number;
    url: string;
    authentic: boolean;
    verification: string;
  };
  reason: string | null;
};

export function BarcodeLookup() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  const lookup = () => start(async () => {
    const r = await fetch(`/api/lookup/product?q=${encodeURIComponent(q)}`);
    setResult(await r.json());
  });

  const examples = ["CL-0001", "CL-0012", "CL-0048"];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.4fr_1fr]">
      <aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start">
        <p className="kicker-xs text-muted">Scan or type</p>
        <h2 className="mt-3 font-ant text-[2rem] uppercase leading-none text-carbon">Barcode / SKU lookup</h2>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">Use a barcode scanner, phone keyboard, or the product SKU printed in the catalogue.</p>
        <label className="mt-6 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Code</span>
          <input value={q} onChange={(e) => setQ(e.target.value.toUpperCase())} placeholder="CL-0001 or EAN" className="mt-2 w-full border border-line bg-porcelain p-3 font-mono text-[14px] outline-none focus:border-iodine" />
        </label>
        <button type="button" onClick={lookup} disabled={pending || q.length < 3} className="btn-solid mt-4 w-full justify-center">{pending ? "Checking…" : "Check product"}</button>
        <div className="mt-5 flex flex-wrap gap-2">
          {examples.map((x) => <button key={x} type="button" onClick={() => setQ(x)} className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-muted">{x}</button>)}
        </div>
      </aside>

      <section className="min-h-96 border border-line bg-canvas p-6">
        {!result ? (
          <div className="grid h-full place-items-center text-center text-muted">
            <div><p className="font-ant text-[2rem] uppercase text-carbon">Ready to verify</p><p className="mt-3 text-[14px]">Enter a code to check authenticity, stock and product page.</p></div>
          </div>
        ) : result.item ? (
          <article className="grid gap-6 md:grid-cols-[10rem_1fr]">
            <div className="aspect-square bg-porcelain" style={result.item.image ? { backgroundImage: `url(${result.item.image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
            <div>
              <p className="kicker-xs text-ok">Authentic catalogue match</p>
              <h2 className="mt-3 font-ant text-[2.4rem] uppercase leading-none text-carbon">{result.item.name}</h2>
              <p className="mt-2 text-[13px] text-muted">{result.item.brandName} · SKU {result.item.sku}{result.item.barcode ? ` · EAN ${result.item.barcode}` : ""}</p>
              <p className="mt-5 border-l-2 border-iodine pl-4 text-[14px] leading-relaxed text-carbon">{result.item.verification}</p>
              <div className="mt-6 grid gap-px bg-line sm:grid-cols-3">
                <Metric label="Stock" value={String(result.item.stock)} />
                <Metric label="Status" value={result.item.stock > 0 ? "Available" : "Out"} />
                <Metric label="Source" value="Cléopâtre" />
              </div>
              <Link href={`/produit/${result.item.slug}`} className="btn-solid mt-6">Open product</Link>
            </div>
          </article>
        ) : (
          <div className="border border-dashed border-line p-8 text-center">
            <p className="font-ant text-[2rem] uppercase text-carbon">No match</p>
            <p className="mt-3 text-[14px] text-muted">{result.reason}</p>
            <Link href={`/questions-produits?code=${encodeURIComponent(q)}`} className="btn-ghost mt-6">Ask the team to identify it</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-porcelain p-4"><p className="kicker-xs text-muted">{label}</p><p className="mt-2 font-ant text-[1.4rem] uppercase text-carbon">{value}</p></div>;
}
