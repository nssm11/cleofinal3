import { films } from "@/data/films";
import { seriesList } from "@/data/series";
import { collections } from "@/data/collections";
import {
  GENRES,
  isFilm,
  isSeries,
  type Collection,
  type Episode,
  type Film,
  type Series,
  type Title,
} from "@/data/types";
import { formatYearRange, hashString } from "@/lib/format";

/**
 * The archive's single source of truth for reads.
 *
 * Today it is bound to the curated demo dataset in `src/data` — deliberately
 * separated from this module so a production binding (database + CMS) can
 * replace the imports without any UI change. Every page reads through here;
 * nothing reaches into `src/data` directly except tests and this file.
 */

const titles: Title[] = [...films, ...seriesList];

export const repo = {
  films,
  seriesList,
  collections,
  titles,
};

export function getFilm(slug: string): Film | undefined {
  return films.find((f) => f.slug === slug);
}

export function getSeries(slug: string): Series | undefined {
  return seriesList.find((s) => s.slug === slug);
}

export function getTitle(slug: string): Title | undefined {
  return titles.find((t) => t.slug === slug);
}

/** One-based archive number printed on plates (№014) — stable by order. */
export function archiveIndexOf(slug: string): number {
  const i = titles.findIndex((t) => t.slug === slug);
  return i < 0 ? 0 : i + 1;
}

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function homeCollections(): Collection[] {
  return collections
    .filter((c) => c.onHome)
    .sort((a, b) => (a.homeOrder ?? 99) - (b.homeOrder ?? 99));
}

/** Resolve a collection's members to film records, in programmed order. */
export function collectionFilms(collection: Collection): Film[] {
  return collection.members
    .map((slug) => getFilm(slug))
    .filter((f): f is Film => Boolean(f));
}

export interface FilmFilter {
  genres?: string[];
  decades?: number[];
  licenses?: string[];
  /** Text query — normalized Arabic matching, see `normalizeAr`. */
  q?: string;
  sort?: "year-desc" | "year-asc" | "title-ar" | "runtime";
}

export function listFilms(filter: FilmFilter = {}): Film[] {
  const q = filter.q?.trim() ? normalizeAr(filter.q) : "";
  let result = films.filter((f) => {
    if (filter.genres?.length && !f.genres.some((g) => filter.genres!.includes(g))) return false;
    if (filter.decades?.length && !filter.decades.includes(Math.floor(f.year / 10) * 10)) return false;
    if (filter.licenses?.length && !filter.licenses.includes(f.license)) return false;
    if (q && !filmHaystack(f).includes(q)) return false;
    return true;
  });
  switch (filter.sort) {
    case "year-asc":
      result = [...result].sort((a, b) => a.year - b.year);
      break;
    case "title-ar":
      result = [...result].sort((a, b) => a.titleAr.localeCompare(b.titleAr, "ar"));
      break;
    case "runtime":
      result = [...result].sort((a, b) => a.runtimeMin - b.runtimeMin);
      break;
    case "year-desc":
    default:
      result = [...result].sort((a, b) => b.year - a.year);
      break;
  }
  return result;
}

/* — the daily program — */

export interface Program {
  featured: Film;
  next: [Film, Film];
  dateKey: string;
}

/**
 * "Tonight's program": a deterministic daily rotation over the `program`
 * pool. No backend, no randomness per request — the same day shows the same
 * program for every visitor, like a real cinematheque's printed schedule.
 */
export function todaysProgram(now = new Date()): Program {
  const pool = films.filter((f) => f.program);
  const dateKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  const start = hashString(dateKey) % pool.length;
  const at = (i: number) => pool[(start + i) % pool.length];
  return { featured: at(0), next: [at(1), at(2)], dateKey };
}

/* — related programming — */

