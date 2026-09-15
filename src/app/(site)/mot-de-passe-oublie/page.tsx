import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/account/auth-forms";
import { Atmosphere } from "@/components/motion/atmosphere";
import { Reveal } from "@/components/motion/reveal";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

/**
 * LA LETTRE — a private matter, handled in private.
 *
 * The narrowest room of the four: a single sheet set on the ivory, a hairline
 * double rule at the crown like the fold of an envelope, and nothing else
 * competing. One field, one gesture, and the door behind you.
 */
export default async function MotDePasseOubliePage() {
  if (await getCurrentUser()) redirect("/compte");
  const t = (await getCopy()).auth;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ivory">
      <Atmosphere tone="ivory" ribs={false} halo={false} />

      <div className="relative flex min-h-dvh items-center justify-center px-5 py-16 lg:px-8">
        <div className="w-full max-w-[26rem]">
          <Reveal y={12} amount={0.05}>
            <div aria-hidden className="mb-8 space-y-1.5">
              <div className="h-px w-16 bg-champagne-2/70" />
              <div className="h-px w-10 bg-champagne-2/40" />
            </div>
            <p className="rule-label mb-5">Le temps d&apos;un</p>
            <h1 className="font-display text-[clamp(1.8rem,3.2vw,2.5rem)] leading-[1.06] tracking-[-0.024em] text-ink">
              nouveau mot de passe <em className="text-champagne-2">en douceur</em>
            </h1>
            <p className="mt-5 max-w-[40ch] text-[14px] leading-[1.8] text-muted">{t.forgotIntro}</p>
          </Reveal>

          <Reveal y={14} delay={0.07} amount={0.05}>
            <div className="surface mt-9 p-6 sm:p-8">
              <ForgotPasswordForm />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
