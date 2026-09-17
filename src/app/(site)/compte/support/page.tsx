import type { Metadata } from "next";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { customerConversations, messagePage } from "@/lib/support/queries";
import { anyAgentOnline, teamPresence } from "@/lib/support/bus";
import Link from "next/link";
import { ClientChat } from "@/components/support/client-chat";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "La conciergerie" };

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ ticket?: string; order?: string }> }) {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const sp = await searchParams;
  const tickets = await customerConversations(me);
  let activeId: number | null = null;
  if (sp.ticket) { const id = Number(sp.ticket); if (Number.isInteger(id) && tickets.some((t) => t.id === id)) activeId = id; }
  if (activeId == null) { const active = tickets.find((t) => t.status === "open" || t.status === "in_progress"); activeId = (active ?? tickets[0])?.id ?? null; }
  let orderNumber: string | null = null;
  const claim = (sp.order ?? "").trim().slice(0, 24);
  if (claim && activeId == null) { const [o] = await db.select({ number: orders.number }).from(orders).where(and(eq(orders.number, claim), eq(orders.userId, me.id))).limit(1); if (o) orderNumber = o.number; }
  const thread = activeId != null ? await (async () => { const page = await messagePage({ ticketId: activeId, limit: 40, excludeNotes: true }); return { messages: [...page.messages].reverse(), hasMore: page.hasMore }; })() : null;

  return (
    <div>
      <div className="border-b border-line pb-6 flex justify-between items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">08 — Conciergerie</p>
          <h1 className="mt-3 font-sans text-[24px] font-semibold tracking-[-0.02em]">{copy.account.nav.support[1]}</h1>
        </div>
        <Link href="/aide" className="btn-ghost">Aide →</Link>
      </div>
      <div className="mt-8"><ClientChat me={{ id: me.id, firstName: me.firstName ?? null, locale: me.locale }} tickets={tickets} activeId={activeId} thread={thread} agents={teamPresence()} agentsOnline={anyAgentOnline()} orderNumber={orderNumber} /></div>
    </div>
  );
}
