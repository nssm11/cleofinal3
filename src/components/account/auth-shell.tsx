import type { ReactNode } from "react";
import { Atmosphere } from "@/components/motion/atmosphere";
import { Reveal } from "@/components/motion/reveal";

/**
 * LE SEUIL — the threshold.
 *
 * Entering an account should feel like stepping from the street into a quiet
 * room, not like filing a form. So: no photograph, no black panel. A shallow
 * apricot light, an architectural grid, the wordmark set vertically — and the
 * form arriving in the second column with all its attention.
 */
export function AuthShell({
  title,
  kicker,
  note,
  children,
}: {
  title: ReactNode;
  kicker: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-paper">
      <Atmosphere tone="ivory" halo={false} />

      <div className="relative container-wide grid min-h-dvh gap-14 lg:grid-cols-12 lg:gap-16">
        {/* The wall — architecture, not illustration. No logo here: the house
            header floats above the page and already signs the threshold, so a
            second mark would only repeat itself. */}
        <div className="hidden flex-col justify-between py-14 lg:col-span-5 lg:flex lg:py-20">
          <div className="relative my-10 flex-1">
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <div className="ribs absolute inset-0 opacity-60" />
              <div
                className="absolute inset-x-0 top-1/4 h-[46%] bg-gradient-to-b from-champagne-soft/50 to-transparent"
                style={{ backgroundImage: "radial-gradient(120% 80% at 20% 0%, rgba(203,176,120,0.35), transparent 70%)" }}
              />
            </div>
            <p
              className="absolute bottom-0 left-0 hidden text-[10px] font-bold uppercase tracking-[0.42em] text-muted-2 xl:block"
              style={{ writingMode: "vertical-rl" }}
            >
              Ezzahra — Hammam-Lif · depuis 1978
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-stone/70 pt-8">
            {[
              ["2 h", "Retrait en boutique"],
              ["24–72 h", "Livraison en Tunisie"],
              ["7 j", "Retours non ouverts"],
              ["100 %", "Distributeur officiel"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-[19px] tabular-nums text-ink">{n}</dt>
                <dd className="mt-1 text-[11.5px] leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The ledger — the form */}
        <div className="col-span-full flex flex-col justify-center py-16 lg:col-span-6 lg:col-start-7 lg:py-24">
          <div className="w-full max-w-[27rem]">
            <Reveal y={12} amount={0.05}>
              <p className="rule-label mb-6">{kicker}</p>
              <h1 className="font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.06] tracking-[-0.024em] text-ink">
                {title}
              </h1>
              {note && <p className="mt-5 text-[14px] leading-[1.8] text-muted">{note}</p>}
            </Reveal>

            <div className="mt-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
