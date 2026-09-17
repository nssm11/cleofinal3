import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { AddressList, PasswordForm, ProfileForm } from "@/components/account/profile-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/profil");
  const list = await db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault));

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">10 — Profil & adresses</p>
        <h1 className="mt-3 font-sans text-[24px] font-semibold tracking-[-0.02em]">Votre profil</h1>
        <p className="mt-2 max-w-[50ch] font-sans text-[13px] text-text-secondary">Vos informations, votre sécurité et vos adresses.</p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="border border-line bg-bg p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-6">Informations personnelles</p>
          <ProfileForm user={user} />
        </div>
        <div className="border border-line bg-bg p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-6">Sécurité</p>
          <PasswordForm />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-4">Adresses</p>
          <AddressList addresses={list} />
        </div>
      </div>
    </div>
  );
}
