import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { beautyProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getByIds } from "@/lib/catalog";
import { ADVISOR_QUESTIONS } from "@/lib/advisor-questions";
import { ProductGrid } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/primitives";
import { SparkIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * MON DIAGNOSTIC.
 *
 * On relit ici ce qui avait été conseillé, et surtout **pourquoi** : les
 * réponses sont restituées dans les mots du questionnaire, pas sous forme de
 * codes. Un conseil dont on a perdu la raison se lit comme une publicité reçue
 * par erreur.
 *
 * Les références ne sont pas relues depuis la table : on reprend les
 * identifiants conseillés et on les recharge. Une référence retirée du
 * catalogue disparaît donc d'elle-même, au lieu de rester affichée morte.
 */
export default async function DiagnosticPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/diagnostic");

  const [profile] = await db
    .select()
    .from(beautyProfiles)
    .where(eq(beautyProfiles.userId, user.id))
    .orderBy(desc(beautyProfiles.createdAt))
    .limit(1);

  if (!profile) {
    return (
      <EmptyState
        icon={<SparkIcon size={22} />}
        title="Pas encore de diagnostic"
        description="Quatre questions à un pharmacien : votre type de peau, votre priorité, le temps dont vous disposez. Le conseil reste ici."
        action={{ href: "/conseil", label: "Faire le diagnostic" }}
      />
    );
  }

  const items = await getByIds(profile.recommendations);

  /** Les réponses remises en phrases, dans l'ordre du questionnaire. */
  const recap = ADVISOR_QUESTIONS.map((q) => ({
    ask: q.ask,
    label: q.options.find((o) => o.value === profile.answers[q.id])?.label ?? "—",
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-display-sm text-ink">Mon diagnostic</h2>
        <p className="text-[12px] text-muted-2">Établi le {formatDate(profile.createdAt)}</p>
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-4 border-y border-stone py-5 sm:grid-cols-2">
        {recap.map((r) => (
          <div key={r.ask}>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-2">{r.ask}</dt>
            <dd className="mt-1 text-[14.5px] text-ink">{r.label}</dd>
          </div>
        ))}
      </dl>

      {items.length > 0 ? (
        <>
          <p className="eyebrow mt-8 text-champagne-2">Ce que nous vous avions conseillé</p>
          <div className="mt-5">
            <ProductGrid items={items} isAuthed priorityCount={0} />
          </div>
        </>
      ) : (
        <p className="mt-8 text-sm text-muted">
          Les références conseillées ne sont plus disponibles. Le conseil, lui, reste valable.
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/conseil" className="btn-secondary">
          Refaire le diagnostic
        </Link>
        <a href="tel:+21671450210" className="btn-ghost">
          En parler à un pharmacien — 71 450 210
        </a>
      </div>
    </div>
  );
}
