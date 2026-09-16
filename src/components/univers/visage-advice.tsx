import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { InfoIcon, ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * VISAGE ADVICE — the pharmacist's callout.
 *
 * The old page ended its shelf with a ghost link. The same two doors —
 * the guided diagnostic and a human conversation — now arrive as a house
 * `alert` callout, impossible to walk past.
 */
export function VisageAdvice({ copy }: { copy: Copy }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8 lg:px-10 lg:pb-20">
      <Reveal>
        <div className="alert alert-info items-center gap-4! p-5! sm:p-6!" role="note">
          <InfoIcon size={22} aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="alert-title">{copy.univers.askAdvice}</span>
            <p className="text-[13.5px] leading-relaxed">{copy.categorie.doubt}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link href="/diagnostic" className="btn-primary min-h-11 px-5 text-[11px]">
              Diagnostic <ArrowRightIcon size={12} className="rtl-mirror" />
            </Link>
            <Link href="/boutiques" className="btn-ghost min-h-11 px-4 text-[11px]">
              {copy.footer.links.stores}
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
