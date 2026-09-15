import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets, ticketMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/primitives";
import { AccountCard, AccountHeader, cardPad } from "@/components/account/account-ui";
import { Reveal } from "@/components/motion/reveal";
import { ChatIcon } from "@/components/icons";
import { ContinueTicket } from "@/components/experience/support-thread";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conciergerie & tickets" };

const STATUS: Record<string, { fr: string; tn: string; cls: string }> = {
  open: { fr: "Ouvert", tn: "Meftou7", cls: "bg-warning-soft text-warning" },
  answered: { fr: "Répondu", tn: "Trawwe7", cls: "bg-success-soft text-success" },
  closed: { fr: "Clos", tn: "Mseded", cls: "bg-stone/60 text-charcoal" },
};

/**
 * LA CONCIERGERIE — the customer's thread with the house.
 *
 * Each ticket is a case card: its reference and subject at the head, its
 * state as a small sign, the customer's words in a quiet quote, the house's
 * reply in a champagne panel, the recent messages made easy to scan, and the
 * door to continue the conversation when it is not closed.
 */
export default async function SupportPage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, me.id))
    .orderBy(desc(supportTickets.createdAt))
    .limit(30);
  const ids = tickets.map((x) => x.id);
  const messages = ids.length
    ? await db
        .select()
        .from(ticketMessages)
        .where(inArray(ticketMessages.ticketId, ids))
        .orderBy(desc(ticketMessages.id))
        .limit(400)
    : [];

  return (
    <div className="max-w-[60rem]">
      <AccountHeader
        index="07"
        eyebrow={copy.chat.title}
        title={copy.account.nav.support[1]}
        description={copy.account.questionText}
        action={{ href: "/aide", label: copy.header.help }}
      />

      {tickets.length === 0 ? (
        <Reveal y={10} className="mt-9">
          <EmptyState
            icon={<ChatIcon size={22} />}
            title={copy.account.nav.support[1]}
            description={copy.chat.openHours}
            action={{ href: "/aide", label: copy.header.help }}
          />
        </Reveal>
      ) : (
        <ul className="mt-9 space-y-5">
          {tickets.map((tk, i) => {
            const st = STATUS[tk.status] ?? STATUS.open;
            const thread = messages.filter((m) => m.ticketId === tk.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            return (
              <Reveal as="li" key={tk.id} y={14} delay={Math.min(i * 0.06, 0.3)} amount={0.05}>
                <AccountCard hover={false}>
                  <div className={cardPad}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="min-w-0 font-display text-[17px] leading-snug text-ink">
                        <span className="me-2.5 font-mono text-[12px] text-champagne-2">#{String(tk.id).padStart(5, "0")}</span>
                        {tk.subject}
                      </p>
                      <span className={`shrink-0 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${st.cls}`}>{st.fr}</span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted-2">
                      {copy.common.today === "aujourd'hui" ? "Ouvert le" : "Meftou7 nhar"} {formatDate(tk.createdAt)} — {copy.chat.title}
                    </p>

                    {tk.message && (
                      <p className="mt-5 whitespace-pre-line border-l-2 border-stone-2/80 ps-4 text-[13.5px] leading-relaxed text-charcoal">
                        {tk.message}
                      </p>
                    )}
                    {tk.reply && (
                      <div className="mt-4 rounded-[3px] border border-success/35 bg-success-soft/40 p-4">
                        <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-success">{copy.chat.staffName}</p>
                        <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-charcoal">{tk.reply}</p>
                      </div>
                    )}
                    {thread.length > 0 && (
                      <ul className="mt-5 space-y-3 border-t border-stone/60 pt-5">
                        {thread.slice(-6).map((m) => (
                          <li key={m.id} className="text-[12.5px] leading-relaxed">
                            <span className="font-bold uppercase tracking-[0.14em] text-muted-2">
                              {m.userId === me.id ? copy.common.you : m.isBot ? copy.chat.botName : copy.chat.staffName}
                            </span>
                            <span className="mx-2 text-muted-2">·</span>
                            <span className="text-charcoal">{m.body.slice(0, 300)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {tk.status !== "closed" && (
                      <div className="mt-5 border-t border-stone/60 pt-5">
                        <ContinueTicket ticketId={tk.id} />
                      </div>
                    )}
                  </div>
                </AccountCard>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
}
