"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV } from "./nav";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const items = NAV.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-9 items-center gap-2 border border-line bg-bg-2 px-3 font-mono text-[11px] text-text-muted hover:border-ink">
        <span>⌘K</span><span className="hidden sm:inline">Rechercher</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[20vh]" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg border border-ink bg-bg p-2" onClick={(e) => e.stopPropagation()}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Aller à…" className="h-10 w-full border border-line bg-bg px-3 font-sans text-[14px] focus:border-ink focus:outline-none" />
            <ul className="mt-2 divide-y divide-line border border-line">
              {items.map((i) => (
                <li key={i.href}><Link href={i.href} onClick={() => setOpen(false)} className="block px-3 py-2 font-mono text-[12px] hover:bg-ink hover:text-paper">{i.label}</Link></li>
              ))}
              {items.length === 0 && <li className="px-3 py-4 font-mono text-[11px] text-text-muted">Aucun résultat</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
