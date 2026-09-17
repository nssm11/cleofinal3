"use client";
export type Asset = { key: string; url: string; kind?: string; size?: number; productSlug?: string | null; [k: string]: any };
export function MediaGrid({ assets, sources }: { assets: any[]; sources: { key: string; label: string; count: number }[] }) {
  return (
    <div className="border border-line bg-bg p-4">
      <div className="flex gap-2 mb-4">
        {sources.map((s) => <span key={s.key} className="border border-line px-2 py-1 font-mono text-[10px] uppercase">{s.label} ({s.count})</span>)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line">
        {assets.map((a: any) => (
          <div key={a.key ?? a.url} className="bg-bg p-2">
            <img src={a.url} alt="" className="aspect-square object-cover w-full border border-line" loading="lazy" />
            <p className="mt-2 font-mono text-[10px] truncate">{a.key ?? a.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
