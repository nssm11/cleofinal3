import Image from "next/image";
import Link from "next/link";
import { Curtain, Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/lib/utils";
import { ChapterHead } from "./chapter-head";

/**
 * HM · LE JOURNAL — the pharmacists' ink.
 *
 * One lead essay held large, its title overlapping the plate's edge like a
 * magazine drop-head; the rest as a quiet reading list. Understanding before
 * buying, always.
 */
export type JournalPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  tag: string | null;
  readMinutes: number;
  publishedAt: Date;
};

export function JournalHome({
  posts,
  minutesLabel,
  copy,
}: {
  posts: JournalPost[];
  minutesLabel: string;
  copy: { index: string; eyebrow: string; title: string; cta: string };
}) {
  const [lead, ...rest] = posts;
  if (!lead) return null;
  return (
    <section aria-label={copy.index} className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(250,246,236,0.9) 18%, rgba(250,246,236,0.9) 82%, transparent 100%)" }}
        />
      </div>
      <div className="relative container-wide py-20 lg:py-32">
        <ChapterHead index={copy.index} eyebrow={copy.eyebrow} title={copy.title} action={{ href: "/journal", label: copy.cta }} />

        <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-14">
          <Curtain className="lg:col-span-7" from="bottom">
            <Link href={`/journal/${lead.slug}`} className="group block">
              <div className="plate relative aspect-[16/10] w-full">
                {lead.image && (
                  <Image
                    src={lead.image}
                    alt=""
                    fill
                    sizes="(max-width:1024px) 100vw, 56vw"
                    className="hm-plate-img object-cover"
                  />
                )}
              </div>
              <div className="relative mx-4 -mt-10 border border-stone-2/30 bg-cream/95 px-6 py-6 shadow-soft backdrop-blur-xl sm:mx-8 sm:px-8 lg:-mt-14 lg:px-10 lg:py-8">
                <div className="flex items-center gap-5">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-champagne-2">{lead.tag}</span>
                  <span className="h-px flex-1 bg-stone-2/40" aria-hidden />
                  <span className="shrink-0 text-[10.5px] tabular-nums text-muted-2">
                    {lead.readMinutes} {minutesLabel} · {formatDate(lead.publishedAt)}
                  </span>
                </div>
                <h3 className="hm-display mt-4 text-[clamp(1.5rem,3vw,2.4rem)] text-ink transition-colors duration-500 group-hover:text-champagne-2">
                  {lead.title}
                </h3>
                {lead.excerpt && <p className="mt-3 max-w-xl text-[14.5px] leading-[1.85] text-muted">{lead.excerpt}</p>}
              </div>
            </Link>
          </Curtain>

          <ul className="lg:col-span-5">
            {rest.map((a, i) => (
              <Reveal key={a.id} as="li" y={14} delay={i * 0.07} className="border-t border-stone/60 first:border-t-0 first:[&>a]:pt-0 lg:first:[&>a]:pt-0">
                <Link href={`/journal/${a.slug}`} className="group flex gap-6 py-6">
                  <span className="relative h-[96px] w-[78px] shrink-0 overflow-hidden bg-marble">
                    {a.image && (
                      <Image
                        src={a.image}
                        alt=""
                        fill
                        sizes="78px"
                        className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-2">
                      {a.tag} · {a.readMinutes} {minutesLabel}
                    </span>
                    <span className="mt-1.5 block font-display text-[19px] leading-tight text-ink transition-colors duration-500 group-hover:text-champagne-2">
                      {a.title}
                    </span>
                    <span className="mt-1.5 block line-clamp-2 text-[13px] leading-relaxed text-muted">{a.excerpt}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
