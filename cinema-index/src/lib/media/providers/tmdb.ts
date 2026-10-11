/**
 * TMDB provider — metadata & discovery only (never a video host).
 * Key-gated: without VITE_TMDB_API_KEY the module reports "not configured"
 * and the UI says so honestly. A server-side proxy may supply TMDB_API_KEY.
 * Docs: https://developer.themoviedb.org/docs
 */

const API = "https://api.themoviedb.org/3";

export const tmdbConfigured = (): boolean =>
  Boolean(
    import.meta.env.VITE_TMDB_API_KEY ??
    (import.meta as { env?: Record<string, string> }).env?.TMDB_API_KEY,
  );

const key = (): string | undefined =>
  (import.meta.env.VITE_TMDB_API_KEY ??
    (import.meta as { env?: Record<string, string> }).env?.TMDB_API_KEY) as
    string | undefined;

export interface TmdbTitle {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  original_language: string;
  vote_average: number;
}

async function getJson<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T | undefined> {
  const k = key();
  if (!k) return undefined;
  const qs = new URLSearchParams({ api_key: k, language: "ar", ...params });
  try {
    const res = await fetch(`${API}${path}?${qs.toString()}`);
    if (!res.ok) throw new Error(`TMDB: HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

/** Discovery: newest titles in a category (used by the sync script). */
export const discoverMovies = (
  params: Record<string, string> = {},
): Promise<{ results: TmdbTitle[] } | undefined> =>
  getJson("/discover/movie", {
    sort_by: "primary_release_date.desc",
    ...params,
  });

export const discoverTv = (
  params: Record<string, string> = {},
): Promise<{ results: TmdbTitle[] } | undefined> =>
  getJson("/discover/tv", { sort_by: "first_air_date.desc", ...params });

export const searchTmdb = (
  query: string,
): Promise<{ results: TmdbTitle[] } | undefined> =>
  getJson("/search/multi", { query });

export const statusMessage = (): string =>
  tmdbConfigured()
    ? "TMDB: مُفعَّل (بيانات وصفية واكتشاف — ليست مضيف فيديو)."
    : "TMDB: غير مُفعَّل — أضف VITE_TMDB_API_KEY لتفعيل طبقة الاكتشاف. بدونه تعمل المصادر المفتوحة كاملة.";
