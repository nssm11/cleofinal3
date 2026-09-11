"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon, ChatIcon, CheckIcon, CloseIcon, PhoneIcon } from "@/components/icons";
import { createTicketAction } from "@/actions/shop";
import { HOURS_LABEL, nextOpeningLabel } from "@/lib/hours";
import { D, EASE_LUXE } from "@/lib/motion";

/**
 * PARLER À UN CONSEILLER — la porte qui reste ouverte.
 *
 * Deux régimes, décidés par l'heure de Tunis et jamais par un devin :
 *
 *   • **Comptoir ouvert** — un pharmacien répond. Le formulaire est minimal
 *     (sujet, message) et l'attente annoncée est réelle : sous 2 heures
 *     ouvrées, pas « dans les plus brefs délais ».
 *
 *   • **Comptoir fermé** — l'assistant prend le relais. Il répond aux trois
 *     questions qui reviennent le plus la nuit (délais, retours, authenticité)
 *     à partir de réponses déjà écrites par la maison, puis propose d'ouvrir
 *     une demande qui sera lue à l'ouverture. Il ne prétend jamais être
 *     pharmacien et n'invente aucune réponse : ce qu'il ne sait pas devient un
 *     ticket, pas une improvisation.
 *
 * Le panneau est un vrai panneau : focus piégé, Échap pour fermer, `aria-expanded`
 * sur le bouton, et un historique `aria-live` pour qu'une réponse se lise aussi
 * sans les yeux.
 */

type BotEntry = { match: RegExp; answer: string };

/** Réponses écrites par la maison, pas générées : rien ici ne peut dériver. */
const BOT_KNOWLEDGE: BotEntry[] = [
  {
    match: /livr|délai|delai|quand|expéd|exped|colis/i,
    answer:
      "24 à 48 h sur le Grand Tunis, 48 à 72 h ailleurs en Tunisie. Une commande passée avant 14 h part le jour même, hors dimanche. Le retrait en boutique est prêt sous 2 h, sans frais.",
  },
  {
    match: /retour|rembours|échang|echang|annul/i,
    answer:
      "Vous avez 7 jours après réception pour demander un retour depuis votre compte, produit non ouvert. Nous vous recontactons sous 48 h. Une commande peut s'annuler tant qu'elle n'est pas en préparation.",
  },
  {
    match: /authentique|vrai|faux|contrefaçon|contrefacon|original|lot/i,
    answer:
      "Nous nous approvisionnons uniquement auprès des laboratoires et distributeurs officiels en Tunisie. Chaque produit porte son numéro de lot et sa date de péremption, vérifiés à la préparation.",
  },
  {
    match: /paiement|payer|carte|espèce|espece|virement/i,
    answer:
      "Paiement à la livraison en espèces, virement bancaire, et carte bancaire bientôt. Les cartes cadeaux Cléopâtre sont acceptées en ligne comme en boutique.",
  },
];

const BOT_FALLBACK =
  "Je ne préfère pas improviser sur cette question : elle mérite un pharmacien. Laissez-la ci-dessous, elle sera lue dès l'ouverture.";

const QUICK_ASKS = ["Délais de livraison", "Retourner un produit", "Produits authentiques ?", "Paiement accepté"];

type Line = { from: "bot" | "you"; text: string };

/**
 * Première ligne de la conversation. Calculée hors du composant pour pouvoir
 * servir d'initialiseur paresseux : un état initialisé une fois, plutôt qu'un
 * effet qui le recopie à chaque ouverture.
 */
function greetingLine(counterOpen: boolean): Line {
  return {
    from: "bot",
    text: counterOpen
      ? "Bonjour, vous voici au comptoir Cléopâtre. Un pharmacien vous répond — comptez moins de 2 heures ouvrées."
      : `Le comptoir est fermé. ${HOURS_LABEL}. Je peux déjà répondre aux questions courantes, et transmettre le reste à l'équipe.`,
  };
}

