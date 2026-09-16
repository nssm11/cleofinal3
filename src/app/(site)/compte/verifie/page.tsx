import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { otpRemainingMs } from "@/lib/email/otp";
import { AccountCard, cardPad } from "@/components/account/account-ui";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";
import { VerifyKeyForm } from "./verify-key-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vérification de l'adresse" };

/**
 * LA CLÉ — the six-digit room. A new account stands here, door ajar, until
 * its owner proves the address. The countdown is computed server-side at
 * render (the client only counts down from it); the resend respects the
 * 60-second cooldown server-side, which the form mirrors.
 */
export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/verifie");
  if (user.emailVerifiedAt) redirect("/compte");
  const remainingMs = await otpRemainingMs(user.id);
  const tn = user.locale !== "fr";

  return (
    <div className="max-w-[44rem]">
      <SectionBrow
        index="11"
        eyebrow={tn ? "El adresse el mte3ek" : "Vérification"}
        title={tn ? "Verifiha el adresse el mte3ek" : "Prouvez cette adresse"}
        description={
          tn
            ? "Neb3athouk kod 6 chiffre lel adresse el mte3ek. El kod valide 10 minutes."
            : "Un code à six chiffres vient de partir vers votre adresse. Il est valable dix minutes."
        }
      />

      <div className="mt-9">
        <Reveal y={14} amount={0.05}>
          <AccountCard accent>
            <div className={cardPad}>
              <VerifyKeyForm
                email={user.email}
                initialRemainingMs={remainingMs}
                locale={tn ? "tn" : "fr"}
              />
            </div>
          </AccountCard>
        </Reveal>
      </div>
    </div>
  );
}
