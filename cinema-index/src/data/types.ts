/**
 * THE CINEMA INDEX — content model (availability-driven).
 *
 * Content policy:
 * - Film facts are factual; artwork is editorial interpretation (labeled).
 * - Playback/download happen ONLY through verified authorized sources
 *   (`src/data/sources.ts`). A work without a verified source is not published.
 * - Internet Archive is not used anywhere.
 */

export interface EditorialArt {
  kind: "editorial-interpretation";
  src: string;
  altAr: string;
  position?: string;
}

export interface CastMember {
  nameAr: string;
  nameLatin: string;
  roleAr?: string;
}

export interface GenreRef {
  id: string;
  labelAr: string;
}

/** A subtitle track that really exists and really loads. */
export interface SubtitleRef {
  id: string;
  lang: "ar" | "en";
  labelAr: string;
  /** authored-translation: generated for this edition from a licensed track (same timings). */
  kind: "authored-translation" | "provider-cc" | "provider-page";
  /** Playable file (local /subtitles/ or provider URL). Empty = link-only track. */
  src: string;
  /** Honest provenance shown in the player. */
  originAr: string;
  /** Provider page where the origin track lives. */
  originUrl?: string;
}

export interface Film {
  id: string;
  indexCode: string;
  titleAr: string;
  titleOriginal: string;
  titleLatin: string;
  year: number;
  eraId: string;
  director: { nameAr: string; nameLatin: string };
  countryAr: string;
  runtimeMin: number;
  genres: string[];
  synopsisAr: string;
  noteAr: string;
  cast: CastMember[];
  collectionIds: string[];
  art: EditorialArt;
  /** Key into verifiedSources — the availability proof. */
  sourceId: string;
  subtitles: SubtitleRef[];
  relatedIds: string[];
}

export interface Episode {
  id: string;
  number: number;
  titleAr: string;
  titleOriginal: string;
  runtimeMin: number;
  synopsisAr: string;
  sourceId: string;
  subtitles: SubtitleRef[];
}

export interface Series {
  id: string;
  indexCode: string;
  titleAr: string;
  titleOriginal: string;
  titleLatin: string;
  yearStart: number;
  yearEnd: number;
  eraId: string;
  director: { nameAr: string; nameLatin: string };
  countryAr: string;
  genres: string[];
  synopsisAr: string;
  noteAr: string;
  cast: CastMember[];
  collectionIds: string[];
  art: EditorialArt;
  episodes: Episode[];
  relatedIds: string[];
  /** Optional enrichment id (TVmaze show id) when the show is matched there. */
  tvmazeId?: number;
}

export interface Collection {
  id: string;
  code: string;
  titleAr: string;
  subtitleAr: string;
  introAr: string;
  pullQuoteAr: string;
  filmIds: string[];
  seriesIds?: string[];
  art: EditorialArt;
}

export interface Era {
  id: string;
  labelAr: string;
  rangeAr: string;
}

export interface Catalog {
  films: Film[];
  series: Series[];
  collections: Collection[];
  eras: Era[];
}
