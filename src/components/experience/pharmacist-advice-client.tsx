"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const topics = ["Choisir un produit", "Réaction ou irritation", "Suivre une commande", "Retour ou échange", "Routine complète"];
const urgency = ["Aujourd'hui", "Cette semaine", "Pas urgent"];
const slots = ["09:30", "11:00", "14:30", "17:15"];

export function PharmacistAdviceClient() {
  const [topic, setTopic] = useState(topics[0]);
  const [when, setWhen] = useState(urgency[1]);
  const [slot, setSlot] = useState(slots[0]);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const recommendation = useMemo(() => {
    if (topic === "Suivre une commande") return { label: "Aller au suivi commande", href: "/suivi", detail: "Le plus rapide est le suivi avec numéro de commande et e-mail." };
    if (topic === "Retour ou échange") return { label: "Ouvrir les retours", href: "/compte/retours", detail: "Le compte conserve les commandes et pièces jointes utiles." };
    if (topic === "Réaction ou irritation") return { label: "Créer un ticket prioritaire", href: "/compte/support", detail: "Arrêtez le produit suspect et joignez une photo si nécessaire." };
    return { label: "Envoyer au support", href: "/compte/support", detail: "Le fil support rattache la conversation aux produits et commandes." };
  }, [topic]);

  const submit = () => {
    setSent(true);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
      <aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start">
        <p className="kicker-xs text-muted">Triage</p>
        <div className="mt-5 space-y-5">
          <Choice label="Sujet" values={topics} value={topic} onChange={setTopic} />
          <Choice label="Délai" values={urgency} value={when} onChange={setWhen} />
          <Choice label="Créneau conseil" values={slots} value={slot} onChange={setSlot} />
        </div>
      </aside>

      <section className="space-y-8">
        <div className="grid gap-px bg-line md:grid-cols-3">
          <Panel k="Canal conseillé" v={topic === "Réaction ou irritation" ? "Ticket prioritaire" : "Message support"} />
          <Panel k="Réponse visée" v={when === "Aujourd'hui" ? "Jour même" : "24–48 h"} />
          <Panel k="Créneau" v={slot} />
        </div>

        <div className="border border-line bg-canvas p-6">
          <p className="kicker-xs text-muted">Message au pharmacien</p>
          <label className="mt-4 block">
            <span className="sr-only">Votre question</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={7}
              placeholder="Décrivez le besoin, les produits déjà utilisés, les réactions observées et les contraintes importantes."
              className="w-full border border-line bg-porcelain p-4 text-[14px] leading-relaxed outline-none transition-colors focus:border-iodine"
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={submit} className="btn-solid">
              Préparer la demande
            </button>
            <Link href={recommendation.href} className="btn-ghost">
              {recommendation.label}
            </Link>
          </div>
          {sent && (
            <div role="status" className="mt-5 border border-iodine bg-iodine/10 p-4 text-[14px] leading-relaxed text-carbon">
              Demande préparée. {recommendation.detail} Vous pouvez maintenant l&apos;envoyer depuis le fil support ; aucune donnée sensible n&apos;est envoyée depuis cette démo locale.
            </div>
          )}
        </div>

        <div className="grid gap-px bg-line md:grid-cols-2">
          {[
            ["Pièces jointes", "Photos, facture et contexte produit sont gérés dans le fil support connecté."],
            ["Macros", "Les réponses fréquentes restent prêtes pour l'équipe : irritation, rupture, retour, livraison."],
            ["FAQ automatique", "Le triage dirige vers le suivi, les retours ou le support avant d'ouvrir un nouveau ticket."],
            ["Satisfaction", "La conversation peut être notée après résolution pour alimenter le tableau support."],
          ].map(([title, text]) => (
            <article key={title} className="bg-canvas p-5">
              <h2 className="font-ant text-[1.5rem] uppercase leading-none text-carbon">{title}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Choice({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={value === option ? "rounded-full bg-carbon px-3 py-2 text-[12px] text-canvas" : "rounded-full border border-line px-3 py-2 text-[12px] text-muted transition-colors hover:border-iodine hover:text-carbon"}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Panel({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-canvas p-5">
      <p className="kicker-xs text-muted">{k}</p>
      <p className="mt-3 font-ant text-[1.7rem] uppercase leading-none text-carbon">{v}</p>
    </div>
  );
}
