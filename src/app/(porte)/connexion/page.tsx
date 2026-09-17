import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "@/components/account/auth-forms";
import { AuthRoom, LedgerHead } from "@/components/account/auth-room";
import { AUTH_CINEMA } from "@/lib/auth-cinema";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

/**
 * LE SEUIL — la porte de la maison.
 *
 * The house's own film on the left, the ledger on the right: the visitor is
 * already inside the world before typing anything. Nothing to prove, nothing
 * to sell — just the register, open, and the fields ruled on porcelain.
 */
export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;
  const scene = AUTH_CINEMA.login;

  return (
    <AuthRoom
      film={scene.video}
      filmMobile={scene.mobileVideo}
      poster={scene.poster}
      kicker={t.loginKicker}
      lines={[{ t: "La maison" }, { t: "vous attendait.", em: true }]}
      caption="Vos commandes, vos adresses, votre cercle : tout est resté là où vous l'avez laissé. Aucune donnée ne quitte la maison, aucun mot de passe ne circule en clair."
      facts={t.facts}
    >
      <LedgerHead
        kicker="Accès client"
        title={t.loginTitle1}
        em={t.loginTitle2}
        lead="Un seul mot de passe ouvre vos commandes, votre carte de fidélité et votre diagnostic de peau."
      />
      <div className="mt-9">
        <LoginForm next={safeNext || undefined} />
      </div>
    </AuthRoom>
  );
}
