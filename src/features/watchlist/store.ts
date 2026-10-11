"use client";

import { useSyncExternalStore } from "react";
import { createStore, type Store } from "@/lib/store";

/**
 * The watchlist — "قائمتي". Stored locally (this is a zero-budget, account
 * -free archive; the data layer for a future account system will mirror this
 * shape). Keyed so a film and a series episode can both be saved.
 */

export interface WatchlistEntry {
  /** Stable key: film slug, or `series/episode` for episodes. */
  key: string;
  kind: "film" | "series";
  slug: string;
  episodeSlug?: string;
  addedAt: number;
}

function parseEntries(raw: string): WatchlistEntry[] | null {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data.filter(
      (e): e is WatchlistEntry =>
        e && typeof e.key === "string" && (e.kind === "film" || e.kind === "series") && typeof e.slug === "string",
    );
  } catch {
    return null;
  }
}

export const watchlistStore: Store<WatchlistEntry[]> = createStore("khayal:watchlist:v1", parseEntries, []);

export function useWatchlist() {
  const entries = useSyncExternalStore(
    watchlistStore.subscribe,
    watchlistStore.get,
    () => EMPTY,
  );
  return entries;
}

const EMPTY: WatchlistEntry[] = [];

export function useWatchlistHas(key: string): boolean {
  const entries = useWatchlist();
  return entries.some((e) => e.key === key);
}

export function watchlistHas(key: string): boolean {
  return watchlistStore.get().some((e) => e.key === key);
}

/** Toggle — returns the new saved state. Immediate; optimistic by design. */
export function toggleWatchlist(entry: Omit<WatchlistEntry, "addedAt">): boolean {
  const current = watchlistStore.get();
  const exists = current.some((e) => e.key === entry.key);
  if (exists) {
    watchlistStore.set(current.filter((e) => e.key !== entry.key));
    return false;
  }
  watchlistStore.set([{ ...entry, addedAt: Date.now() }, ...current]);
  return true;
}

export function removeFromWatchlist(key: string) {
  watchlistStore.set(watchlistStore.get().filter((e) => e.key !== key));
}
