import { z } from "zod";

/**
 * Schema of the archive. One vocabulary, enforced at import time: the data
 * files parse through these schemas, so a typo in a slug or a missing
 * license fails the build instead of reaching a screen.
 */

/** Genres double as catalog filters; labels are Arabic-first. */
export const GENRES = {
  silent: "صامت",
  expressionism: "تعبيرية",
  horror: "رعب",
  noir: "نوار",
  comedy: "كوميديا",
  scifi: "خيال علمي",
  adventure: "مغامرة",
  drama: "دراما",
  mystery: "غموض",
  fantasy: "فانتازيا",
  animation: "تحريك",
  cult: "طرائف",
  anthology: "أنثولوجيا",
  procedural: "بوليسي",
  romance: "رومانسي",
} as const;
export type GenreId = keyof typeof GENRES;
export const genreIds = Object.keys(GENRES) as GenreId[];

export const TINTS = ["amber", "blue", "green", "red", "sepia", "violet"] as const;
export type Tint = (typeof TINTS)[number];

/** Tint names in Arabic — used where the tint itself is editorialized. */
export const TINT_LABELS: Record<Tint, string> = {
  amber: "عنبري",
  blue: "أزرق ليلي",
  green: "أخضر غريب",
  red: "أحمر جمرة",
  sepia: "سيبيا",
  violet: "بنفسجي حالم",
};

/** Poster motif families — the geometry of each title's art plate. */
export const MOTIFS = ["eclipse", "shatter", "blinds", "arcs", "peaks", "orbit", "grid", "strip"] as const;
export type Motif = (typeof MOTIFS)[number];

/**
 * Licensing — the honesty core of the product. `pd` = public domain,
 * `cc-by` = Creative Commons Attribution (Blender open movies). Every title
 * carries one; nothing streams without it.
 */
export const licenseSchema = z.enum(["pd", "cc-by"]);
export type License = z.infer<typeof licenseSchema>;

export const LICENSE_LABELS: Record<License, string> = {
  pd: "ملكية عامة",
  "cc-by": "المشاع الإبداعي CC BY",
};

export const sourceSchema = z.object({
  /** All playback currently resolves through the Internet Archive. */
  host: z.literal("archive"),
  identifier: z.string().min(1),
  /**
   * A verified file name inside the item. When present the player starts
   * immediately; when absent it resolves the best derivative at runtime via
   * the Archive metadata API.
   */
  fileHint: z.string().optional(),
  /** Canonical details page — shown as attribution on every watch screen. */
  pageUrl: z.string().url(),
});
export type Source = z.infer<typeof sourceSchema>;

export const filmSchema = z.object({
  kind: z.literal("film"),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  titleAr: z.string().min(1),
  titleLat: z.string().min(1),
  /** Original-language title when neither Arabic nor English is the original. */
  titleOriginal: z.string().optional(),
  year: z.number().int().min(1888).max(2100),
  runtimeMin: z.number().int().positive(),
  directorAr: z.string().min(1),
  directorLat: z.string().min(1),
  castAr: z.array(z.string()).optional(),
  countryAr: z.string().min(1),
  countryLat: z.string().min(1),
  genres: z.array(z.enum(genreIds as [GenreId, ...GenreId[]])).min(1),
  collections: z.array(z.string()).default([]),
  synopsisAr: z.string().min(40),
  /** Curator's program note — the voice of the house. */
  noteAr: z.string().optional(),
  silent: z.boolean().default(false),
  license: licenseSchema,
  attribution: z.string().optional(),
  source: sourceSchema,
  tint: z.enum(TINTS),
  motif: z.enum(MOTIFS),
  /** Eligible for the daily program (the home hero rotation). */
  program: z.boolean().default(false),
});
export type Film = z.infer<typeof filmSchema>;

export const episodeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  /** Archive episode number when documented; never invented. */
  numberLabel: z.string().optional(),
  titleAr: z.string().min(1),
  titleLat: z.string().min(1),
  year: z.number().int().optional(),
  runtimeMin: z.number().int().positive(),
  source: sourceSchema,
});
export type Episode = z.infer<typeof episodeSchema>;

export const seasonSchema = z.object({
  /** Season number when documented; a preserved-episodes grouping otherwise. */
  n: z.number().int().optional(),
  labelAr: z.string().min(1),
  /** Honest qualifier, e.g. "الحلقات المتبقية وصلت غير مرتبة". */
  noteAr: z.string().optional(),
  episodes: z.array(episodeSchema).min(1),
});
export type Season = z.infer<typeof seasonSchema>;

export const seriesSchema = z.object({
  kind: z.literal("series"),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  titleAr: z.string().min(1),
  titleLat: z.string().min(1),
  yearFrom: z.number().int(),
  yearTo: z.number().int(),
  creatorAr: z.string().min(1),
  creatorLat: z.string().min(1),
  countryAr: z.string().min(1),
  countryLat: z.string().min(1),
  genres: z.array(z.enum(genreIds as [GenreId, ...GenreId[]])).min(1),
  synopsisAr: z.string().min(40),
  noteAr: z.string().optional(),
  license: licenseSchema,
  source: sourceSchema.optional(),
  tint: z.enum(TINTS),
  motif: z.enum(MOTIFS),
  seasons: z.array(seasonSchema).min(1),
});
export type Series = z.infer<typeof seriesSchema>;

/** A title the archive can show: a film, or a series. */
export type Title = Film | Series;
export const isFilm = (t: Title): t is Film => t.kind === "film";
export const isSeries = (t: Title): t is Series => t.kind === "series";

/** Section compositions — the homepage must never be a stack of clones. */
export const collectionLayouts = ["rail", "index", "salon", "wall", "wide", "feature"] as const;
export type CollectionLayout = (typeof collectionLayouts)[number];

export const collectionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  titleAr: z.string().min(1),
  titleLat: z.string().min(1),
  /** The curator's essay — 2–4 sentences printed on the collection page. */
  essayAr: z.string().min(60),
  layout: z.enum(collectionLayouts),
  tint: z.enum(TINTS),
  /** Film slugs, in programmed order. */
  members: z.array(z.string()).min(1),
  /** Shown as a home-program section (all are reachable from /مجموعات). */
  onHome: z.boolean().default(true),
  /** Home ordering, lowest first. */
  homeOrder: z.number().int().optional(),
});
export type Collection = z.infer<typeof collectionSchema>;
