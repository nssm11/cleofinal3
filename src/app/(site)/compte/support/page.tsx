import type { Metadata } from "next";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { customerConversations, messagePage } from "@/lib/support/queries";
import { anyAgentOnline, teamPresence } from "@/lib/support/bus";
import Link from "next/link";
import { ClientChat } from "@/components/support/client-chat";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "La conciergerie" };

/**
 * LA CONCIERGERIE — the customer's live thread with the house.
 *
 * The server renders the initial truth: the customer's conversations, the
 * open thread (newest page), who is at the counter. From there the line
 * (SSE) keeps it moving; nothing on this page is simulated.
 */
export default async function SupportPage({ searchParams }: { searchParams: Promise<{ ticket?: string; order?: string }> }) {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const sp = await searchParams;

  const tickets = await customerConversations(me);

  // Which conversation is open: an explicit one (if it is mine), otherwise
  // the active one, otherwise the most recent.
  let activeId: number | null = null;
  if (sp.ticket) {
    const id = Number(sp.ticket);
    if (Number.isInteger(id) && tickets.some((t) => t.id === id)) activeId = id;
  }
  if (activeId == null) {
    const active = tickets.find((t) => t.status === "open" || t.status === "in_progress");
    activeId = (active ?? tickets[0])?.id ?? null;
  }

  // Order context: honoured only when the row proves the order is the
  // customer's — the claim itself is never trusted.
  let orderNumber: string | null = null;
  const claim = (sp.order ?? "").trim().slice(0, 24);
  if (claim && activeId == null) {
    const [o] = await db.select({ number: orders.number }).from(orders).where(and(eq(orders.number, claim), eq(orders.userId, me.id))).limit(1);
    if (o) orderNumber = o.number;
  }

  const thread =
    activeId != null
      ? await (async () => {
          const page = await messagePage({ ticketId: activeId, limit: 40, excludeNotes: true });
          return { messages: [...page.messages].reverse(), hasMore: page.hasMore };
        })()
      : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3">
            <span className="font-display text-[13px] italic leading-none text-champagne-2">08</span>
            <span className="eyebrow">{copy.chat.title}</span>
          </p>
          <h2 className="mt-2.5 font-display text-[clamp(1.35rem,3vw,1.8rem)] leading-tight tracking-[-0.015em] text-ink">
            {copy.account.nav.support[1]}
          </h2>
        </div>
        <Link href="/aide" className="btn-ghost shrink-0">
          {copy.header.help}
        </Link>
      </div>
      <div>
        <ClientChat
          me={{ id: me.id, firstName: me.firstName ?? null, locale: me.locale }}
          tickets={tickets}
          activeId={activeId}
          thread={thread}
          agents={teamPresence()}
          agentsOnline={anyAgentOnline()}
          orderNumber={orderNumber}
        />
      </div>
    </div>
  );
}
