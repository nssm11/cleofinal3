import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { returnRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { formatDT } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes retours" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Nouvelle",
  in_review: "En cours",
  awaiting_customer: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  completed: "Terminée",
};

export default async function ReturnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte/retours");
  const returns = await db.query.returnRequests.findMany({ where: eq(returnRequests.userId, user.id), orderBy: desc(returnRequests.createdAt), with: { order: true, orderItem: true } });

  if (!returns.length) {
    return (
      <div className="border border-dashed border-line p-12 text-center">
        <p className="font-sans text-[18px] font-semibold">Aucun retour en cours</p>
        <p className="mt-2 font-sans text-[13px] text-text-secondary">Vous pouvez demander un retour depuis le détail d'une commande.</p>
        <Link href="/compte/commandes" className="btn-primary mt-6 inline-flex">Voir mes commandes</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">09 — Mes retours</p>
        <h1 className="mt-3 font-sans text-[24px] font-semibold tracking-[-0.02em]">Suivi de vos retours</h1>
        <p className="mt-2 font-sans text-[13px] text-text-secondary">Traitement sous 24h ouvrées.</p>
      </div>

      <ul className="mt-8 space-y-4">
        {returns.map((r) => (
          <li key={r.id} className="border border-line bg-bg p-6">
            <div className="flex justify-between">
              <p className="font-mono text-[14px]">{r.number}</p>
              <span className="border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]">{STATUS_LABELS[r.status] ?? r.status}</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-text-muted">Demandé le {formatDate(r.createdAt)}</p>
            {r.order && <p className="mt-3 font-mono text-[11px]">Commande <Link href={`/compte/commandes/${r.order.number}`} className="underline">{r.order.number}</Link> — {formatDT(r.order.totalMillimes)}</p>}
            <div className="mt-4 border-t border-line pt-4 space-y-2 font-sans text-[13px]">
              {r.orderItem && <p className="font-medium">{r.orderItem.name}</p>}
              <p><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Motif:</span> {r.reason}</p>
              {r.message && <p className="border-l border-ink pl-3 italic">« {r.message} »</p>}
              {r.staffNote && <div className="border border-ink bg-bg-2 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Réponse équipe</p><p className="mt-2">{r.staffNote}</p></div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
