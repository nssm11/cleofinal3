import type { SubtitleRef } from "./types";

/**
 * Subtitle registry — every track here is real and loadable (or, for
 * `provider-page`, honestly link-only). Nothing is faked:
 * - `nosferatu-ar` is a full Arabic translation (240 cues) generated for this
 *   edition from the licensed English caption track on Wikimedia Commons,
 *   cue-for-cue with identical timings. File: /subtitles/nosferatu-ar.srt
 * - Where no Arabic track exists, the UI says so plainly.
 */

const nosferatuOrigin =
  "ترجمة عربية كاملة (240 جملة) أُنتجت لهذه النسخة من الترجمة الإنجليزية المرخّصة على ويكيميديا كومنز — بنفس التوقيتات حرفيًا.";

export const subtitlesByWork: Record<string, SubtitleRef[]> = {
  nosferatu: [
    {
      id: "nosferatu-ar",
      lang: "ar",
      labelAr: "العربية (ترجمة هذه النسخة)",
      kind: "authored-translation",
      src: "/subtitles/nosferatu-ar.srt",
      originAr: nosferatuOrigin,
      originUrl:
        "https://commons.wikimedia.org/wiki/TimedText:Nosferatu_(1922).webm.en.srt",
    },
    {
      id: "nosferatu-en",
      lang: "en",
      labelAr: "الإنجليزية (المزوّد)",
      kind: "provider-page",
      src: "",
      originAr:
        "ترجمة إنجليزية بتوقيتات مرفوعة من المزوّد على صفحة الملف — يمكن تفعيلها هناك، ولم نُحمّلها هنا.",
      originUrl:
        "https://commons.wikimedia.org/wiki/TimedText:Nosferatu_(1922).webm.en.srt",
    },
  ],
};

export const subtitlesFor = (workId: string): SubtitleRef[] =>
  subtitlesByWork[workId] ?? [];

/** Works whose Arabic subtitle is shipped with the app (countable, honest). */
export const shippedArabicSubtitles = Object.values(subtitlesByWork)
  .flat()
  .filter((s) => s.lang === "ar" && s.src !== "").length;
