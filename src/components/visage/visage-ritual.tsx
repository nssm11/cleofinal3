import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type RitualNeed = { slug: string; name: string; n: number };

/**
 * THE RITUAL FINDER — enter by preoccupation.
 *
 * Each need is an elegant selector pill: the name in the display face, its
 * honest count in gold, an arrow that glides on approach. A pill is a door
 * into the explorer, pre-filtered. Needs without data never appear — the
 * facet query guarantees it.
 */
export function VisageRitual({
  needs,
  basePath,
  copy,
}: {
  needs: RitualNeed[];
  basePath: string;
  copy: Copy;
}) {
  if (needs.length === 0) return null;
  return (
    <section id="rituel" aria-label={copy.header.navPanel.needs} className="scroll-mt-16 bg-cine-noir">
      <div className="container-wide py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-4">
              <span className="cine-index">01</span>
              <span className="h-px w-10 bg-cine-line" aria-hidden />
              <span className="cine-kicker">{copy.header.navPanel.needs}</span>
            </p>
            <h2 className="cine-title mt-6 max-w-[20ch]">{copy.merch.routineEyebrow}</h2>
          </div>
          <Link href="/diagnostic" className="cine-cta">
            {copy.footer.links.diagnostic}
            <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
          </Link>
        </div>

        <ul className="mt-12 flex flex-wrap gap-3 lg:mt-14">
          {needs.map((c) => (
            <li key={c.slug}>
              <Link
                href={`${basePath}?concerns=${c.slug}`}
                className="group inline-flex min-h-14 items-center gap-3 rounded-full border border-cine-line px-6 transition-all duration-500 hover:border-cine-gold hover:bg-cine-gold/[0.08]"
              >
                <span className="font-display text-[19px] font-light italic leading-none text-cine-ivory transition-colors duration-500 group-hover:text-cine-gold">
                  {c.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cine-gold">
                  {c.n}
                </span>
                <ArrowRightIcon
                  size={14}
                  className="text-cine-faint transition-all duration-500 group-hover:translate-x-1 group-hover:text-cine-gold rtl-mirror rtl:group-hover:-translate-x-1"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
