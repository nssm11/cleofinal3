import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { Atmosphere } from "@/components/motion/atmosphere";
import { Reveal } from "@/components/motion/reveal";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

/**
 * LA PORTE — et elle mène au même endroit que le registre.
 *
 * This page used to be its own film: a full-bleed video, a scrim over it, the
 * form floating on the dark. It was handsome and it was wrong — arriving at a
 * shop you already belong to looked nothing like arriving for the first time,
 * and a customer who had just signed up met a different house on her second
 * visit.
 *
 * So the door now follows the register, exactly: the same light ground, the
 * same two columns, the same architecture on the left, the same ivory sheet
 * for the form on the right. One difference, and it is the only one that
 * should exist — the words on the left speak to someone coming back:
 * "Ce que vous avez laissé ici vous attend."
 */
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas">
      <Atmosphere tone="ivory" />

      <div className="relative shell-wide grid min-h-dvh gap-14 lg:grid-cols-12 lg:gap-16">
        {/* The light — the same architecture as the register, so the two
            pages read as two rooms of one house and not as two websites. */}
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
            <p className="absolute left-0 top-[16%] max-w-[17ch] font-ant uppercase text-[clamp(1.5rem,2.2vw,1.9rem)] leading-[1.25] text-steel">
              Ce que vous avez laissé ici vous attend.
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

        {/* The sheet — the form, exactly where the register puts its own. */}
        <div className="col-span-full flex flex-col justify-center py-16 lg:col-span-6 lg:col-start-7 lg:py-24">
          <div className="w-full max-w-[32rem]">
            <Reveal y={12} amount={0.05}>
              <p className="kicker mb-6">{t.loginKicker}</p>
              <h1 className="font-ant uppercase text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.06] tracking-[-0.024em] text-carbon">
                {t.loginTitle1} <em className="text-iodine">{t.loginTitle2}</em>
              </h1>
            </Reveal>

            <Reveal y={14} delay={0.07} amount={0.05}>
              <div className="surface mt-10 p-6 sm:p-8">
                <LoginForm next={safeNext || undefined} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
