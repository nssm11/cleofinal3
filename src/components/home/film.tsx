"use client";
import Link from "next/link";
import Image from "next/image";

export type Chapter = { id: string; index: number; total: number; video: string; poster: string; kicker: string; title: string; href: string; promise: string; count: number; labs: string[] };

export function FilmChapter({ chapter, side }: { chapter: Chapter; side: "left" | "right" }) {
  return (
    <section className="border-b border-line">
      <div className="shell-wide">
        <div className="border-x border-line grid lg:grid-cols-12 gap-px bg-line">
          <div className={`bg-bg p-8 lg:p-12 ${side === "left" ? "lg:col-span-7" : "lg:col-span-7 lg:col-start-6"}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{String(chapter.index).padStart(2, "0")} — {chapter.kicker}</p>
            <h2 className="mt-6 font-sans text-[32px] font-bold leading-[0.95] tracking-[-0.03em]">{chapter.title}</h2>
            <p className="mt-4 font-sans text-[15px] leading-[1.6] text-text-secondary max-w-[48ch]">{chapter.promise}</p>
            <div className="mt-8 flex items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{chapter.count} références</span>
              <span className="h-px w-12 bg-line" />
              <Link href={chapter.href} className="font-mono text-[11px] uppercase tracking-[0.12em] underline underline-offset-4">Voir →</Link>
            </div>
          </div>
          <div className={`bg-bg-2 relative min-h-[360px] ${side === "left" ? "lg:col-span-5" : "lg:col-span-5 lg:col-start-1 lg:row-start-1"}`}>
            <Image src={`/videos/posters/${chapter.poster}.jpg`} alt="" fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatementBand({ words, href, cta }: { words: string; href: string; cta: string }) {
  return (
    <div className="border-b border-line bg-ink text-paper">
      <div className="shell-wide">
        <div className="border-x border-line-inverse flex items-center justify-between px-8 py-6 lg:px-12">
          <p className="font-sans text-[20px] font-medium tracking-[-0.01em]">{words}</p>
          <Link href={href} className="font-mono text-[11px] uppercase tracking-[0.12em] border border-line-inverse px-4 py-2 hover:bg-paper hover:text-ink transition-colors">{cta} →</Link>
        </div>
      </div>
    </div>
  );
}
