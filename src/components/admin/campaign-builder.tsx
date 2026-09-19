"use client";

import { useState } from "react";

const blocks = ["Hero", "Product shelf", "Buying guide", "Newsletter section", "Influencer link", "Push notification", "SEO FAQ"];

export function CampaignBuilder() {
  const [title, setTitle] = useState("Summer essentials");
  const [selected, setSelected] = useState<string[]>(["Hero", "Product shelf"]);
  const toggle = (b: string) => setSelected((x) => x.includes(b) ? x.filter((v) => v !== b) : [...x, b]);
  return <div className="grid gap-5 lg:grid-cols-[0.34fr_1fr]"><section className="border border-os-line bg-os-surface p-4"><p className="os-label text-os-faint">Campaign name</p><input value={title} onChange={(e)=>setTitle(e.target.value)} className="mt-3 w-full border border-os-line bg-os-surface-2 p-3 text-sm" /><p className="os-label mt-5 text-os-faint">Blocks</p><div className="mt-3 space-y-2">{blocks.map((b)=><button key={b} onClick={()=>toggle(b)} className={selected.includes(b)?"w-full bg-os-gold-soft p-2 text-left text-xs uppercase tracking-widest text-os-gold":"w-full border border-os-line p-2 text-left text-xs uppercase tracking-widest text-os-muted"}>{b}</button>)}</div></section><section className="border border-os-line bg-os-surface p-5"><p className="os-label text-os-faint">Preview</p><h2 className="mt-3 text-3xl text-os-text">{title}</h2><div className="mt-6 grid gap-3 md:grid-cols-2">{selected.map((b)=><div key={b} className="border border-os-line bg-os-surface-2 p-4"><p className="text-os-text">{b}</p><p className="mt-2 text-sm text-os-muted">Ready for landing page, email and campaign tracking.</p></div>)}</div><div className="mt-6 border-t border-os-line pt-4 text-sm text-os-muted">Generated URLs: /campagnes/{title.toLowerCase().replace(/[^a-z0-9]+/g,"-") || "campaign"} · UTM template · feed block · OG card.</div></section></div>;
}
