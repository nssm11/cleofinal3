import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AddressList, PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { AccountCard, cardPad } from "@/components/account/account-ui";
import { SectionBrow } from "@/components/orders/order-cards";
import { Reveal } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon profil" };

/**
 * LE PROFIL — the customer's own facts, in three rooms: the personal
 * information, the security, and the addresses. Each room is a card with a
 * single purpose; the forms keep their house fields.
 */
export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/profil");
  const list = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(desc(addresses.isDefault));

  return (
    <div className="max-w-[60rem]">
      <SectionBrow
        index="10"
        eyebrow="Profil & adresses"
        title="Votre profil"
        description="Vos informations, votre sécurité et vos adresses — chaque chose dans sa pièce."
      />

      <div className="mt-9 space-y-6">
        <Reveal y={14} amount={0.05}>
          <AccountCard>
            <div className={cardPad}>
              <p className="kicker mb-7 text-iodine-deep">Informations personnelles</p>
              <ProfileForm user={user} />
            </div>
          </AccountCard>
        </Reveal>

        <Reveal y={14} delay={0.07} amount={0.05}>
          <AccountCard>
            <div className={cardPad}>
              <p className="kicker mb-7 text-iodine-deep">Sécurité</p>
              <PasswordForm />
            </div>
          </AccountCard>
        </Reveal>

        <Reveal y={14} delay={0.14} amount={0.05}>
          <section>
            <p className="kicker mb-6 text-iodine-deep">Adresses</p>
            <AddressList addresses={list} />
          </section>
        </Reveal>
      </div>
    </div>
  );
}
