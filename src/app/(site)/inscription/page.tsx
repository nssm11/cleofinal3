import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { RegisterForm } from "@/components/account/auth-forms";
import { Atmosphere } from "@/components/motion/atmosphere";
import { Reveal } from "@/components/motion/reveal";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

/**
 * LE GRAND REGISTRE — becoming a member of the house.
 *
 * Not a copy of the door: a bright, two-column room. On the left, the light —
 * marble veining, a warm radial, the house's facts in two measured columns.
 * On the right, the ledger itself: the form on a sheet of ivory, the whole
 * attention on it.
 */
export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas">
      <Atmosphere tone="ivory" />

      <div className="relative shell-wide grid min-h-dvh gap-14 lg:grid-cols-12 lg:gap-16">
        {/* The light — architecture, not illustration. */}
        <div className="hidden flex-col justify-between py-14 lg:col-span-5 lg:flex lg:py-20">
          <div className="relative my-8 flex-1">
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <div className="ribs absolute inset-0 opacity-60" />
              <div aria-hidden className="dispensary absolute inset-x-0 top-[12%] h-[52%] opacity-70" />
            </div>
            <p
              className="absolute bottom-0 left-0 hidden text-[10px] font-bold uppercase tracking-[0.42em] text-faint xl:block"
              style={{ writingMode: "vertical-rl" }}
            >
              {t.privateSpace}
            </p>
            <p className="absolute left-0 top-[16%] max-w-[15ch] font-ant uppercase text-[clamp(1.5rem,2.2vw,1.9rem)] leading-[1.25] text-steel">
              La maison se souvient de celles et ceux qui la rejoignent.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line/70 pt-8">
            {t.facts.map(([n, l]) => (
              <div key={l}>
                <dt className="font-ant uppercase text-[19px] tabular-nums text-carbon">{n}</dt>
                <dd className="mt-1 text-[11.5px] leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The ledger — the form. */}
        <div className="col-span-full flex flex-col justify-center py-16 lg:col-span-6 lg:col-start-7 lg:py-24">
          <div className="w-full max-w-[30rem]">
            <Reveal y={12} amount={0.05}>
              <p className="kicker mb-6">{t.registerKicker}</p>
              <h1 className="font-ant uppercase text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.06] tracking-[-0.024em] text-carbon">
                {t.registerTitle1} <em className="text-iodine-deep">{t.registerTitle2}</em>
              </h1>
            </Reveal>

            <Reveal y={14} delay={0.07} amount={0.05}>
              <div className="surface mt-10 p-6 sm:p-8">
                <RegisterForm next={safeNext || undefined} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