export function relatedTo(title: Title, limit = 6): Title[] {
  const scored = titles
    .filter((t) => t.slug !== title.slug)
    .map((t) => {
      let score = 0;
      if (isFilm(title) && isFilm(t)) {
        const sharedCollections = t.collections.filter((c) => title.collections.includes(c));
        score += sharedCollections.length * 3;
        score += t.genres.filter((g) => title.genres.includes(g)).length * 2;
        if (t.directorLat === title.directorLat) score += 4;
        if (Math.abs(t.year - title.year) <= 6) score += 1;
        if (t.silent === title.silent) score += 1;
      } else {
        score += t.genres.filter((g) => title.genres.includes(g)).length * 2;
      }
      return { t, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.t.titleAr.localeCompare(b.t.titleAr, "ar"));
  return scored.slice(0, limit).map((s) => s.t);
}

/* — episodes — */

export interface EpisodeRef {
  series: Series;
  seasonIndex: number;
  episodeIndex: number;
  episode: Episode;
}

export function allEpisodes(series: Series): EpisodeRef[] {
  const out: EpisodeRef[] = [];
  series.seasons.forEach((season, seasonIndex) => {
    season.episodes.forEach((episode, episodeIndex) => {
      out.push({ series, seasonIndex, episodeIndex, episode });
    });
  });
  return out;
}

export function findEpisode(seriesSlug: string, episodeSlug: string): EpisodeRef | undefined {
  const series = getSeries(seriesSlug);
  if (!series) return undefined;
  return allEpisodes(series).find((ref) => ref.episode.slug === episodeSlug);
}

export function neighbors(ref: EpisodeRef): { prev?: EpisodeRef; next?: EpisodeRef } {
  const all = allEpisodes(ref.series);
  const i = all.findIndex(
    (r) => r.seasonIndex === ref.seasonIndex && r.episodeIndex === ref.episodeIndex,
  );
  return { prev: all[i - 1], next: all[i + 1] };
}

/* — archive statistics (computed, never hardcoded) — */

export interface ArchiveStats {
  films: number;
  series: number;
  episodes: number;
  years: string;
  countries: number;
  openLicensed: number;
}

export function archiveStats(): ArchiveStats {
  const years = titles.flatMap((t) => (isFilm(t) ? [t.year] : [t.yearFrom, t.yearTo]));
  const countries = new Set(
    films.map((f) => f.countryLat).concat(seriesList.map((s) => s.countryLat)),
  );
  const episodes = seriesList.reduce((n, s) => n + allEpisodes(s).length, 0);
  return {
    films: films.length,
    series: seriesList.length,
    episodes,
    years: formatYearRange(Math.min(...years), Math.max(...years)),
    countries: countries.size,
    openLicensed: [...films, ...seriesList].filter((t) => t.license === "cc-by").length,
  };
}

/* — Arabic-aware search — */

/**
 * Fold Arabic orthography for matching: diacritics and tatweel removed,
 * alef/yeh/teh-marbuta variants unified, Latin lowercased. Search must
 * forgive the way people actually type Arabic.
 */
export function normalizeAr(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // harakat, dagger alef, tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // أ إ آ ٱ → ا
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0626/g, "\u064A") // ئ → ي
    .replace(/\u0624/g, "\u0648") // ؤ → و
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type SearchKind = "film" | "series" | "episode" | "collection";

export interface SearchHit {
  kind: SearchKind;
  title: Title | Collection;
  /** For episode hits: the owning series + episode ref. */
  episodeRef?: EpisodeRef;
  labelAr: string;
  labelLat: string;
  yearLabel: string;
  score: number;
}

function genreLabels(t: Title): string[] {
  return t.genres.map((g) => GENRES[g]);
}

function filmHaystack(f: Film): string {
  return normalizeAr(
    [
      f.titleAr,
      f.titleLat,
      f.titleOriginal ?? "",
      f.directorAr,
      f.directorLat,
      f.synopsisAr,
      ...genreLabels(f),
      f.countryAr,
      f.countryLat,
      String(f.year),
    ].join(" "),
  );
}

function seriesHaystack(s: Series): string {
  return normalizeAr(
    [s.titleAr, s.titleLat, s.creatorAr, s.creatorLat, s.synopsisAr, ...genreLabels(s), s.countryAr, s.countryLat, String(s.yearFrom), String(s.yearTo)].join(" "),
  );
}

export interface SearchOptions {
  limit?: number;
}

/**
 * Immediate search over films, series, individual episodes and collections.
 * Title-prefix matches outrank title-contains, which outrank people, which
 * outrank synopsis text — the ranking a catalog search should have.
 */
export function search(query: string, options: SearchOptions = {}): SearchHit[] {
  const q = normalizeAr(query);
  if (!q) return [];
  const limit = options.limit ?? 24;
  const hits: SearchHit[] = [];

  const push = (hit: Omit<SearchHit, "score">, where: "title" | "person" | "body") => {
    const nq = normalizeAr(hit.labelAr + " " + hit.labelLat);
    const startsWith = nq.startsWith(q);
    const contains = nq.includes(q);
    const score =
      where === "title"
        ? startsWith ? 100 : contains ? 70 : 0
        : where === "person"
          ? contains ? 40 : 0
          : contains ? 15 : 0;
    if (score > 0) hits.push({ ...hit, score });
  };

  for (const f of films) {
    push(
      {
        kind: "film",
        title: f,
        labelAr: f.titleAr,
        labelLat: f.titleLat,
        yearLabel: String(f.year),
      },
      "title",
    );
    const person = normalizeAr(`${f.directorAr} ${f.directorLat} ${(f.castAr ?? []).join(" ")}`);
    if (person.includes(q)) {
      hits.push({
        kind: "film",
        title: f,
        labelAr: f.titleAr,
        labelLat: f.titleLat,
        yearLabel: String(f.year),
        score: 40,
      });
    }
    const body = normalizeAr(`${f.synopsisAr} ${genreLabels(f).join(" ")} ${f.countryAr} ${f.titleOriginal ?? ""}`);
    if (body.includes(q)) {
      hits.push({
        kind: "film",
        title: f,
        labelAr: f.titleAr,
        labelLat: f.titleLat,
        yearLabel: String(f.year),
        score: 15,
      });
    }
  }

  for (const s of seriesList) {
    push(
      {
        kind: "series",
        title: s,
        labelAr: s.titleAr,
        labelLat: s.titleLat,
        yearLabel: `${s.yearFrom}`,
      },
      "title",
    );
    if (seriesHaystack(s).includes(q)) {
      hits.push({
        kind: "series",
        title: s,
        labelAr: s.titleAr,
        labelLat: s.titleLat,
        yearLabel: `${s.yearFrom}`,
        score: 18,
      });
    }
    for (const ref of allEpisodes(s)) {
      const eq = normalizeAr(`${ref.episode.titleAr} ${ref.episode.titleLat}`);
      if (eq.includes(q)) {
        hits.push({
          kind: "episode",
          title: s,
          episodeRef: ref,
          labelAr: ref.episode.titleAr,
          labelLat: ref.episode.titleLat,
          yearLabel: `${s.titleAr} · ${ref.episode.numberLabel ?? ""}`.trim(),
          score: 30,
        });
      }
    }
  }

  for (const c of collections) {
    if (normalizeAr(`${c.titleAr} ${c.titleLat} ${c.essayAr}`).includes(q)) {
      hits.push({
        kind: "collection",
        title: c,
        labelAr: c.titleAr,
        labelLat: c.titleLat,
        yearLabel: `${c.members.length} أفلام`,
        score: 25,
      });
    }
  }

  // Deduplicate (a film can hit twice), then rank.
  const seen = new Set<string>();
  return hits
    .sort((a, b) => b.score - a.score)
    .filter((h) => {
      const key = `${h.kind}:${h.episodeRef ? h.episodeRef.episode.slug : (h.title as Title | Collection).slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/** Popular starting points for the empty search state. */
export function suggestedQueries(): string[] {
  return ["كيتون", "نوار", "نوسفيراتو", "شرلوك هولمز", "رعب", "Blender", "ميلييس", "ويلز"];
}

export { isFilm, isSeries };
