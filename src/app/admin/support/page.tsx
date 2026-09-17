import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, ne } from "drizzle-orm";
import { db } from "@/db";
import { returnRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { supportInbox, supportMetrics, ticketContext, messagePage, type InboxFilter } from "@/lib/support/queries";
import { teamPresence } from "@/lib/support/bus";
import { SupportInbox, type InboxContext, type InboxMetrics } from "@/components/support/support-inbox";
import { Tag } from "@/components/admin/os/primitives";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS: InboxFilter[] = ["all", "waiting", "mine", "unread", "active", "resolved", "closed"];

const RETURN_STATUS: Record<string, string> = {
  pending: "Nouvelle",
  in_review: "En cours",
  awaiting_customer: "Attente client",
  approved: "Approuvée",
  rejected: "Refusée",
  completed: "Terminée",
};

/**
 * LE COMPTOIR DU SUPPORT — the live inbox.
 *
 * Three panes on the desk (conversations, the thread, the client), a ledger
 * strip of real figures above them, the team's presence on the rail. The
 * server renders the first truth; the SSE line keeps it moving.
 */
export default async function AdminSupport({ searchParams }: { searchParams: Promise<{ ticket?: string; filter?: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "support")) redirect("/admin");
  const sp = await searchParams;
  const filter: InboxFilter = FILTERS.includes((sp.filter ?? "") as InboxFilter) ? ((sp.filter ?? "all") as InboxFilter) : "all";

  const [tickets, metrics, agents, returns] = await Promise.all([
    supportInbox({ me: user, filter, limit: 60 }),
    supportMetrics(user),
    Promise.resolve(teamPresence()),
    db.query.returnRequests.findMany({ where: ne(returnRequests.status, "completed"), orderBy: desc(returnRequests.createdAt), with: { order: true, orderItem: true }, limit: 20 }),
  ]);

  let activeId: number | null = null;
  if (sp.ticket) {
    const id = Number(sp.ticket);
    if (Number.isInteger(id) && tickets.some((t) => t.id === id)) activeId = id;
  }
  if (activeId == null) activeId = tickets[0]?.id ?? null;

  const thread =
    activeId != null
      ? await (async () => {
          const p = await messagePage({ ticketId: activeId, limit: 40, excludeNotes: false });
          return { messages: [...p.messages].reverse(), hasMore: p.hasMore };
        })()
      : null;
  const context: InboxContext | null = activeId != null ? ((await ticketContext({ ticketId: activeId, viewer: user })) as InboxContext | null) : null;

  return (
    <div className="flex h-[calc(100dvh-4rem-4.75rem)] min-h-[500px] flex-col lg:h-[calc(100dvh-4rem)]">
      {returns.length > 0 && (
        <details className="group border-b border-ops-line bg-ops-sheet-2/50">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ops-muted transition-colors hover:text-ops-ink">
            <span className="text-ops-signal">◈</span> Retours en attente — {returns.length}
            <span className="ms-auto text-ops-line transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="space-y-2 px-4 pb-3">
            {returns.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-ops-line bg-ops-sheet px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[12px] text-ops-ink">
                    <span className="font-mono text-ops-signal">{r.number}</span>
                    <span className="mx-2 text-ops-line">·</span>
                    {r.orderItem?.name ?? "Article"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-ops-faint">
                    {r.order && (
                      <Link href={`/admin/commandes/${r.order.id}`} className="text-ops-ink underline underline-offset-2">
                        {r.order.number}
                      </Link>
                    )}
                    {" "}· {r.reason} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <Tag tone={r.status === "rejected" ? "bad" : r.status === "approved" ? "good" : "warn"}>{RETURN_STATUS[r.status] ?? r.status}</Tag>
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="min-h-0 flex-1">
        <SupportInbox
          me={{ id: user.id, firstName: user.firstName ?? null, lastName: user.lastName ?? null, role: user.role }}
          tickets={tickets}
          activeId={activeId}
          thread={thread}
          context={context}
          metrics={metrics as InboxMetrics}
          agents={agents}
          filter={filter}
          q=""
        />
      </div>
    </div>
  );
}
