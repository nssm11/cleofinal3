import type { HistoryEntry, LibraryApi, WatchEntry } from "./types";
import { STORAGE_KEYS } from "./types";

/** localStorage adapter — the demonstration implementation of LibraryApi. */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent("library:change", { detail: { key } }),
    );
  } catch {
    /* private mode / quota — fail quietly, library stays session-only */
  }
}

const targetKey = (workId: string, episodeId?: string) =>
  `${workId}::${episodeId ?? "*"}`;

export const localLibrary: LibraryApi = {
  async listWatchlist() {
    return read<WatchEntry[]>(STORAGE_KEYS.watchlist, []).sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt),
    );
  },

  async toggleWatchlist(workId) {
    const list = read<WatchEntry[]>(STORAGE_KEYS.watchlist, []);
    const next = list.some((e) => e.workId === workId)
      ? list.filter((e) => e.workId !== workId)
      : [...list, { workId, addedAt: new Date().toISOString() }];
    write(STORAGE_KEYS.watchlist, next);
    return next.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  },

  async isWatchlisted(workId) {
    return read<WatchEntry[]>(STORAGE_KEYS.watchlist, []).some(
      (e) => e.workId === workId,
    );
  },

  async listHistory() {
    return read<HistoryEntry[]>(STORAGE_KEYS.history, []).sort((a, b) =>
      b.watchedAt.localeCompare(a.watchedAt),
    );
  },

  async recordPlay(workId, episodeId) {
    const history = read<HistoryEntry[]>(STORAGE_KEYS.history, []);
    const key = targetKey(workId, episodeId);
    const rest = history.filter(
      (h) => targetKey(h.workId, h.episodeId) !== key,
    );
    rest.push({
      workId,
      episodeId,
      watchedAt: new Date().toISOString(),
      progress: 0,
      finished: false,
    });
    write(STORAGE_KEYS.history, rest.slice(-200));
  },

  async saveProgress(workId, progress, episodeId) {
    const history = read<HistoryEntry[]>(STORAGE_KEYS.history, []);
    const key = targetKey(workId, episodeId);
    const idx = history.findIndex(
      (h) => targetKey(h.workId, h.episodeId) === key,
    );
    const clamped = Math.min(1, Math.max(0, progress));
    const entry: HistoryEntry = {
      workId,
      episodeId,
      watchedAt: new Date().toISOString(),
      progress: clamped,
      finished: clamped >= 0.97,
    };
    if (idx >= 0) history[idx] = entry;
    else history.push(entry);
    write(STORAGE_KEYS.history, history.slice(-200));
  },

  async clearHistory() {
    write(STORAGE_KEYS.history, []);
  },

  async getProgress(workId, episodeId) {
    const key = targetKey(workId, episodeId);
    const found = read<HistoryEntry[]>(STORAGE_KEYS.history, []).find(
      (h) => targetKey(h.workId, h.episodeId) === key,
    );
    return found?.progress ?? 0;
  },
};
