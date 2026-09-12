/**
 * THE COMPARATOR — three slots, no more (P01: “optional simple compare”).
 *
 * Same discipline as the cart: one external store synced to localStorage, so
 * every toggle, the floating tray and the compare page converge without a
 * server round-trip. Only id + name are kept — the page itself re-reads the
 * catalogue, so a removed product simply disappears instead of lying there.
 */
export const MAX_COMPARE = 3;
const KEY = "cleo.compare.v1";

export type CompareItem = { id: number; name: string };

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is CompareItem => !!x && typeof x === "object" && typeof (x as CompareItem).id === "number" && typeof (x as CompareItem).name === "string")
      .slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();

/** The tab’s own truth; hydrated from storage on first read, synced on `storage`. */
let mem: CompareItem[] = [];
let hydrated = false;

function snapshot(): CompareItem[] {
  if (!hydrated) {
    mem = read();
    hydrated = true;
  }
  return mem;
}

function commit(next: CompareItem[]) {
  mem = next;
  hydrated = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — stay in-memory for this tab */
    }
  }
  for (const l of [...listeners]) l();
}

/** Stable getter for useSyncExternalStore — same reference until a commit lands. */
export function getCompare(): CompareItem[] {
  return snapshot();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) {
        mem = read();
        hydrated = true;
        cb();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => listeners.delete(cb);
}

export function toggleCompare(item: CompareItem): { added: boolean; full: boolean } {
  const cur = snapshot();
  if (cur.some((x) => x.id === item.id)) {
    commit(cur.filter((x) => x.id !== item.id));
    return { added: false, full: false };
  }
  if (cur.length >= MAX_COMPARE) return { added: false, full: true };
  commit([...cur, item]);
  return { added: true, full: false };
}

export function removeCompare(id: number) {
  commit(snapshot().filter((x) => x.id !== id));
}

export function clearCompare() {
  commit([]);
}

export const EMPTY_COMPARE: CompareItem[] = [];
