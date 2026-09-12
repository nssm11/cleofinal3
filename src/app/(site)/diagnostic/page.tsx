import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { Diagnostic } from "@/components/experience/diagnostic";
import { Atmosphere } from "@/components/motion/atmosphere";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Le diagnostic — conseil personnalisé",
  description: "Cinq minutes de questions, une sélection commentée par nos pharmaciens, sauvegardée dans votre compte.",
  alternates: { canonical: "/diagnostic" },
};

export default async function DiagnosticPage() {
  const [copy, user] = await Promise.all([getCopy(), getCurrentUser()]);
  const t = copy.quiz;
  return (
    <div className="relative min-h-dvh">
      <Atmosphere tone="ivory" halo />
      <div className="relative container-lux pb-20 pt-28 lg:pb-28 lg:pt-36">
        <Reveal>
          <Diagnostic questions={t.questions as unknown as { key: string; label: string; options: { v: string; l: string; d: string }[] }[]} isAuthed={!!user} />
        </Reveal>
      </div>
    </div>
  );
}
