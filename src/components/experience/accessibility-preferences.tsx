"use client";

import { useEffect, useState } from "react";

type Key = "large" | "contrast" | "motion" | "dyslexia";
const classMap: Record<Key, string> = {
  large: "access-large-text",
  contrast: "access-high-contrast",
  motion: "access-reduced-motion",
  dyslexia: "access-dyslexia",
};

const defaults: Record<Key, boolean> = { large: false, contrast: false, motion: false, dyslexia: false };

export function AccessibilityPreferences() {
  const [enabled, setEnabled] = useState<Record<Key, boolean>>(defaults);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("cleo-accessibility");
      if (saved) setEnabled(JSON.parse(saved));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    for (const [key, className] of Object.entries(classMap) as [Key, string][]) {
      document.documentElement.classList.toggle(className, enabled[key]);
    }
    window.localStorage.setItem("cleo-accessibility", JSON.stringify(enabled));
  }, [enabled]);

  const toggle = (key: Key) => setEnabled((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="grid gap-8 lg:grid-cols-[0.42fr_1fr]">
      <aside className="border border-line bg-canvas p-6 lg:sticky lg:top-28 lg:self-start">
        <p className="kicker-xs text-muted">Préférences locales</p>
        <div className="mt-5 space-y-3">
          <Switch label="Texte plus grand" checked={enabled.large} onClick={() => toggle("large")} />
          <Switch label="Contraste renforcé" checked={enabled.contrast} onClick={() => toggle("contrast")} />
          <Switch label="Réduire les mouvements" checked={enabled.motion} onClick={() => toggle("motion")} />
          <Switch label="Lecture espacée" checked={enabled.dyslexia} onClick={() => toggle("dyslexia")} />
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-muted">Ces réglages sont stockés dans ce navigateur uniquement et peuvent être retirés à tout moment.</p>
      </aside>

      <section className="space-y-8">
        <div className="border border-line bg-canvas p-6">
          <p className="kicker-xs text-muted">Démo lecture</p>
          <h2 className="mt-3 font-ant text-[2.3rem] uppercase leading-none text-carbon">Une interface qui reste lisible</h2>
          <p className="mt-5 max-w-[66ch] text-[15px] leading-[1.85] text-muted">
            Le mode grand texte augmente la taille générale, le contraste renforce les couleurs de texte et le mode lecture espacée élargit l&apos;interligne. Le mode mouvement réduit neutralise les animations longues lorsque possible.
          </p>
        </div>

        <div className="grid gap-px bg-line md:grid-cols-2">
          {[
            ["Focus clavier", "Les liens et boutons gardent des états visibles et cohérents avec la charte."],
            ["Erreurs formulaires", "Les messages sont résumés au-dessus du champ et restent lisibles par lecteur d’écran."],
            ["Contraste", "Les surfaces critiques sont testées en contraste renforcé pour les CTA, textes et filets."],
            ["Vidéos", "Les chapitres cinématiques prévoient libellés, contrôles et emplacement pour transcriptions."],
          ].map(([title, text]) => (
            <article key={title} className="bg-canvas p-5">
              <h3 className="font-ant text-[1.6rem] uppercase leading-none text-carbon">{title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>

        <form className="border border-line bg-porcelain p-6" noValidate>
          <p className="kicker-xs text-muted">Résumé d&apos;erreurs accessible</p>
          <div role="alert" className="mt-4 border border-iodine bg-iodine/10 p-4 text-[14px] text-carbon">
            Exemple : indiquez un e-mail valide et décrivez le besoin en au moins une phrase.
          </div>
          <label className="mt-5 block text-[12px] font-bold uppercase tracking-[0.16em] text-muted">
            E-mail
            <input className="mt-2 block w-full border border-line bg-canvas p-3 text-[14px] outline-none focus:border-iodine" placeholder="nom@example.com" />
          </label>
        </form>
      </section>
    </div>
  );
}

function Switch({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className="flex w-full items-center justify-between border border-line bg-porcelain p-3 text-left text-[13px] text-carbon transition-colors hover:border-iodine"
    >
      <span>{label}</span>
      <span className={checked ? "h-6 w-11 rounded-full bg-iodine p-0.5" : "h-6 w-11 rounded-full bg-line-strong p-0.5"}>
        <span className={checked ? "block h-5 w-5 translate-x-5 rounded-full bg-canvas transition-transform" : "block h-5 w-5 rounded-full bg-canvas transition-transform"} />
      </span>
    </button>
  );
}
