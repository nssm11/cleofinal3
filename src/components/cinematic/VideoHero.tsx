"use client";
import Image from "next/image";
import Link from "next/link";

export function VideoHero({ video, poster, kicker, title, href, facts }: { video: string; poster: string; kicker: string; title: string; href: string; facts?: { value: number; label: string }[] }) {
  return (
    <section className="border-b border-line">
      <div className="shell-wide">
        <div className="border-x border-line grid lg:grid-cols-12 gap-px bg-line">
          <div className="lg:col-span-7 bg-bg p-8 lg:p-12 flex flex-col justify-between min-h-[480px]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{kicker}</p>
              <h1 className="mt-6 font-sans text-[clamp(2rem,6vw,4rem)] font-bold leading-[0.9] tracking-[-0.04em]">{title}</h1>
            </div>
            {facts && (
              <div className="mt-12 grid grid-cols-3 gap-8 border-t border-line pt-8">
                {facts.map((f) => (
                  <div key={f.label}>
                    <p className="font-sans text-[28px] font-semibold">{f.value}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{f.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-5 bg-bg-2 relative min-h-[480px]">
            <Image src={`/videos/posters/${poster}.jpg`} alt="" fill className="object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-ink">
              <Link href={href} className="btn-inverse w-full">Entrer →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
