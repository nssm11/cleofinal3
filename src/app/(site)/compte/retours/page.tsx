import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { returnRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { formatDT } from "@/lib/money";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { AccountCard, AccountHeader, cardPad } from "@/components/account/account-ui";
import { Reveal } from "@/components/motion/reveal";
import { PackageIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes retours" };

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "accent" | "warning" | "success" | "error" }> = {
  pending: { label: "Nouvelle", tone: "accent" },
  in_review: { label: "En cours", tone: "warning" },
  awaiting_customer: { label: "En attente de votre réponse", tone: "warning" },
  approved: { label: "Approuvée", tone: "success" },
  rejected: { label: "Refusée", tone: "error" },
  completed: { label: "Terminée", tone: "success" },
};

/**
 * LES RETOURS — each request as a case file: the reference, its state, the
 * order and the item at its head, the reason, the customer's own words, and
 * the house's answer when it has come.
 */
export default async function ReturnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/retours");
  const returns = await db.query.returnRequests.findMany({
    where: eq(returnRequests.userId, user.id),
    orderBy: desc(returnRequests.createdAt),
    with: {
      order: true,
      orderItem: true,
    },
  });

  if (!returns.length) {
    return (
      <EmptyState
        icon={<PackageIcon size={28} />}
        title="Aucun retour en cours"
        description="Vous pouvez demander un retour depuis le détail d'une commande livrée ou expédiée."
        action={{ href: "/compte/commandes", label: "Voir mes commandes" }}
      />
    );
  }

  return (
    <div>
      <AccountHeader
        index="08"
        eyebrow="Mes retours"
        title="Suivi de vos retours"
        description="Notre équipe traite les demandes sous 24 h ouvrées."
      />

      <ul className="mt-9 space-y-5">
        {returns.map((r, i) => {
          const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
          return (
            <Reveal as="li" key={r.id} y={14} delay={Math.min(i * 0.06, 0.3)} amount={0.05}>
              <AccountCard hover={false} className="group">
                <div className={cardPad}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3.5">
                      <p className="font-display text-[18px] italic text-ink">{r.number}</p>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                    <p className="text-[11.5px] text-muted-2">Demandé le {formatDate(r.createdAt)}</p>
                  </div>

                  {r.order && (
                    <p className="mt-4 text-[12px] text-muted-2">
                      Commande{" "}
                      <Link href={`/compte/commandes/${r.order.number}`} className="link-underline text-ink">
                        {r.order.number}
                      </Link>
                    </p>
                  )}

                  <div className="mt-5 space-y-4 border-t border-stone/60 pt-5">
                    {r.orderItem && <p className="text-[14px] font-medium text-charcoal">{r.orderItem.name}</p>}
                    <p className="text-[13.5px] text-muted">
                      <span className="font-medium text-charcoal">Motif&nbsp;:</span> {r.reason}
                    </p>
                    {r.message && <p className="border-l-2 border-stone-2/70 ps-4 text-[13px] italic leading-relaxed text-muted">«&nbsp;{r.message}&nbsp;»</p>}
                    {r.staffNote && (
                      <div className="rounded-[3px] border border-champagne-2/35 bg-champagne-soft/50 p-5">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-champagne-2">Réponse de l&apos;équipe</p>
                        <p className="mt-2.5 text-[13.5px] leading-relaxed text-charcoal">{r.staffNote}</p>
                      </div>
                    )}
                  </div>

                  {r.order && (
                    <p className="mt-5 border-t border-stone/60 pt-4 text-[12px] text-muted-2">
                      Montant de la commande : <span className="tabular-nums text-charcoal">{formatDT(r.order.totalMillimes)}</span>
                    </p>
                  )}
                </div>
              </AccountCard>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
