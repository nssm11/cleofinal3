import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

export type RitualNeed = { slug: string; name: string; n: number };

/**
 * THE RITUAL FINDER — enter by preoccupation.
 *
 * No cards, no boxes: each need is a full-width hairline row set in the
 * display face, with its honest count and a gliding arrow. A row is a door
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

        <ul className="mt-12 lg:mt-16">
          {needs.map((c, i) => (
            <li key={c.slug} className="border-t border-cine-line last:border-b">
              <Link
                href={`${basePath}?concerns=${c.slug}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 sm:gap-8 sm:py-6 lg:py-7"
              >
                <span className="cine-index w-8">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[clamp(1.5rem,4.2vw,2.9rem)] font-light leading-tight text-cine-ivory transition-all duration-500 group-hover:translate-x-2 group-hover:text-cine-gold rtl:group-hover:-translate-x-2">
                    {c.name}
                  </span>
                </span>
                <span className="flex items-center gap-4 sm:gap-8">
                  <span className="hidden text-[11px] font-bold uppercase tracking-[0.2em] text-cine-faint sm:block">
                    {c.n} réf{c.n > 1 ? "s" : ""}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cine-line text-cine-mist transition-all duration-500 group-hover:border-cine-gold group-hover:bg-cine-gold group-hover:text-cine-noir">
                    <ArrowRightIcon size={15} className="rtl-mirror" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
