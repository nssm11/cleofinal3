import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { CinematicVideo } from "@/components/cinematic/VideoLoader";
import { SectionOverlay } from "@/components/cinematic/SectionOverlay";
import { Reveal } from "@/components/motion/reveal";
import { AUTH_CINEMA } from "@/lib/auth-cinema";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

/**
 * LA PORTE — the cinematic entrance.
 *
 * The house's own login film fills the frame, and the door speaks with
 * exactly the language of the house's film — the campaign scrim of the
 * universe heroes (SectionOverlay, deep), the grain, the micro-caps and
 * hairlines of `cine-kicker`, the Fraunces of `cine-title`, ivory on the
 * dark (the header is over-film on this route too). The form sits on the
 * RIGHT, open on the frame — no boxes anywhere: each field-box is a hairline
 * on the dark, the CTA is the film's ghost line that lengthens.
 */
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;
  const scene = AUTH_CINEMA.login;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-petrol">
      {/* The door's own film — first paint is the still, the light fades in. */}
      <CinematicVideo
        sources={{ desktop: scene.video, mobile: scene.mobileVideo }}
        poster={scene.poster}
        alt={scene.alt}
        eager
      />
      {/* The light on top of the film — the same scrim and grain as every scene. */}
      <SectionOverlay deep />

      <div className="relative flex min-h-dvh items-center">
        <div className="shell-wide w-full">
          {/* The form — on the right side, open, no boxes. */}
          <div className="door-scene ms-auto w-full max-w-[26rem] pb-10 pt-2 lg:pb-0 lg:pt-0">
            <Reveal y={14} amount={0.05}>
              <p className="kicker mb-6 flex items-center gap-5">
                <span aria-hidden className="h-px w-8 bg-night-line sm:w-14" />
                {t.loginKicker}
                <span aria-hidden className="h-px w-8 bg-night-line sm:w-14" />
              </p>
              <h1 className="font-ant text-mega uppercase">
                {t.loginTitle1} <em className="text-iodine">{t.loginTitle2}</em>
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
