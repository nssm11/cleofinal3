import "server-only";

/* ══════════════════════════════════════════════════════════════════════════
   PÉRIODES — one date grammar for the whole instrument
   ──────────────────────────────────────────────────────────────────────────
   A period is resolved once, on the server, and travels through the URL as
   three short parameters (`p`, `from`, `to`) so every screen — and every link
   between screens — speaks the same window. Comparison is always the same
   length immediately before, plus the same window one year earlier: two
   honest baselines rather than one flattering one.
   ══════════════════════════════════════════════════════════════════════════ */

export type PeriodKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "year" | "custom";
export type Granularity = "hour" | "day" | "week" | "month";

export type Period = {
  key: PeriodKey;
  label: string;
  details: string;
  from: Date;
  to: Date;
  /** Whole days covered (≥1). */
  days: number;
  granularity: Granularity;
  /** True while the window includes the present moment. */
  live: boolean;
};

export const PERIOD_KEYS: { key: PeriodKey; label: string; hint: string }[] = [
  { key: "today", label: "Aujourd'hui", hint: "Depuis minuit" },
  { key: "yesterday", label: "Hier", hint: "Journée close" },
  { key: "7d", label: "7 jours", hint: "Semaine glissante" },
  { key: "30d", label: "30 jours", hint: "Mois glissant" },
  { key: "90d", label: "90 jours", hint: "Trimestre" },
  { key: "year", label: "12 mois", hint: "Année glissante" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export const formatDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const formatDayYear = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const formatIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function resolvePeriod(params: { p?: string; from?: string; to?: string }, now = new Date()): Period {
  const key = (params.p as PeriodKey) ?? "30d";
  if (key === "custom") {
    const from = params.from ? new Date(`${params.from}T00:00:00`) : addDays(startOfDay(now), -29);
    const to = params.to ? new Date(`${params.to}T23:59:59.999`) : endOfDay(now);
    const safeTo = Number.isNaN(to.getTime()) ? endOfDay(now) : to;
    const safeFrom = Number.isNaN(from.getTime()) ? addDays(safeTo, -29) : from;
    const days = Math.max(1, Math.round((safeTo.getTime() - safeFrom.getTime()) / 86_400_000));
    return {
      key, from: safeFrom, to: safeTo, days,
      label: `${formatDayYear(safeFrom)} → ${formatDayYear(safeTo)}`,
      details: `${days} jour${days > 1 ? "s" : ""}`,
      granularity: days <= 2 ? "hour" : days <= 45 ? "day" : days <= 200 ? "week" : "month",
      live: safeTo.getTime() >= now.getTime() - 60_000,
    };
  }
  const today = startOfDay(now);
  switch (key) {
    case "today":
      return { key, from: today, to: endOfDay(now), days: 1, granularity: "hour", label: "Aujourd'hui", details: formatDayYear(today), live: true };
    case "yesterday": {
      const y = addDays(today, -1);
      return { key, from: y, to: endOfDay(y), days: 1, granularity: "hour", label: "Hier", details: formatDayYear(y), live: false };
    }
    case "7d":
      return { key, from: startOfDay(addDays(today, -6)), to: endOfDay(now), days: 7, granularity: "day", label: "7 derniers jours", details: `${formatDay(addDays(today, -6))} → ${formatDay(today)}`, live: true };
    case "90d":
      return { key, from: startOfDay(addDays(today, -89)), to: endOfDay(now), days: 90, granularity: "week", label: "90 derniers jours", details: `${formatDay(addDays(today, -89))} → ${formatDay(today)}`, live: true };
    case "year": {
      const from = startOfDay(new Date(today.getFullYear(), today.getMonth() - 11, 1));
      return { key, from, to: endOfDay(now), days: Math.round((endOfDay(now).getTime() - from.getTime()) / 86_400_000), granularity: "month", label: "12 derniers mois", details: `depuis ${formatDayYear(from)}`, live: true };
    }
    case "30d":
    default:
      return { key: "30d", from: startOfDay(addDays(today, -29)), to: endOfDay(now), days: 30, granularity: "day", label: "30 derniers jours", details: `${formatDay(addDays(today, -29))} → ${formatDay(today)}`, live: true };
  }
}

export function previousPeriod(p: Period): Period {
  const to = new Date(p.from.getTime() - 1);
  const from = new Date(to.getTime() - (p.days * 86_400_000) + 1);
  return { ...p, from, to, label: `Période précédente`, details: `${formatDay(from)} → ${formatDay(to)}`, live: false };
}

export function sameperiodLastYear(p: Period): Period {
  const shift = (d: Date) => {
    const out = new Date(d);
    out.setFullYear(out.getFullYear() - 1);
    return out;
  };
  return { ...p, from: shift(p.from), to: shift(p.to), label: "Même période l'an dernier", details: `année ${p.from.getFullYear() - 1}`, live: false };
}

/** Bucket starts covering the period, at the period's own granularity. */
export function bucketStarts(p: Period): Date[] {
  const out: Date[] = [];
  if (p.granularity === "hour") {
    const cursor = new Date(p.from.getTime());
    while (cursor.getTime() <= p.to.getTime()) {
      out.push(new Date(cursor));
      cursor.setHours(cursor.getHours() + 1);
    }
    return out;
  }
  if (p.granularity === "day") {
    const cursor = new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate());
    while (cursor.getTime() <= p.to.getTime()) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }
  if (p.granularity === "week") {
    const cursor = new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate());
    const dow = (cursor.getDay() + 6) % 7; // Monday
    cursor.setDate(cursor.getDate() - dow);
    while (cursor.getTime() <= p.to.getTime()) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return out;
  }
  const cursor = new Date(p.from.getFullYear(), p.from.getMonth(), 1);
  while (cursor.getTime() <= p.to.getTime()) {
    out.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export const bucketLabel = (d: Date, g: Granularity) =>
  g === "hour" ? `${String(d.getHours()).padStart(2, "0")}h` : g === "month" ? `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` : formatDay(d);

export function periodQuery(key: PeriodKey, extra: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams({ p: key });
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  return params.toString();
}
