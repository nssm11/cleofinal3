/** Formatting helpers — the publication's typographic apparatus. */

export const runtimeLabel = (min: number): string => {
  if (min < 60) return `${min} د`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} س` : `${h} س ${m} د`;
};

/** Join title parts, dropping duplicates (original == latin for many works). */
export const originalLine = (parts: (string | undefined)[]): string =>
  [...new Set(parts.map((p) => p?.trim()).filter(Boolean))].join(" · ");

export const runtimeLabelLong = (min: number): string => {
  if (min < 60) return `${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} ساعة` : `${h} ساعة ${m} دقيقة`;
};

export const dateLabel = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-TN-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const timeLabel = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-TN-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Issue folio of the publication (static for issue 01). */
export const ISSUE = {
  number: "01",
  seasonAr: "خريف 2026",
  strapline: "THE CINEMA INDEX — ARCHIVE EDITION",
} as const;
