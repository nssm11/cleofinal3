"use client";
export function ProductCommandOs({ products, ...rest }: { products?: { slug: string; name: string }[]; [key: string]: any }) {
  const list = products ?? [];
  return (
    <div className="border border-line bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Produits — {list.length || (rest as any).name || ""}</p>
      {list.length > 0 && (
        <>
          <input placeholder="Rechercher un produit…" className="mt-3 h-9 w-full border border-line bg-bg px-3 font-sans text-[13px] focus:border-ink focus:outline-none" />
          <ul className="mt-3 divide-y divide-line border border-line max-h-64 overflow-auto">
            {list.slice(0, 20).map((p) => <li key={p.slug} className="px-3 py-2 font-mono text-[12px] hover:bg-bg-2">{p.name}</li>)}
          </ul>
        </>
      )}
      {Object.keys(rest).length > 0 && <div className="mt-3 font-mono text-[11px] text-text-muted">{JSON.stringify(rest).slice(0, 200)}</div>}
    </div>
  );
}
