import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  probeUrl,
  verifySource,
  cachedVerification,
  evidenceVerification,
} from "./verify";
import { sourceFor } from "../../data/sources";

const realFetch = globalThis.fetch;

/** In-memory localStorage so the cache layer runs under node. */
const store = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

beforeAll(() => {
  vi.stubGlobal("window", { localStorage: fakeStorage });
});

afterEach(() => {
  globalThis.fetch = realFetch;
  fakeStorage.clear();
  vi.restoreAllMocks();
  vi.stubGlobal("window", { localStorage: fakeStorage });
});

describe("live source verification", () => {
  it("accepts a real media response (HEAD video/webm)", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(null, {
          status: 200,
          headers: { "content-type": "video/webm", "content-length": "1234" },
        }),
    ) as unknown as typeof fetch;
    const v = await probeUrl("https://upload.wikimedia.org/x.webm");
    expect(v.state).toBe("verified-live");
    expect(v.bytes).toBe(1234);
  });

  it("rejects non-media payloads even when HTTP 200", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(null, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    ) as unknown as typeof fetch;
    const v = await probeUrl("https://upload.wikimedia.org/x.webm");
    expect(v.state).toBe("failed");
  });

  it("reports failure honestly on network error (no fake success)", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;
    const v = await probeUrl("https://upload.wikimedia.org/x.webm");
    expect(v.state).toBe("failed");
    expect(v.error).toContain("boom");
  });

  it("caches results per source and falls back to authoring evidence", async () => {
    const src = sourceFor("nosferatu")!;
    globalThis.fetch = vi.fn(
      async () =>
        new Response(null, {
          status: 200,
          headers: { "content-type": "video/webm" },
        }),
    ) as unknown as typeof fetch;
    const v1 = await verifySource(src);
    expect(v1.state).toBe("verified-live");
    expect(cachedVerification("nosferatu")!.state).toBe("verified-live");
    // second call served from cache — fetch not invoked again
    globalThis.fetch = vi.fn(async () => {
      throw new Error("should not be called");
    }) as unknown as typeof fetch;
    const v2 = await verifySource(src);
    expect(v2.state).toBe("verified-live");
    const ev = evidenceVerification(src);
    expect(ev.state).toBe("verified-evidence");
  });
});
