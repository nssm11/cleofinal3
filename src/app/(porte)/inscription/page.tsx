import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/validation";
import { RegisterForm } from "@/components/account/auth-forms";
import { AuthRoom, LedgerHead } from "@/components/account/auth-room";
import { AUTH_CINEMA } from "@/lib/auth-cinema";
import { getCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

/**
 * LE GRAND REGISTRE — devenir cliente de la maison.
 *
 * The register and the counter, side by side: the film carries the house's
 * hand (the counter of Ez Zahra, the paper, the light), the ledger carries the
 * four lines we need. Symmetry with the door, inverted — the visitor arrives
 * on the film first, then sits down at the desk.
 */
export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next, "");
  if (await getCurrentUser()) redirect(safeNext || "/compte");
  const t = (await getCopy()).auth;
  const scene = AUTH_CINEMA.register;

  return (
    <AuthRoom
      flip
      film={scene.video}
      filmMobile={scene.mobileVideo}
      poster={scene.poster}
      kicker={t.registerKicker}
      lines={[{ t: "La maison tient" }, { t: "son registre.", em: true }]}
      caption="Rejoindre Cléopâtre, c'est confier sa peau à des pharmaciennes : chaque référence est lue, testée, et tenue en stock pour vous."
      facts={t.facts}
      rail="NOUVELLE CLIENTE — REGISTRE DE LA MAISON"
    >
      <LedgerHead
        kicker="Ouvrir un compte"
        title={t.registerTitle1}
        em={t.registerTitle2}
        lead="Quatre lignes suffisent. Ensuite : vos commandes, vos favoris, votre diagnostic, vos points — et l'accès au tiroir de vos récompenses."
      />
      <div className="mt-9">
        <RegisterForm next={safeNext || undefined} />
      </div>
    </AuthRoom>
  );
}
