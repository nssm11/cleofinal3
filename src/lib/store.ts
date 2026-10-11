"use client";

/**
 * A tiny store for localStorage-backed state — watchlist and playback
 * progress share this foundation. Rules:
 *
 * · Reads on the server return `initial` (never hydration-mismatch).
 * · Subscribers re-render only when the serialized value changes.
 * · A `storage` listener keeps sibling tabs and re-visits in sync.
 */

export interface Store<T> {
  key: string;
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(key: string, parse: (raw: string) => T | null, initial: T): Store<T> {
  const listeners = new Set<() => void>();
  let cache: T = initial;
  let loaded = false;

  function load(): T {
    if (loaded) return cache;
    loaded = true;
    if (typeof window === "undefined") return cache;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed = parse(raw);
        if (parsed !== null) cache = parsed;
      }
    } catch {
      /* private mode / quota — the app keeps working without persistence */
    }
    return cache;
  }

  function notify() {
    for (const l of listeners) l();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      loaded = false;
      load();
      notify();
    });
  }

  return {
    key,
    get: load,
    set(next) {
      const prev = load();
      cache = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      loaded = true;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(cache));
        } catch {
          /* keep the in-memory value even if persistence failed */
        }
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
