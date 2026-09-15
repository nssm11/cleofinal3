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
 * A dedicated film fills the frame — never the homepage's hero. The veil over
 * it is light, never black: a translucent ivory wash and a breath of warm
 * champagne keep the frame luminous while giving the words a quiet ground.
 * The form arrives as a sheet of frosted ivory.
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

      {/* The veil — very subtle: translucent ivory top and bottom, thinner in
          the middle so the frame stays visible, plus one warm radial of
          champagne at the crown. No dark tint anywhere. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ivory/64 via-ivory/30 to-ivory/56" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(92% 58% at 50% 14%, rgba(236,217,164,0.24), transparent 64%)" }}
      />

      <div className="relative flex min-h-dvh items-center justify-center px-5 pb-24 pt-28 lg:px-8">
        <div className="w-full max-w-[27rem]">
          <Reveal y={14} amount={0.05}>
            <p className="rule-label mb-6 text-champagne-2">{t.loginKicker}</p>
            <h1 className="font-display text-[clamp(2rem,4vw,2.85rem)] leading-[1.04] tracking-[-0.024em] text-ink">
              {t.loginTitle1} <em className="text-champagne-2">{t.loginTitle2}</em>
            </h1>
          </Reveal>

          <Reveal y={16} delay={0.08} amount={0.05}>
            <div className="mt-9 border border-white/60 bg-ivory/84 p-6 shadow-float backdrop-blur-xl sm:p-8">
              <LoginForm next={safeNext || undefined} />
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
