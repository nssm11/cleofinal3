import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { MaskLine, Reveal } from "@/components/motion/reveal";

/**
 * HM · CHAPTER HEAD — the recurring voice that opens each homepage chapter.
 *
 * A triptych: kicker (index + eyebrow), an oversized display title crossed by
 * an optional italic accent, and an optional quiet action. Never a card, never
 * a box — type, air, and one hairline.
 */
export function ChapterHead({
  index,
  eyebrow,
  title,
  accent,
  description,
  action,
  tone = "light",
  align = "left",
}: {
  index: string;
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  action?: { href: string; label: string };
  tone?: "light" | "night";
  align?: "left" | "center";
}) {
  const night = tone === "night";
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : ""}>
      <Reveal>
        <p className={`hm-kicker ${night ? "text-champagne-3/90" : "text-muted"}`}>
          <span className="font-display normal-case italic tracking-normal text-[13px] text-champagne-2">
            {index}
          </span>
          {eyebrow}
        </p>
      </Reveal>
      <h2
        className={`hm-display mt-6 text-[clamp(2.1rem,5.2vw,4.3rem)] ${
          night ? "text-albatre" : "text-ink"
        } ${centered ? "mx-auto max-w-4xl" : "max-w-3xl"}`}
      >
        <MaskLine immediate={false}>{title}</MaskLine>
        {accent && (
          <MaskLine immediate={false} delay={0.1} className={`italic ${night ? "text-champagne-3" : "text-champagne-2"}`}>
            {accent}
          </MaskLine>
        )}
      </h2>
      {(description || action) && (
        <Reveal delay={0.15} className={`mt-6 flex flex-wrap gap-x-10 gap-y-4 ${centered ? "justify-center" : "items-end justify-between"}`}>
          {description && (
            <p className={`max-w-[52ch] text-[14.5px] leading-[1.85] ${night ? "text-albatre/60" : "text-muted"} ${centered ? "mx-auto" : ""}`}>
              {description}
            </p>
          )}
          {action && (
            <Link
              href={action.href}
              className={`group inline-flex items-center gap-2.5 pb-1 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                night ? "text-albatre hover:text-champagne-3" : "text-ink hover:text-champagne-2"
              }`}
            >
              <span className="link-underline">{action.label}</span>
              <ArrowRightIcon size={14} className="rtl-mirror transition-transform duration-500 group-hover:translate-x-1.5" />
            </Link>
          )}
        </Reveal>
      )}
    </div>
  );
}
