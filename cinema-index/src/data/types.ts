/**
 * THE CINEMA INDEX — content model.
 *
 * Content policy (see docs/DESIGN-CONCEPTS.md):
 * - Film facts (titles, years, directors, cast, runtimes) are factual.
 * - Artwork is original editorial interpretation produced for this publication;
 *   `art.kind` is always "editorial-interpretation" and the UI labels it.
 * - Playback is delivered only through authorized public-domain sources
 *   (Internet Archive items). `media.rights` records the basis.
 */

export type MediaKind = "film" | "episode";

export interface MediaSource {
  kind: MediaKind;
  provider: "Internet Archive";
  /** Verified archive.org item identifier. */
  itemId: string;
  detailsUrl: string;
  embedUrl: string;
  rights: "public-domain";
  rightsNoteAr: string;
}

export interface EditorialArt {
  kind: "editorial-interpretation";
  src: string;
  altAr: string;
  /** Positioning hint for CSS object-position when cropping. */
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

export interface Film {
  id: string;
  /** Index code shown across the publication, e.g. ف-014 */
  indexCode: string;
  titleAr: string;
  titleOriginal: string;
  titleLatin: string;
  year: number;
  /** Year grouping used by the index filters. */
  eraId: string;
  director: { nameAr: string; nameLatin: string };
  countryAr: string;
  runtimeMin: number;
  genres: string[];
  synopsisAr: string;
  /** Editorial note — why this work sits in the index. */
  noteAr: string;
  cast: CastMember[];
  collectionIds: string[];
  art: EditorialArt;
  media: MediaSource;
  /** Cross-references: same director / movement / era. */
  relatedIds: string[];
}

export interface Episode {
  id: string;
  number: number;
  titleAr: string;
  titleOriginal: string;
  runtimeMin: number;
  synopsisAr: string;
  media: MediaSource;
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
  /** Landing source for the whole serial. */
  detailsUrl: string;
  rightsNoteAr: string;
  relatedIds: string[];
}

export interface Collection {
  id: string;
  /** Editorial identifier, e.g. المجموعة 02 */
  code: string;
  titleAr: string;
  subtitleAr: string;
  introAr: string;
  pullQuoteAr: string;
  /** Ordered: first item is the collection's lead. */
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
