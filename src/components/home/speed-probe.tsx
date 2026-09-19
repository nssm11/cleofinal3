"use client";

import { useEffect, useState } from "react";

/**
 * LA MESURE — the page times itself on the visitor's own phone.
 *
 * Nothing here is a lab figure or a marketing number: every value is read
 * from the browser's own performance timeline, on the device that is holding
 * the page, over the network the visitor is paying for. If the number is bad,
 * the page says so — a speed page that printed a flattering constant would be
 * exactly the kind of proof this house refuses to make.
 *
 * Largest Contentful Paint is observed, not guessed: it is the last of the
 * four to arrive, and it can arrive several seconds after the HTML.
 */

type Reading = {
  ttfb: number | null;
  fcp: number | null;
  lcp: number | null;
  loaded: number | null;
  transfer: number | null;
  requests: number;
  js: number | null;
  images: number | null;
  connection: string | null;
  savedData: boolean;
};

const ms = (v: number | null) => (v == null ? "—" : `${Math.round(v)} ms`);
const ko = (v: number | null) => (v == null ? "—" : `${(v / 1024).toFixed(0)} Ko`);

function readConnection(): { connection: string | null; savedData: boolean } {
  const c = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;
  return { connection: c?.effectiveType ?? null, savedData: c?.saveData ?? false };
}

export function SpeedProbe() {
  const [r, setR] = useState<Reading | null>(null);

  useEffect(() => {
    const collect = (): Reading => {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint");
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

      const bytesOf = (kind: (name: string) => boolean) => {
        const list = resources.filter((res) => kind(res.name) && res.transferSize > 0);
        return list.length ? list.reduce((a, res) => a + res.transferSize, 0) : null;
      };

      const { connection, savedData } = readConnection();

      return {
        ttfb: nav ? Math.max(0, nav.responseStart - nav.requestStart) : null,
        fcp: fcp?.startTime ?? null,
        lcp: null, // filled by the observer below, which is the only honest source
        loaded: nav ? Math.max(0, nav.loadEventEnd - nav.startTime) : null,
        transfer: nav ? nav.transferSize || null : null,
        requests: resources.length + 1,
        js: bytesOf((n) => n.endsWith(".js")),
        images: bytesOf((n) => /\.(jpe?g|png|webp|avif|mp4|webm)$/i.test(n)),
        connection,
        savedData,
      };
    };

    // Published on the next tick rather than inside the effect body: the
    // reading is a snapshot of an external system, not derived state.
    const first = window.setTimeout(() => setR(collect()), 0);

    // LCP is a promise the browser keeps later: observe it, and take the last.
    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) setR((prev) => ({ ...(prev ?? collect()), lcp: last.startTime }));
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      /* An older browser: the other figures stand on their own. */
    }

    // Whatever else lands (a lazy photograph, a font) is accounted for once
    // the page has gone quiet.
    const settle = window.setTimeout(() => setR(collect()), 2500);

    return () => {
      window.clearTimeout(first);
      window.clearTimeout(settle);
      observer?.disconnect();
    };
  }, []);

  if (!r) {
    return (
      <p className="kicker-xs text-faint" aria-live="polite">
        Mesure en cours…
      </p>
    );
  }

  const rows: { label: string; value: string; note: string }[] = [
    { label: "TTFB", value: ms(r.ttfb), note: "Premier octet — le temps que le comptoir réponde" },
    { label: "FCP", value: ms(r.fcp), note: "Premier trait dessiné à l'écran" },
    { label: "LCP", value: ms(r.lcp), note: "Le plus grand élément visible, enfin posé" },
    { label: "Poids", value: ko(r.transfer), note: "Ce que cette page a coûté à votre forfait" },
    { label: "Requêtes", value: String(r.requests), note: "Fichiers demandés pour composer la page" },
    { label: "JavaScript", value: ko(r.js), note: "Moteur et îlots interactifs, compressés" },
  ];

  return (
    <div aria-live="polite">
      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="border-t border-night-line pt-4">
            <dt className="kicker-xs text-chalk-faint">{row.label}</dt>
            <dd className="mt-1.5 font-ant text-[clamp(1.5rem,2.6vw,2rem)] leading-none text-chalk">
              {row.value}
            </dd>
            <p className="mt-2 text-[11.5px] leading-snug text-chalk-faint">{row.note}</p>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-[12px] leading-relaxed text-chalk-faint">
        Mesuré sur votre appareil, sur votre réseau
        {r.connection ? ` (${r.connection})` : ""}
        {r.savedData ? ", en économie de données" : ""}. Ces chiffres sont lus dans votre
        navigateur, pas dans un laboratoire : recharger la page les refait, et ils seront
        différents sur une 3G chargée. C&apos;est le point.
      </p>
    </div>
  );
}
