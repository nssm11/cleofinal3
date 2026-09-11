/**
 * LES HEURES DE LA MAISON.
 *
 * Une seule source : les horaires affichés en boutique, ceux imprimés dans les
 * e-mails et ceux qui décident si le conseiller en ligne répond en direct ou
 * laisse la place à l'assistant. Les changer ici les change partout.
 */

/** Jour JS : 0 = dimanche. Plages en minutes depuis minuit. */
export const OPENING_HOURS: Record<number, Array<[number, number]>> = {
  0: [[9 * 60, 14 * 60]], // dimanche
  1: [[8 * 60 + 30, 20 * 60 + 30]],
  2: [[8 * 60 + 30, 20 * 60 + 30]],
  3: [[8 * 60 + 30, 20 * 60 + 30]],
  4: [[8 * 60 + 30, 20 * 60 + 30]],
  5: [[8 * 60 + 30, 20 * 60 + 30]],
  6: [[8 * 60 + 30, 20 * 60 + 30]], // samedi
};

export const HOURS_LABEL = "Lundi – samedi, 8 h 30 → 20 h 30 · Dimanche, 9 h → 14 h";

/**
 * « Un pharmacien est là » à l'instant passé, en heure de Tunis.
 *
 * Le fuseau est fixé explicitement : le serveur peut tourner n'importe où, et
 * répondre « fermé » à 19 h à Tunis parce que la machine est à Londres serait
 * une faute, pas une approximation.
 */
export function isCounterOpen(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  if (dayIndex < 0) return false;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  // « 24 » apparaît sur certaines implémentations pour minuit.
  const m = Number.isFinite(minutes) ? minutes % 1440 : 0;
  return (OPENING_HOURS[dayIndex] ?? []).some(([from, to]) => m >= from && m < to);
}

/** Prochaine ouverture, en clair, pour ne jamais laisser quelqu'un sans repère. */
export function nextOpeningLabel(now: Date = new Date()): string {
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
  const read = (d: Date) => {
    const p = fmt.formatToParts(d);
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), min: (Number(g("hour")) * 60 + Number(g("minute"))) % 1440 };
  };
  for (let i = 0; i < 8; i++) {
    const probe = new Date(now.getTime() + i * 86_400_000);
    const { day, min } = read(probe);
    const slot = (OPENING_HOURS[day] ?? []).find(([from]) => from > min);
    if (slot) {
      const h = Math.floor(slot[0] / 60);
      const mm = slot[0] % 60;
      const when = i === 0 ? "aujourd'hui" : i === 1 ? "demain" : dayNames[day];
      return `${when} à ${h} h${mm ? ` ${mm}` : ""}`;
    }
  }
  return "prochainement";
}
