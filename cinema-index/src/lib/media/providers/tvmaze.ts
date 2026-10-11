/**
 * TVmaze provider — keyless public metadata API used for series enrichment
 * and episode alignment. Strictly metadata: TVmaze is never treated as a
 * video host here.
 * Docs: https://www.tvmaze.com/api
 */

export interface TvMazeShow {
  id: number;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime: number | null;
  premiered: string | null;
  officialSite: string | null;
  summary: string | null;
  network: { name: string; country: { name: string; code: string } } | null;
  webChannel: { name: string } | null;
  image: { medium: string; original: string } | null;
  externals: { tvdb?: number; thetvdb?: number; imdb?: string };
  url: string;
}

export interface TvMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  runtime: number | null;
  airdate: string;
  summary: string | null;
}

const API = "https://api.tvmaze.com";

async function getJson<T>(path: string): Promise<T | undefined> {
  try {
    const res = await fetch(`${API}${path}`);
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`TVmaze: HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return undefined; // honest absence, no fake fallback
  }
}

export const searchShows = (
  query: string,
): Promise<Array<{ score: number; show: TvMazeShow }> | undefined> =>
  getJson(`/search/shows?q=${encodeURIComponent(query)}`);

export const showById = (id: number): Promise<TvMazeShow | undefined> =>
  getJson(`/shows/${id}`);

export const episodesFor = (id: number): Promise<TvMazeEpisode[] | undefined> =>
  getJson(`/shows/${id}/episodes`);

/**
 * Best TVmaze match for a series title (+ year). Returns undefined when the
 * show is simply not in TVmaze — the UI then says so honestly.
 */
export async function matchShow(
  title: string,
  year?: number,
): Promise<{ show: TvMazeShow; score: number } | undefined> {
  const hits = await searchShows(title);
  if (!hits || hits.length === 0) return undefined;
  const ranked = [...hits].sort((a, b) => {
    const yearScore = (s: TvMazeShow) =>
      year && s.premiered
        ? Math.abs(Number(s.premiered.slice(0, 4)) - year)
        : 10;
    return b.score - a.score || yearScore(a.show) - yearScore(b.show);
  });
  const top = ranked[0];
  return top ? { show: top.show, score: top.score } : undefined;
}

export const stripHtml = (s: string | null): string =>
  (s ?? "").replace(/<[^>]+>/g, "").trim();
