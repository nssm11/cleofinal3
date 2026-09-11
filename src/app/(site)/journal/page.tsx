import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { Reveal, MaskLine } from "@/components/motion/reveal";
import { MotifLayer } from "@/components/shell/motif";
import { formatDate } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Le Journal",
  description:
    "Conseils de pharmaciens : routines, actifs, protection solaire, compléments — sans jargon ni promesses.",
  alternates: { canonical: "/journal" },
};
export const dynamic = "force-dynamic";

/**
 * THE JOURNAL.
 *
 * Read as a publication rather than as a blog roll: one cover story given a
 * full spread, then an index of issues set as numbered entries with their
 * reading time — the way a magazine lists its contents.
 */
export default async function JournalPage() {
  const list = await db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.publishedAt));
  const [lead, ...rest] = list;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone/70 bg-paper pb-10 pt-28 lg:pb-14 lg:pt-36">
        <MotifLayer motif="botanical" light={[80, 12]} />
        <div className="relative container-wide">
          <p className="rule-label mb-6">Le Journal</p>
          <h1 className="max-w-[26ch] font-display text-[clamp(2.2rem,4.8vw,3.8rem)] leading-[0.98] tracking-[-0.028em] text-ink">
            <MaskLine immediate>Comprendre,</MaskLine>
            <MaskLine immediate delay={0.08} className="italic text-champagne-2">
              avant d&apos;acheter.
            </MaskLine>
          </h1>
          <p className="mt-7 max-w-[42rem] text-[15px] leading-[1.85] text-muted">
            Des textes courts, écrits par notre équipe pharmaceutique&nbsp;: comment choisir, doser, appliquer — sans
            jargon, sans promesse excessive, et sans jamais confondre un cosmétique avec un médicament.
          </p>
        </div>
      </section>

      {lead && (
        <section className="container-wide py-rhythm lg:py-rhythm-lg">
          <Link href={`/journal/${lead.slug}`} className="group grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="relative aspect-[16/11] overflow-hidden bg-marble lg:col-span-7 lg:aspect-[16/10]">
              {lead.image && (
                <Image
                  src={lead.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 58vw"
                  className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div className="lg:col-span-5 lg:self-center">
              <p className="rule-label mb-6 text-champagne-2">Le dernier numéro</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-2">
                {lead.tag} · {lead.readMinutes} min · {formatDate(lead.publishedAt)}
              </p>
              <h2 className="mt-4 font-display text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.04] tracking-[-0.024em] text-ink transition-colors duration-500 group-hover:text-champagne-2">
                {lead.title}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-[1.85] text-muted">{lead.excerpt}</p>
              <span className="mt-8 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                Lire l&apos;article
                <ArrowRightIcon size={13} className="text-champagne-2 transition-transform duration-500 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>
      )}

      <section className="relative border-t border-stone/70 bg-cream">
        <div className="container-wide py-rhythm lg:py-rhythm-lg">
          <p className="rule-label mb-10">Les numéros précédents</p>
          <ul className="border-t border-stone/70">
            {rest.map((a, i) => (
              <Reveal key={a.id} as="li" y={10} delay={i * 0.04} className="border-b border-stone/70">
                <Link href={`/journal/${a.slug}`} className="group grid gap-6 py-7 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8">
                  <span className="font-display text-[13px] italic tabular-nums text-champagne-2">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-2">
                      {a.tag} · {a.readMinutes} min · {formatDate(a.publishedAt)}
                    </span>
                    <span className="mt-2 block font-display text-[clamp(1.15rem,2.1vw,1.6rem)] leading-snug text-ink transition-colors duration-500 group-hover:text-champagne-2">
                      {a.title}
                    </span>
                    <span className="mt-2 line-clamp-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                      {a.excerpt}
                    </span>
                  </span>
                  <span className="relative hidden h-[86px] w-[128px] shrink-0 overflow-hidden bg-marble sm:block">
                    {a.image && (
                      <Image
                        src={a.image}
                        alt=""
                        fill
                        sizes="128px"
                        className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      />
                    )}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
