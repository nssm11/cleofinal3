"use client";
import Image from "next/image";
import Link from "next/link";

export function CinematicUniverseHero({ universe, count }: { universe: { slug: string; name: string; description: string | null }; count: number }) {
  return (
    <section className="border-b border-line">
      <div className="shell-wide">
        <div className="border-x border-line px-8 py-12 lg:px-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">Univers — {universe.slug}</p>
          <h1 className="mt-4 font-sans text-[clamp(2rem,6vw,4rem)] font-bold leading-[0.9] tracking-[-0.04em]">{universe.name}</h1>
          {universe.description && <p className="mt-4 max-w-[48ch] font-sans text-[15px] leading-[1.6] text-text-secondary">{universe.description}</p>}
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{count} références</p>
        </div>
      </div>
    </section>
  );
}
