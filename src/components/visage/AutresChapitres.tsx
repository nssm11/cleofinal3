import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import { VISAGE_EDITION } from "./edition";

/**
 * LA SUITE DU FILM — the other chapters of the house, as an end-credit rail.
 * One line, great names in italics, and the film continues elsewhere.
 */
export function AutresChapitres({ others }: { others: { id: number; slug: string; name: string }[] }) {
  if (others.length === 0) return null;
  return (
    <nav aria-label={VISAGE_EDITION.chapters.kicker} className="border-t border-cine-line bg-cine-noir">
      <div className="container-wide flex items-center gap-7 overflow-x-auto py-7 scrollbar-none lg:py-8">
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.3em] text-cine-faint">
          {VISAGE_EDITION.chapters.kicker}
        </span>
        <span aria-hidden className="h-4 w-px shrink-0 bg-cine-line" />
        <ul className="flex items-center gap-9 lg:gap-12">
          {others.map((o) => (
            <li key={o.id} className="shrink-0">
              <Link href={`/univers/${o.slug}`} className="group flex items-center gap-2.5 whitespace-nowrap">
                <span className="font-display text-[19px] italic text-cine-mist transition-colors duration-500 group-hover:text-cine-gold">
                  {o.name}
                </span>
                <ArrowUpRightIcon
                  size={12}
                  className="text-cine-faint opacity-0 transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-cine-gold group-hover:opacity-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
