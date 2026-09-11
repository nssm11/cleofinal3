import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MAIL_CONFIGURED } from "@/lib/env";
import { ORDER_MAIL_COPY } from "@/lib/mail/copy";
import { welcomeEmail } from "@/lib/mail/templates/welcome";
import { orderStatusEmail } from "@/lib/mail/templates/order-status";
import { passwordResetEmail } from "@/lib/mail/templates/password-reset";
import { ticketCreatedEmail, ticketReplyEmail, ticketResolvedEmail } from "@/lib/mail/templates/ticket";
import type { MailOrder, MailTicket } from "@/lib/mail/types";
import type { OrderStatus } from "@/db/schema";
import { AdminPage, Panel } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Modèles d'e-mails", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * LA SALLE DU COURRIER — every transactional letter, rendered and readable.
 *
 * The letters are shown inside iframes on purpose: an e-mail carries its own
 * inline styles, and dropping that markup straight into the back office would
 * let its declarations leak into the admin theme. The frame is the inbox.
 *
 * The sample data is deliberately representative — a shipped order with a
 * tracking number, a ticket with a two-paragraph reply — because that is where
 * a template breaks.
 */

const SAMPLE_ORDER: MailOrder = {
  number: "CL-260911-A7K2",
  email: "ines.mansour@example.tn",
  firstName: "Ines",
  status: "shipped",
  total: "269.500 DT",
  shippingLabel: "Livraison standard",
  paymentLabel: "Paiement à la livraison",
  placedAt: "11 septembre 2026",
  trackingCode: "TN-9938-2214",
  carrierUrl: "https://suivi.transporteur.tn/TN-9938-2214",
  links: {
    tracking: "/suivi?n=CL-260911-A7K2&k=demo",
    shop: "/boutique",
    support: "/aide",
    account: "/compte/commandes",
  },
  lines: [
    { name: "Hyalu B5 Sérum 30 ml", brandName: "La Roche-Posay", quantity: 1, lineTotal: "128.000 DT" },
    { name: "Sensibio H2O Eau Micellaire 500 ml", brandName: "Bioderma", quantity: 2, lineTotal: "79.000 DT" },
    { name: "Anthelios UVMune 400 Fluide SPF50+", brandName: "La Roche-Posay", quantity: 1, lineTotal: "62.500 DT" },
  ],
};

const SAMPLE_TICKET: MailTicket = {
  reference: "42",
  email: "ines.mansour@example.tn",
  name: "Ines",
  subject: "Ma crème est arrivée sans scellé",
  reply:
    "Bonjour Ines,\n\nMerci de nous avoir prévenus. Nous vous renvoyons la référence dès aujourd'hui, sans frais, et vous invitons à garder l'actuelle jusqu'au passage du transporteur.\n\nSami — équipe Cléopâtre",
  trackingHref: "/aide",
};

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled", "returned"];

export default async function AdminEmails() {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "support")) redirect("/compte");

  const letters: { group: string; label: string; note: string; subject: string; html: string }[] = [
    {
      group: "Compte",
      label: "Bienvenue",
      note: "Envoyée à l'inscription, et à la création de compte depuis le tunnel de commande.",
      ...welcomeEmail({ firstName: "Ines" }),
    },
    ...STATUS_ORDER.map((s) => ({
      group: "Commande",
      label: ORDER_MAIL_COPY[s].statusLabel,
      note: ORDER_MAIL_COPY[s].preheader,
      ...orderStatusEmail({ ...SAMPLE_ORDER, status: s }),
    })),
    {
      group: "Compte",
      label: "Mot de passe oublié",
      note: "Lien valable 60 minutes ; l'URL brute est imprimée sous le bouton.",
      ...passwordResetEmail({ resetHref: "/mot-de-passe?token=demo&email=ines%40example.tn" }),
    },
    { group: "Support", label: "Demande créée", note: "Envoyée dès la réception du message.", ...ticketCreatedEmail(SAMPLE_TICKET) },
    { group: "Support", label: "Réponse reçue", note: "La réponse du conseiller est reprise dans la lettre.", ...ticketReplyEmail(SAMPLE_TICKET) },
    { group: "Support", label: "Demande résolue", note: "Le client peut rouvrir la demande en un clic.", ...ticketResolvedEmail(SAMPLE_TICKET) },
  ];

  const groups = ["Compte", "Commande", "Support"] as const;

  return (
    <AdminPage
      title="Modèles d'e-mails"
      sub="Les lettres transactionnelles, telles qu'elles partent"
      eyebrow={
        MAIL_CONFIGURED
          ? "Envoi actif — Resend"
          : "Aperçu local — posez RESEND_API_KEY dans l'environnement pour envoyer"
      }
    >
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-4 text-[10px] uppercase tracking-[0.16em] text-admin-muted">{g}</h2>
            <div className="grid gap-6 xl:grid-cols-2">
              {letters
                .filter((l) => l.group === g)
                .map((l) => (
                  <Panel key={l.label} title={l.label}>
                    <p className="px-4 pt-3 text-[11px] leading-relaxed text-admin-muted">{l.note}</p>
                    <p className="px-4 pb-3 pt-2 text-[11px] text-admin-gold">
                      Objet&nbsp;: <span className="text-admin-text">{l.subject}</span>
                    </p>
                    <iframe
                      title={`Aperçu — ${l.label}`}
                      srcDoc={l.html}
                      className="h-[640px] w-full border-t border-admin-border bg-white"
                      loading="lazy"
                    />
                  </Panel>
                ))}
            </div>
          </section>
        ))}
      </div>
    </AdminPage>
  );
}