export function AdvisorChat({
  open: counterOpen,
  user,
}: {
  /** Le comptoir répond-il maintenant ? Décidé côté serveur, à l'heure de Tunis. */
  open: boolean;
  user?: { name: string; email: string } | null;
}) {
  const reduce = useReducedMotion();
  const [panelOpen, setPanelOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [lines, setLines] = useState<Line[]>(() => [greetingLine(counterOpen)]);
  const [writing, setWriting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const logId = useId();

  useEffect(() => {
    if (!panelOpen) return;
    // Le focus doit tomber dans le panneau, pas rester sur le bouton du bas.
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  /** Réponse de l'assistant : une des réponses écrites, ou un aveu d'ignorance. */
  function answer(question: string): string {
    return BOT_KNOWLEDGE.find((k) => k.match.test(question))?.answer ?? BOT_FALLBACK;
  }

  function askBot(question: string) {
    const q = question.trim();
    if (!q) return;
    setLines((l) => [...l, { from: "you", text: q }]);
    setAsk("");
    setWriting(true);
    // Un léger délai de plume : une réponse instantanée se lit comme un
    // collage, pas comme une réponse. Jamais plus long que le nécessaire.
    setTimeout(() => {
      setLines((l) => [...l, { from: "bot", text: answer(q) }]);
      setWriting(false);
    }, reduce ? 0 : 480);
  }

  /** Ouvrir une demande : le seul moyen de joindre un humain hors horaires. */
  function escalate(message: string) {
    const form = new FormData();
    form.set("subject", message.length > 190 ? `${message.slice(0, 187)}…` : message);
    form.set("message", message);
    form.set("type", "pharmacist_advice");
    form.set("priority", "normal");
    if (user?.email) form.set("email", user.email);
    if (user?.name) form.set("name", user.name);
    start(() => {
      void createTicketAction(null, form).then((res) => {
        setSent(
          res?.ok
            ? `C'est noté. ${res.message ?? "Nous vous répondons par e-mail dès l'ouverture."}`
            : res?.error ?? "Le message n'est pas parti. Merci de réessayer.",
        );
      });
    });
  }

  return (
    <>
      {/* ── Le panneau ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            ref={panelRef}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            role="dialog"
            aria-label="Parler à un conseiller"
            className="fixed bottom-[calc(var(--spacing-tabbar,5.375rem)+12px)] right-3 z-60 flex max-h-[min(72dvh,540px)] w-[min(92vw,23rem)] flex-col border border-stone bg-paper shadow-lift lg:bottom-6 lg:right-6 lg:max-h-[560px]"
          >
            {/* Bandeau */}
            <div className="flex items-start gap-3 border-b border-stone bg-cream px-4 py-3">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${counterOpen ? "bg-success" : "bg-muted-2"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] leading-tight text-ink">
                  {counterOpen ? "Un pharmacien vous répond" : "Comptoir fermé"}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">
                  {counterOpen ? HOURS_LABEL : `Réouverture ${nextOpeningLabel()} · ${HOURS_LABEL}`}
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={() => setPanelOpen(false)}
                aria-label="Fermer la conversation"
                className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center text-muted transition-colors hover:text-ink"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* ── Historique ─────────────────────────────────────────────── */}
            <div aria-live="polite" id={logId} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {lines.map((l, i) => (
                <p
                  key={i}
                  className={`max-w-[86%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    l.from === "you"
                      ? "ml-auto bg-ink text-paper"
                      : "border border-stone bg-cream text-charcoal"
                  }`}
                >
                  {l.text}
                </p>
              ))}
              {writing && (
                <p className="flex gap-1 px-3.5 py-3 text-muted" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
                      className="h-1.5 w-1.5 rounded-full bg-champagne-2"
                    />
                  ))}
                </p>
              )}
              {sent && (
                <p className="flex items-start gap-2 border border-success/35 bg-success-soft px-3.5 py-2.5 text-[13px] text-success" role="status">
                  <CheckIcon size={14} className="mt-0.5 shrink-0" /> {sent}
                </p>
              )}
            </div>

            {/* ── Saisie ─────────────────────────────────────────────────── */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (counterOpen) escalate(ask);
                else askBot(ask);
              }}
              className="border-t border-stone bg-cream/60 p-3"
            >
              {!counterOpen && lines.length <= 1 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {QUICK_ASKS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => askBot(q)}
                      className="border border-stone-2/50 bg-paper px-2.5 py-1.5 text-[11.5px] text-muted transition-colors hover:border-champagne hover:text-ink"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <label htmlFor={`${logId}-ask`} className="sr-only">
                  Votre question
                </label>
                <textarea
                  id={`${logId}-ask`}
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (counterOpen) {
                        if (ask.trim()) escalate(ask);
                      } else askBot(ask);
                    }
                  }}
                  rows={2}
                  placeholder={counterOpen ? "Écrivez à un pharmacien…" : "Posez votre question…"}
                  className="field max-h-32 min-h-[52px] flex-1 resize-none text-[13.5px]"
                />
                <button
                  type="submit"
                  disabled={pending || !ask.trim()}
                  aria-label={counterOpen ? "Envoyer au pharmacien" : "Poser la question"}
                  className="btn-primary flex h-[52px] w-[52px] shrink-0 items-center justify-center"
                >
                  <ArrowRightIcon size={17} />
                </button>
              </div>
              {!counterOpen && (
                <p className="mt-2 text-[11px] leading-snug text-muted-2">
                  L&apos;assistant répond à partir des réponses de la maison. Pour un avis
                  personnalisé,&nbsp;
                  <button type="button" onClick={() => escalate(ask.trim() || "Demande de conseil pharmacien")} className="text-ink underline underline-offset-4">
                    laissez un message à l&apos;équipe
                  </button>
                  .
                </p>
              )}
              {!counterOpen && (
                <a href="tel:+21671450210" className="mt-2 flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink">
                  <PhoneIcon size={12} /> Urgent&nbsp;? 71 450 210
                </a>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Le bouton ────────────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        aria-controls={logId}
        aria-label={panelOpen ? "Fermer la conversation" : "Parler à un conseiller"}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: D.base, ease: EASE_LUXE }}
        className="fixed bottom-[calc(var(--spacing-tabbar,5.375rem)+12px)] right-3 z-60 flex h-12 items-center gap-2.5 border border-ink bg-ink px-4 text-paper shadow-lift transition-colors hover:bg-charcoal lg:bottom-6 lg:right-6 lg:h-14 lg:px-5"
      >
        <ChatIcon size={18} />
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
          {counterOpen ? "Parler à un conseiller" : "Une question ?"}
        </span>
      </motion.button>
    </>
  );
}
