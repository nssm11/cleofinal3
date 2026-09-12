import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets, ticketMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/primitives";
import { ChatIcon } from "@/components/icons";
import { ContinueTicket } from "@/components/experience/support-thread";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conciergerie & tickets" };

const STATUS: Record<string, { fr: string; tn: string; cls: string }> = {
  open: { fr: "Ouvert", tn: "Meftou7", cls: "bg-warning-soft text-warning" },
  answered: { fr: "Répondu", tn: "Trawwe7", cls: "bg-success-soft text-success" },
  closed: { fr: "Clos", tn: "Mseded", cls: "bg-stone text-muted" },
};

export default async function SupportPage() {
  const me = await getCurrentUser();
  if (!me) return null;
  const copy = await getCopy();
  const isTn = true; // the copy object above is already the active tongue; labels come from it
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, me.id))
    .orderBy(desc(supportTickets.createdAt))
    .limit(30);
  const ids = tickets.map((x) => x.id);
  const messages = ids.length
    ? await db.select().from(ticketMessages).where(desc(ticketMessages.id)).limit(400).then((rows) => rows.filter((m) => ids.includes(m.ticketId)))
    : [];

  return (
    <section aria-labelledby="sup-title" className="max-w-[56rem]">
      <p className="rule-label mb-4">{copy.chat.title}</p>
      <h1 id="sup-title" className="font-display text-display-md leading-[1.05] tracking-[-0.02em] text-ink">
        {copy.account.nav.support[1]}
      </h1>
      <p className="mt-4 max-w-[40rem] text-[14px] leading-[1.8] text-muted">{copy.account.questionText}</p>

      {tickets.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<ChatIcon size={22} />}
            title={copy.account.nav.support[1]}
            description={copy.chat.openHours}
            action={{ href: "/aide", label: copy.header.help }}
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-5">
          {tickets.map((tk) => {
            const st = STATUS[tk.status] ?? STATUS.open;
            const thread = messages.filter((m) => m.ticketId === tk.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            return (
              <li key={tk.id} className="border border-stone-2/45 bg-paper/70 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-display text-[18px] text-ink">
                    <span className="me-2 font-mono text-[12px] text-champagne-2">#{String(tk.id).padStart(5, "0")}</span>
                    {tk.subject}
                  </p>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ${st.cls}`}>{st.fr}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-2">{copy.common.today === "aujourd'hui" ? "Ouvert le" : "Meftou7 nhar"} {formatDate(tk.createdAt)} — {copy.chat.title}</p>

                {tk.message && (
                  <p className="mt-4 whitespace-pre-line border-l-2 border-champagne/40 ps-4 text-[13px] leading-relaxed text-charcoal">
                    {tk.message}
                  </p>
                )}
                {tk.reply && (
                  <div className="mt-4 border-l-2 border-success/50 bg-success-soft/40 ps-4">
                    <p className="eyebrow mb-1 text-success">{copy.chat.staffName}</p>
                    <p className="whitespace-pre-line text-[13px] leading-relaxed text-charcoal">{tk.reply}</p>
                  </div>
                )}
                {thread.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-stone/70 pt-4">
                    {thread.slice(-6).map((m) => (
                      <li key={m.id} className="text-[12.5px] leading-relaxed">
                        <span className="font-bold uppercase tracking-[0.14em] text-muted-2">{m.userId === me.id ? copy.common.you : m.isBot ? copy.chat.botName : copy.chat.staffName}</span>
                        <span className="mx-2 text-muted-2">·</span>
                        <span className="text-charcoal">{m.body.slice(0, 300)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {tk.status !== "closed" && <ContinueTicket ticketId={tk.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
