"use client";

import { useSyncExternalStore } from "react";
import { createStore, type Store } from "@/lib/store";

/**
 * Continue-watching progress. Written by the player every few seconds and on
 * unmount/pause; read by the home program and the player itself to offer an
 * honest resume. A title is only "resumable" past 30s and before ~96%.
 */

export interface ProgressEntry {
  /** seconds watched */
  t: number;
  /** duration at the time (guard against changed sources) */
  dur: number;
  updatedAt: number;
}

export type ProgressMap = Record<string, ProgressEntry>;

function parseMap(raw: string): ProgressMap | null {
  try {
    const data = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const out: ProgressMap = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        const e = v as Partial<ProgressEntry>;
        if (typeof e.t === "number" && typeof e.dur === "number") {
          out[k] = { t: e.t, dur: e.dur, updatedAt: e.updatedAt ?? Date.now() };
        }
      }
    }
    return out;
  } catch {
    return null;
  }
}

export const progressStore: Store<ProgressMap> = createStore("khayal:progress:v1", parseMap, {});

export function saveProgress(key: string, t: number, dur: number) {
  progressStore.set((prev) => ({ ...prev, [key]: { t, dur, updatedAt: Date.now() } }));
}

export function clearProgress(key: string) {
  progressStore.set((prev) => {
    const { [key]: _drop, ...rest } = prev;
    return rest;
  });
}

/** Progress worth resuming: started, not finished. */
export function resumable(entry: ProgressEntry | undefined): number | null {
  if (!entry) return null;
  if (entry.t < 30) return null;
  if (entry.dur > 0 && entry.t / entry.dur > 0.96) return null;
  return entry.t;
}

const EMPTY: ProgressMap = {};

export function useProgress(key: string): ProgressEntry | undefined {
  const map = useSyncExternalStore(progressStore.subscribe, progressStore.get, () => EMPTY);
  return map[key];
}

export function useProgressMap(): ProgressMap {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get, () => EMPTY);
}
