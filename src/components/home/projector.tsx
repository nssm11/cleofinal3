"use client";
import Link from "next/link";
import Image from "next/image";

export type Reel = { id: string; video: string; poster: string; kicker: string; title: string; href: string };

export function Projector({ reels, facts }: { reels: Reel[]; facts: { value: number; label: string }[] }) {
  const main = reels[0];
  return (
    <section className="border-b border-line">
      <div className="shell-wide">
        <div className="border-x border-line grid lg:grid-cols-12 gap-px bg-line">
          <div className="lg:col-span-8 bg-bg p-8 lg:p-12 min-h-[520px] flex flex-col justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">01 — Maison</p>
              <h1 className="mt-6 font-sans text-[clamp(2.5rem,8vw,6rem)] font-bold leading-[0.85] tracking-[-0.04em]">CLÉOPÂTRE<br />SYSTÈME<br /><span className="text-text-secondary">DE SOIN.</span></h1>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-line pt-8">
              {facts.map((f) => (
                <div key={f.label}><p className="font-sans text-[24px] font-semibold">{f.value}</p><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{f.label}</p></div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 bg-bg flex flex-col">
            <div className="relative aspect-[4/5] bg-bg-2">
              <Image src={`/videos/posters/${main.poster}.jpg`} alt="" fill className="object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-px bg-line mt-auto">
              <Link href={main.href} className="bg-ink text-paper p-4 font-mono text-[11px] uppercase tracking-[0.12em]">Boutique →</Link>
              <Link href="/diagnostic" className="bg-bg p-4 font-mono text-[11px] uppercase tracking-[0.12em]">Diagnostic</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
