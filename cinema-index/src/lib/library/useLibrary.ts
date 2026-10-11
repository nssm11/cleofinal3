import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry, WatchEntry } from "./types";
import { localLibrary } from "./localLibrary";

/** The active adapter. Swap here when a backend exists. */
export const library = localLibrary;

const CHANGE_EVENT = "library:change";

function useLibraryVersion(): [number, () => void] {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CHANGE_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(CHANGE_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return [version, useCallback(() => setVersion((v) => v + 1), [])];
}

export function useWatchlist() {
  const [version] = useLibraryVersion();
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    library.listWatchlist().then((list) => {
      if (!alive) return;
      setEntries(list);
      setIds(new Set(list.map((e) => e.workId)));
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const toggle = useCallback(async (workId: string) => {
    const next = await library.toggleWatchlist(workId);
    setEntries(next);
    setIds(new Set(next.map((e) => e.workId)));
  }, []);

  return { entries, ids, toggle, has: (id: string) => ids.has(id) };
}

export function useHistory() {
  const [version] = useLibraryVersion();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let alive = true;
    library.listHistory().then((list) => {
      if (alive) setEntries(list);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const clear = useCallback(async () => {
    await library.clearHistory();
    setEntries([]);
  }, []);

  return { entries, clear };
}

/** Progress 0..1 for one film or one episode. */
export function useProgress(workId: string | undefined, episodeId?: string) {
  const [version] = useLibraryVersion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!workId) return;
    let alive = true;
    library.getProgress(workId, episodeId).then((p) => {
      if (alive) setProgress(p);
    });
    return () => {
      alive = false;
    };
  }, [workId, episodeId, version]);

  return progress;
}

/** Per-episode progress map for a series (episode id → 0..1). */
export function useEpisodeProgressMap(workId: string | undefined) {
  const [version] = useLibraryVersion();
  const [map, setMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!workId) return;
    let alive = true;
    void library.listHistory().then((list) => {
      if (!alive) return;
      const next: Record<string, number> = {};
      for (const h of list) {
        if (h.workId === workId && h.episodeId) next[h.episodeId] = h.progress;
      }
      setMap(next);
    });
    return () => {
      alive = false;
    };
  }, [workId, version]);

  return map;
}
