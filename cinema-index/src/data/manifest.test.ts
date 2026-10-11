import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  films,
  series,
  collections,
  allWorks,
  isFilm,
  searchWorks,
} from "./index";
import { verifiedSources, sourceFor, estimateBytes } from "./sources";
import { subtitlesFor, shippedArabicSubtitles } from "./subtitles";
import { downloadRows, defaultVariant } from "../lib/media/downloads";

const SRC = path.resolve(__dirname, "..");
const PUBLIC = path.resolve(__dirname, "../../public");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe("verified-source manifest integrity", () => {
  it("every work and every episode resolves to a verified source", () => {
    for (const f of films) expect(sourceFor(f.sourceId), f.id).toBeDefined();
    for (const s of series) {
      for (const e of s.episodes)
        expect(sourceFor(e.sourceId), e.id).toBeDefined();
    }
  });

  it("all media URLs are Wikimedia upload URLs over https", () => {
    for (const src of Object.values(verifiedSources)) {
      expect(src.originalUrl.startsWith("https://upload.wikimedia.org/")).toBe(
        true,
      );
      for (const v of src.variants)
        expect(v.url.startsWith("https://upload.wikimedia.org/")).toBe(true);
    }
  });

  it("every source carries licence, evidence page and verification date", () => {
    for (const src of Object.values(verifiedSources)) {
      expect(src.license.length).toBeGreaterThan(1);
      expect(src.evidence).toContain("commons.wikimedia.org");
      expect(src.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(src.variants.length).toBeGreaterThanOrEqual(2);
      expect(src.originalBytes).toBeGreaterThan(100_000);
    }
  });

  it("download rows use exact size for originals and labelled estimates for transcodes", () => {
    const src = sourceFor("nosferatu")!;
    const rows = downloadRows(src);
    expect(rows[0]!.sizeBytes).toBe(src.originalBytes);
    expect(rows.some((r) => r.sizeIsEstimate)).toBe(true);
    expect(defaultVariant("nosferatu")).toBeDefined();
    // estimateBytes ≈ bandwidth/8 × duration
    const v = src.variants[1]!;
    expect(estimateBytes(v, src.durationSec)).toBeGreaterThan(100_000);
  });

  it("contains zero Internet Archive references (banned host)", () => {
    const files = [...walk(SRC), ...walk(PUBLIC)].filter(
      (f) => /\.(ts|tsx|mjs|html|css|srt|md)$/.test(f) && !f.includes(".test."),
    );
    for (const f of files) {
      const text = readFileSync(f, "utf8").toLowerCase();
      expect(
        text.includes("archive.org") || text.includes("archive/embed"),
        f,
      ).toBe(false);
    }
  });
});

describe("honest availability + subtitle policy", () => {
  it("never publishes a work without a verified source (availability rule)", () => {
    for (const w of allWorks) {
      if (isFilm(w)) expect(sourceFor(w.sourceId), w.id).toBeDefined();
      else
        w.episodes.forEach((e) =>
          expect(sourceFor(e.sourceId), e.id).toBeDefined(),
        );
    }
  });

  it("ships exactly one real Arabic subtitle track and fakes nothing", () => {
    expect(shippedArabicSubtitles).toBe(1);
    const nos = subtitlesFor("nosferatu");
    expect(nos.find((t) => t.lang === "ar")!.kind).toBe("authored-translation");
    expect(nos.find((t) => t.lang === "ar")!.src).toBe(
      "/subtitles/nosferatu-ar.srt",
    );
    // works without Arabic subs report emptiness — never invented tracks
    for (const s of series)
      for (const e of s.episodes) expect(subtitlesFor(e.id)).toEqual([]);
  });

  it("search + collection integrity stays consistent with the playable catalogue", () => {
    for (const c of collections) {
      c.filmIds.forEach((id) =>
        expect(
          films.some((f) => f.id === id),
          id,
        ).toBe(true),
      );
      (c.seriesIds ?? []).forEach((id) =>
        expect(
          series.some((s) => s.id === id),
          id,
        ).toBe(true),
      );
    }
    expect(searchWorks("نوسفيراتو").length).toBe(1);
    expect(searchWorks("nosferatu").length).toBe(1);
    expect(allWorks.length).toBe(films.length + series.length);
    expect(films.length).toBe(11);
    expect(series.reduce((n, s) => n + s.episodes.length, 0)).toBe(13);
  });
});
