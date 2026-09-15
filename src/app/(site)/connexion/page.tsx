import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { Reveal } from "@/components/motion/reveal";
import { AUTH_CINEMA } from "@/lib/auth-cinema";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

/**
 * LA PORTE — the cinematic entrance.
 *
 * The house's own login film fills the frame. The form sits on the LEFT,
 * open on the light — no box around it: the fields keep their own quiet
 * wash, and the veil (translucent ivory, weighted to the side of the words,
 * thinning toward the film) does the work a panel would have done. No dark
 * tint anywhere.
 */
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;
  const scene = AUTH_CINEMA.login;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-cream">
      {/* The door's own film — first paint is the still, the light fades in. */}
      <CinematicVideo
        sources={{ desktop: scene.video, mobile: scene.mobileVideo }}
        poster={scene.poster}
        alt={scene.alt}
        eager
      />

      {/* The veil — very subtle: ivory is densest at the edge where the
          words live, thins toward the film so the frame stays visible.
          One warm radial of champagne at the crown. No dark tint. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ivory/82 via-ivory/38 to-ivory/8 lg:from-ivory/85 lg:via-ivory/30 lg:to-ivory/5"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(70% 55% at 18% 12%, rgba(236,217,164,0.26), transparent 62%)" }}
      />

      <div className="relative flex min-h-dvh items-center">
        <div className="container-wide w-full">
          {/* The form — on the side, open, no box around it. */}
          <div className="w-full max-w-[26rem] pb-10 pt-2 lg:pb-0 lg:pt-0">
            <Reveal y={14} amount={0.05}>
              <p className="rule-label mb-6 text-champagne-2">{t.loginKicker}</p>
              <h1 className="font-display text-[clamp(2.1rem,4vw,3rem)] leading-[1.04] tracking-[-0.024em] text-ink">
                {t.loginTitle1} <em className="text-champagne-2">{t.loginTitle2}</em>
              </h1>
            </Reveal>

            <Reveal y={16} delay={0.08} amount={0.05}>
              <div className="mt-10">
                <LoginForm next={safeNext || undefined} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
