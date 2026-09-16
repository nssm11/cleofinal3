import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import type { getCopy } from "@/lib/i18n/server";

type Copy = Awaited<ReturnType<typeof getCopy>>;

/**
 * THE COUNSEL — the pharmacist's door, framed in light.
 *
 * A hairline panel between the rayons and the other chapters: the doubt in
 * the display face, two quiet gestures — the guided diagnostic, the
 * boutiques where humans wait.
 */
export function VisageAdvice({ copy }: { copy: Copy }) {
  return (
    <section aria-label={copy.univers.askAdvice} className="bg-cine-noir">
      <div className="container-wide pb-20 lg:pb-28">
        <div className="grid gap-10 border border-cine-line bg-cine-noir-2/50 px-6 py-12 sm:px-10 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-14 lg:py-16">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-4">
              <span className="cine-index">04</span>
              <span className="h-px w-10 bg-cine-line" aria-hidden />
              <span className="cine-kicker">{copy.product.advice}</span>
            </p>
            <h2 className="cine-title mt-6 max-w-[22ch]">{copy.univers.askAdvice}</h2>
            <p className="mt-4 text-[14px] leading-[1.85] text-cine-mist">{copy.categorie.doubtCta}</p>
          </div>
          <div className="flex flex-col items-start gap-6 lg:col-span-5 lg:items-end">
            <Link href="/diagnostic" className="cine-cta">
              {copy.footer.links.diagnostic}
              <ArrowRightIcon size={14} strokeWidth={1.5} className="rtl-mirror" aria-hidden />
            </Link>
            <Link
              href="/boutiques"
              className="group inline-flex min-h-11 items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-cine-mist transition-colors duration-500 hover:text-cine-gold"
            >
              {copy.footer.links.stores}
              <ArrowRightIcon size={13} className="transition-transform duration-500 group-hover:translate-x-1 rtl-mirror" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
