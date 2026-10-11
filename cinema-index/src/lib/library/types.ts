/**
 * Library — demonstration-only personal state (watchlist, history, progress).
 *
 * Everything here runs locally in the browser (no account, no server). The
 * `LibraryApi` interface is the seam where a future secure backend plugs in:
 * replace the localStorage adapter in `storage.ts` with an HTTP adapter and the
 * views do not change.
 */

export interface WatchEntry {
  workId: string;
  addedAt: string; // ISO
}

export interface HistoryEntry {
  workId: string;
  /** Episode id when the entry is a series episode. */
  episodeId?: string;
  watchedAt: string; // ISO
  /** 0..1 playback position, only for the last session of each target. */
  progress: number;
  finished: boolean;
}

export interface LibraryApi {
  listWatchlist(): Promise<WatchEntry[]>;
  toggleWatchlist(workId: string): Promise<WatchEntry[]>;
  isWatchlisted(workId: string): Promise<boolean>;

  listHistory(): Promise<HistoryEntry[]>;
  recordPlay(workId: string, episodeId?: string): Promise<void>;
  saveProgress(
    workId: string,
    progress: number,
    episodeId?: string,
  ): Promise<void>;
  clearHistory(): Promise<void>;

  /** Last known progress for a target (film or episode) in 0..1. */
  getProgress(workId: string, episodeId?: string): Promise<number>;
}

export const STORAGE_KEYS = {
  watchlist: "cinema-index:watchlist:v1",
  history: "cinema-index:history:v1",
} as const;
