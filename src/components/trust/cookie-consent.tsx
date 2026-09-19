"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "cleo.cookie.preferences.v1";
type Prefs = { necessary: true; analytics: boolean; marketing: boolean; support: boolean; acceptedAt: string };

const defaultPrefs = (): Prefs => ({ necessary: true, analytics: false, marketing: false, support: true, acceptedAt: new Date().toISOString() });

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(KEY);
        if (saved) setPrefs(JSON.parse(saved));
        else setOpen(true);
      } catch {
        setOpen(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const save = (next: Prefs) => {
    const stamped = { ...next, acceptedAt: new Date().toISOString() };
    setPrefs(stamped);
    try { localStorage.setItem(KEY, JSON.stringify(stamped)); } catch {}
    setOpen(false);
  };

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="fixed bottom-4 left-4 z-[60] border border-line bg-canvas px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted shadow-sm">Privacy</button>;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl border border-line bg-canvas p-5 shadow-2xl">
      <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="kicker-xs text-muted">Privacy preferences</p>
          <h2 className="mt-2 font-ant text-[1.7rem] uppercase leading-none text-carbon">Cookies and consent</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">Necessary storage keeps the cart, security and preferences working. Optional analytics and marketing stay off unless you turn them on.</p>
          <Link href="/confidentialite" className="mt-3 inline-flex text-[12px] font-semibold text-iodine-deep underline underline-offset-4">Read privacy policy</Link>
        </div>
        <div className="space-y-2">
          <Toggle label="Analytics" checked={prefs.analytics} onChange={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))} />
          <Toggle label="Marketing" checked={prefs.marketing} onChange={() => setPrefs((p) => ({ ...p, marketing: !p.marketing }))} />
          <Toggle label="Support chat" checked={prefs.support} onChange={() => setPrefs((p) => ({ ...p, support: !p.support }))} />
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => save(defaultPrefs())} className="btn-ghost">Necessary only</button>
            <button type="button" onClick={() => save({ necessary: true, analytics: true, marketing: true, support: true, acceptedAt: "" })} className="btn-ghost">Accept all</button>
            <button type="button" onClick={() => save(prefs)} className="btn-solid">Save choices</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex w-full items-center justify-between border border-line bg-porcelain px-3 py-2 text-[13px] text-carbon"><span>{label}</span><span className={checked ? "text-ok" : "text-faint"}>{checked ? "On" : "Off"}</span></button>;
}
