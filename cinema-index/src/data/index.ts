import { films, filmById, archiveMedia } from "./films";
import { series, seriesById } from "./series";
import { collections, collectionById } from "./collections";
import { genres, genreById, eras, eraById } from "./genres";
import type { Catalog, Film, Series } from "./types";

export * from "./types";
export { films, filmById, series, seriesById, collections, collectionById, genres, genreById, eras, eraById, archiveMedia };

export const catalog: Catalog = { films, series, collections, eras };

/** All works (films + series) for search and the flat index. */
export type Work = Film | Series;

export const isFilm = (w: Work): w is Film => "year" in w;

export const allWorks: Work[] = [...films, ...series];

export const workById = (id: string): Work | undefined => filmById(id) ?? seriesById(id);

export const workTitleAr = (w: Work): string => w.titleAr;
export const workYearLabel = (w: Work): string =>
  isFilm(w) ? String(w.year) : `${w.yearStart}–${w.yearEnd}`;

/** Search across titles (ar/original/latin), director, cast, genres. */
export function searchWorks(query: string): Work[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allWorks.filter((w) => {
    const years = isFilm(w)
      ? String(w.year)
      : `${w.yearStart} ${w.yearEnd} ${w.yearStart}–${w.yearEnd}`;
    const haystack = [
      w.titleAr,
      w.titleOriginal,
      w.titleLatin,
      w.director.nameAr,
      w.director.nameLatin,
      w.indexCode,
      years,
      ...w.genres.map((g) => genreById(g).labelAr),
      ...w.cast.map((c) => `${c.nameAr} ${c.nameLatin}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export const filmsInCollection = (collectionId: string): Film[] => {
  const col = collectionById(collectionId);
  return col ? col.filmIds.map((id) => filmById(id)).filter((f): f is Film => Boolean(f)) : [];
};

export const seriesInCollection = (collectionId: string): Series[] => {
  const col = collectionById(collectionId);
  return col?.seriesIds ? col.seriesIds.map((id) => seriesById(id)).filter((s): s is Series => Boolean(s)) : [];
};

export const filmsByDirector = (directorLatin: string, excludeId?: string): Film[] =>
  films.filter((f) => f.director.nameLatin === directorLatin && f.id !== excludeId);

/** Cross-references recorded on each work. */
export const relatedWorks = (id: string): Work[] => {
  const w = workById(id);
  return w ? w.relatedIds.map((rid) => workById(rid)).filter((x): x is Work => Boolean(x)) : [];
};
