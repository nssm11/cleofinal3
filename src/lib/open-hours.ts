/**
 * LES HORAIRES — the two counters keep the same clock as the street.
 *
 * The hours live in the database as the sentence a shopkeeper would write:
 * `Lun–Sam 8h30–20h30 · Dim 9h–14h`. Everything the shop displays — the
 * "ouvert maintenant" pill, today's line, the clock on the addresses page —
 * is derived from that one sentence, so the counter can change its hours in
 * the back office without a deployment.
 *
 * French week: Monday is 1, Sunday is 7 — the ISO numbering, which is also
 * the numbering of `Date.getDay()` shifted by one.
 */

export type Span = { open: number; close: number };
export type DayHours = Span[];
/** Day index 1 = Monday … 7 = Sunday. */
export type WeekHours = Record<number, DayHours>;

const DAY_NAMES = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;

/** "8h30" → 510 · "20h" → 1200 · "8h" and "08h30" both understood. */
function toMinutes(text: string): number | null {
  const m = /^(\d{1,2})\s*h\s*(\d{1,2})?$/.exec(text.trim().toLowerCase());
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * `Lun–Sam 8h30–20h30 · Dim 9h–14h` → a week.
 *
 * Tolerates the separators a shopkeeper actually uses (– - —, · / ,) and
 * returns an empty week rather than throwing when the sentence is unusual:
 * a wrong "closed" is a phone call, a crashed page is worse.
 */
export function parseHours(raw: string | null | undefined): WeekHours {
  const week: WeekHours = {};
  if (!raw) return week;

  for (const part of raw.split(/[·/,]/)) {
    const chunk = part.trim();
    if (!chunk) continue;

    // Days first, then the spans of that day: "Lun-Sam 8h30-20h30 14h-17h".
    const dayMatch = /([a-zéûàç]+(?:\s*[–—-]\s*[a-zéûàç]+)?)\s*(.*)/i.exec(chunk);
    if (!dayMatch) continue;
    const [, dayPart, rest] = dayMatch;

    const spans: DayHours = [];
    for (const span of rest.split(/\s+/)) {
      const clean = span.trim();
      if (!clean) continue;
      const halves = clean.split(/\s*[–—-]\s*/);
      if (halves.length !== 2) continue;
      const open = toMinutes(halves[0]);
      const close = toMinutes(halves[1]);
      if (open === null || close === null) continue;
      spans.push({ open, close });
    }
    if (!spans.length) continue;

    for (const day of expandDays(dayPart)) week[day] = spans;
  }
  return week;
}

/** "Lun-Sam" → [1,2,3,4,5,6] · "Dim" → [7] · "Lun, Mer" also handled upstream. */
function expandDays(part: string): number[] {
  const text = part.trim().toLowerCase();
  const range = /([a-z]{3})\s*[–—-]\s*([a-z]{3})/.exec(text);
  if (range) {
    const from = DAY_NAMES.indexOf(range[1] as (typeof DAY_NAMES)[number]);
    const to = DAY_NAMES.indexOf(range[2] as (typeof DAY_NAMES)[number]);
    if (from >= 0 && to >= 0) {
      const days: number[] = [];
      for (let i = from; i <= to; i++) days.push(i + 1);
      return days;
    }
  }
  const single = DAY_NAMES.findIndex((d) => text.startsWith(d));
  return single >= 0 ? [single + 1] : [];
}

/** ISO day for a Date: Monday = 1 … Sunday = 7. */
export function isoDay(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

export type OpenState = {
  open: boolean;
  /** Today's line, or the name of the special period in force. */
  label: string;
  /** When the state changes next, in minutes from now (null if unknown). */
  changeInMinutes: number | null;
  /** Minute of the day at which it changes — 1230 is 20h30. */
  nextChangeAt: number | null;
  /** "aujourd'hui", "demain", or a weekday name. */
  nextChangeLabel: string | null;
  today: DayHours;
};

/**
 * SPECIAL DAYS — Ramadan and the two feast days.
 *
 * During Ramadan the counters open later and close later; on the feast they
 * are shut. A table, dated, so the shop does not spend a month telling
 * customers it is open when it is not. Update the years when they are known —
 * the code degrades to the ordinary hours otherwise.
 */
export const SPECIAL_DAYS: { from: string; to: string; label: string; hours: string | null }[] = [
  { from: "2026-02-17", to: "2026-03-18", label: "Horaires du Ramadan", hours: "Lun–Sam 9h–18h · Dim 9h–13h" },
  { from: "2027-02-07", to: "2027-03-08", label: "Horaires du Ramadan", hours: "Lun–Sam 9h–18h · Dim 9h–13h" },
];

function withinDay(date: Date, from: string, to: string): boolean {
  const iso = date.toISOString().slice(0, 10);
  return iso >= from && iso <= to;
}

/** The hours actually in force on that date: the special day, or the house's. */
export function hoursForDate(raw: string | null | undefined, date: Date): { hours: WeekHours; label: string | null } {
  for (const special of SPECIAL_DAYS) {
    if (withinDay(date, special.from, special.to)) {
      return special.hours
        ? { hours: parseHours(special.hours), label: special.label }
        : { hours: {}, label: special.label };
    }
  }
  return { hours: parseHours(raw), label: null };
}

export function openState(raw: string | null | undefined, date = new Date()): OpenState {
  const { hours, label } = hoursForDate(raw, date);
  const day = isoDay(date);
  const today = hours[day] ?? [];
  const now = minutes(date);
  const open = today.some((s) => now >= s.open && now < s.close);

  let changeInMinutes: number | null = null;
  let nextChangeAt: number | null = null;
  let nextChangeLabel: string | null = null;

  if (open) {
    const closing = today.find((s) => now >= s.open && now < s.close);
    if (closing) {
      changeInMinutes = closing.close - now;
      nextChangeAt = closing.close;
      nextChangeLabel = "aujourd'hui";
    }
  } else {
    // Later today, or the next open span of the week.
    const later = today.find((s) => s.open > now);
    if (later) {
      changeInMinutes = later.open - now;
      nextChangeAt = later.open;
      nextChangeLabel = "aujourd'hui";
    } else {
      for (let i = 1; i <= 7; i++) {
        const isoNext = ((day - 1 + i) % 7) + 1;
        const next = hours[isoNext] ?? [];
        if (next.length) {
          changeInMinutes = i * 24 * 60 - now + next[0].open;
          nextChangeAt = next[0].open;
          nextChangeLabel = i === 1 ? "demain" : DAY_NAMES[isoNext - 1];
          break;
        }
      }
    }
  }

  return {
    open,
    label: label ?? formatDay(hours, day),
    changeInMinutes,
    nextChangeAt,
    nextChangeLabel,
    today,
  };
}

/** "8h30 — 20h30", or "Fermé" for a day with no span. */
export function formatSpans(spans: DayHours): string {
  if (!spans.length) return "Fermé";
  return spans.map((s) => `${formatTime(s.open)} – ${formatTime(s.close)}`).join(" · ");
}

export function formatTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function formatDay(hours: WeekHours, day: number): string {
  return `${DAY_NAMES[day - 1] ?? ""} ${formatSpans(hours[day] ?? [])}`.trim();
}
