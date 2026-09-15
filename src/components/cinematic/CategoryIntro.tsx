import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

/**
 * CategoryIntro — the title card of a chapter.
 *
 * Three lines, no card: the film's index, the name of the rayon set wide in
 * micro-caps, the statement in the display face, and one gesture — the arrow
 * that glides when you reach for it.
 */
export function CategoryIntro({
  index,
  total,
  kicker,
  title,
  ctaLabel,
  href,
}: {
  index: number;
  total: number;
  kicker: string;
  title: string;
  ctaLabel: string;
  href: string;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="absolute inset-x-0 bottom-0 z-10">
      <div className="container-wide flex flex-col items-start gap-6 pb-20 lg:pb-28">
        <div className="flex items-center gap-4" aria-hidden>
          <span className="cine-index">
            {pad(index)} / {pad(total)}
          </span>
          <span className="h-px w-10 bg-cine-line" />
          <span className="cine-kicker">{kicker}</span>
        </div>
        <h2 className="cine-title max-w-[18ch]">{title}</h2>
        <Link href={href} className="cine-cta">
          {ctaLabel}
          <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
