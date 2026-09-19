"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SparkIcon } from "@/components/icons";

/**
 * LES RÉGLAGES DE LA MAISON — three switches the visitor keeps.
 *
 * They belong to the person, not to the session: the choice is written to
 * localStorage and applied by a script in the layout before the first paint,
 * so nobody who asked for the night is shown daylight for half a second.
 *
 * The component itself is deliberately dumb: it only flips one attribute on
 * <html> and stores one key. Everything it does is done in CSS (see
 * globals.css), which means the switches cost no re-render of the shop and
 * cannot break a page they know nothing about.
 *
 * Two of the three start from what the visitor already told us — the OS
 * reduced-motion preference, and the browser's own save-data flag, which a
 * Tunisian prepaid data plan sets more often than any design system expects.
 */

const KEYS = { night: "cleo.night", save: "cleo.save", motion: "cleo.motion" } as const;
type Switch = keyof typeof KEYS;

const on = (k: Switch) => document.documentElement.dataset[k] === "1";

/** The three attributes are the state; the switches only write them. */
const snapshot = () => `${on("night") ? 1 : 0}|${on("save") ? 1 : 0}|${on("motion") ? 1 : 0}`;
const SERVER = "0|0|1";

function subscribe(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-night", "data-save", "data-motion"],
  });
  return () => observer.disconnect();
}

export function HouseSettings({ className }: { className?: string }) {
  const snap = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  const [night, save, motion] = snap.split("|").map((v) => v === "1");

  const flip = (k: Switch) => {
    const value = document.documentElement.dataset[k] === "1" ? "0" : "1";
    document.documentElement.dataset[k] = value;
    try {
      localStorage.setItem(KEYS[k], value);
    } catch {
      /* Private browsing: the switch still works for this page. */
    }
  };

  return (
    <div className={className}>
      <p className="kicker-xs mb-4 text-chalk-faint">La maison, à votre main</p>
      <ul className="divide-y divide-night-line border-y border-night-line">
        <Row
          label="La nuit"
          hint="Toute la maison passe au registre de nuit."
          checked={night}
          onChange={() => flip("night")}
          icon={<MoonIcon size={12} strokeWidth={1.5} />}
        />
        <Row
          label="Mode sobre"
          hint="Motifs et ornements retirés ; les produits et les prix restent."
          checked={save}
          onChange={() => flip("save")}
          icon={<span aria-hidden className="text-[11px] leading-none">◻</span>}
        />
        <Row
          label="Mouvement"
          hint="Apparitions et transitions coupées net."
          checked={motion}
          onChange={() => flip("motion")}
          icon={<SparkIcon size={12} strokeWidth={1.5} />}
        />
      </ul>
    </div>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
  icon,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="group flex w-full items-center gap-4 py-3.5 text-start"
      >
        <span aria-hidden className="text-chalk-faint">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold tracking-[0.01em] text-chalk">{label}</span>
          <span className="mt-1 block text-[11.5px] leading-snug text-chalk-faint">{hint}</span>
        </span>
        {/* A switch made of two squares — the house has no rounded corners. */}
        <span
          aria-hidden
          className={`relative h-4 w-8 shrink-0 border transition-colors duration-200 ${
            checked ? "border-chalk/70 bg-chalk/25" : "border-night-line bg-transparent"
          }`}
        >
          <span
            className={`absolute top-[2px] h-[10px] w-[10px] transition-all duration-200 ${
              checked ? "start-[18px] bg-chalk" : "start-[2px] bg-chalk-faint"
            }`}
          />
        </span>
      </button>
    </li>
  );
}
