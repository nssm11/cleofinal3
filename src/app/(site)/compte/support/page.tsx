import type { Metadata } from "next";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { orders, supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { customerConversations, messagePage } from "@/lib/support/queries";
import { anyAgentOnline, teamPresence } from "@/lib/support/bus";
import { ClientChat } from "@/components/support/client-chat";
import { AccountHeader } from "@/components/account/account-ui";

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
    <div className="max-w-[62rem]">
      <AccountHeader
        index="07"
        eyebrow={copy.chat.title}
        title={copy.account.nav.support[1]}
        description={copy.account.questionText}
        action={{ href: "/aide", label: copy.header.help }}
      />
      <div className="mt-9">
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
