import type { VerifiedSource } from "../../data/sources";

/**
 * Source verification — layered and cached.
 *
 * 1. Authoring evidence: every manifest entry carries `verifiedAt` + `evidence`
 *    (the provider's file page) collected through the provider API.
 * 2. Live recheck: the browser probes the actual media URL (HEAD, falling back
 *    to a 1-byte Range GET) — a real reachability + content-type test, not a
 *    status-code-only guess. Results are cached in localStorage with a TTL so
 *    page views don't re-probe the same URL.
 * 3. Periodic recheck: entries older than RECHECK_DAYS are marked "pending
 *    recheck" in the UI and re-probed on the next watch-page visit.
 */

export type VerificationState =
  | "verified-live" // probed successfully from the browser just now (cached)
  | "verified-evidence" // authoring-time proof, live probe pending/cached-expired
  | "failed"; // live probe failed

export interface Verification {
  state: VerificationState;
  at: string; // ISO
  bytes?: number;
  contentType?: string;
  error?: string;
}

const TTL_MS = 24 * 60 * 60 * 1000;
export const RECHECK_DAYS = 7;
const KEY = "cinema-index:source-verify:v1";

type Cache = Record<string, Verification>;

function readCache(): Cache {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Cache;
  } catch {
    return {};
  }
}

function writeCache(c: Cache): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* private mode */
  }
}

export const evidenceVerification = (source: VerifiedSource): Verification => ({
  state: "verified-evidence",
  at: `${source.verifiedAt}T00:00:00.000Z`,
});

export function cachedVerification(sourceId: string): Verification | undefined {
  const v = readCache()[sourceId];
  if (!v) return undefined;
  if (Date.now() - new Date(v.at).getTime() > TTL_MS) return undefined;
  return v;
}

export function needsRecheck(v: Verification): boolean {
  return (
    Date.now() - new Date(v.at).getTime() > RECHECK_DAYS * 24 * 60 * 60 * 1000
  );
}

/** Live probe of one URL: reachable + actually a media payload. */
export async function probeUrl(url: string): Promise<Verification> {
  try {
    let res = await fetch(url, { method: "HEAD", mode: "cors" });
    if (!res.ok && res.status !== 206) {
      res = await fetch(url, {
        method: "GET",
        mode: "cors",
        headers: { Range: "bytes=0-1" },
      });
    }
    if (!res.ok && res.status !== 206) {
      return {
        state: "failed",
        at: new Date().toISOString(),
        error: `HTTP ${res.status}`,
      };
    }
    const type = res.headers.get("content-type") ?? "";
    const len = res.headers.get("content-length");
    if (
      type &&
      !/video|audio|ogg|octet-stream|mp4|webm|quicktime/i.test(type)
    ) {
      return {
        state: "failed",
        at: new Date().toISOString(),
        contentType: type,
        error: `غير وسيط فيديو: ${type}`,
      };
    }
    return {
      state: "verified-live",
      at: new Date().toISOString(),
      bytes: len ? Number(len) : undefined,
      contentType: type || undefined,
    };
  } catch (e) {
    return {
      state: "failed",
      at: new Date().toISOString(),
      error: e instanceof Error ? e.message : "تعذّر الوصول",
    };
  }
}

/** Verify a manifest source (cache → live probe → authoring evidence). */
export async function verifySource(
  source: VerifiedSource,
): Promise<Verification> {
  const cached = cachedVerification(source.id);
  if (cached && cached.state !== "failed") return cached;
  const live = await probeUrl(source.originalUrl);
  const cache = readCache();
  cache[source.id] = live;
  writeCache(cache);
  return live;
}

export const verificationLabel = (v: Verification): string =>
  v.state === "verified-live"
    ? "تم التحقق المباشر"
    : v.state === "verified-evidence"
      ? "مُتحقَّق منه عند التجميع"
      : "فشل التحقق";
