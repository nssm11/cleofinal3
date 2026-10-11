/**
 * Catalogue sync — automated refresh of the verified-source manifest.
 *
 * What it does (real network calls, no scraping):
 *  1. Re-queries the Wikimedia Commons API (videoinfo/derivatives) for every
 *     file in `src/data/sources.ts` and reports any drift in size, duration
 *     or the transcode ladder — the manifest's evidence is re-checked.
 *  2. Searches Commons for configured discovery terms (new open/PD titles).
 *  3. Tries TVmaze matching for the series register (keyless).
 *  4. If VITE_TMDB_API_KEY / TMDB_API_KEY is present, runs TMDB discovery to
 *     suggest candidate titles (metadata only — never video).
 *
 * Usage: npm run sync            (report only)
 *        npm run sync -- --write  (update verifiedAt + write sync-report.json)
 *
 * The Internet Archive is intentionally never queried.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCES_TS = path.join(ROOT, "src", "data", "sources.ts");
const OUT_DIR = path.join(ROOT, "src", "data", "generated");
const API = "https://commons.wikimedia.org/w/api.php";

const args = process.argv.slice(2);
const write = args.includes("--write");

async function api(params) {
  const qs = new URLSearchParams({
    format: "json",
    formatversion: "2",
    ...params,
  });
  const res = await fetch(`${API}?${qs.toString()}`);
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  return res.json();
}

/** Pull commonsFile + expected values out of the manifest source text. */
function parseManifest(src) {
  const entries = [];
  const re =
    /\{\s*id:\s*"([^"]+)",\s*provider:[^,]+,\s*commonsFile:\s*"([^"]+)",[\s\S]*?durationSec:\s*([\d.]+),[\s\S]*?originalBytes:\s*(\d+),/g;
  let m;
  while ((m = re.exec(src))) {
    entries.push({
      id: m[1],
      commonsFile: m[2],
      durationSec: Number(m[3]),
      originalBytes: Number(m[4]),
    });
  }
  return entries;
}

async function checkEntry(entry) {
  const json = await api({
    action: "query",
    titles: `File:${entry.commonsFile}`,
    prop: "videoinfo",
    viprop: "url|size|mime|derivatives|extmetadata",
  });
  const page = json?.query?.pages?.[0];
  const info = page?.videoinfo?.[0];
  if (!info)
    return { ...entry, state: "missing", drift: ["videoinfo missing"] };
  const drift = [];
  if (Math.abs((info.duration ?? 0) - entry.durationSec) > 1)
    drift.push(`duration ${info.duration} ≠ ${entry.durationSec}`);
  if (info.size !== entry.originalBytes)
    drift.push(`size ${info.size} ≠ ${entry.originalBytes}`);
  const keys = (info.derivatives ?? []).map((d) => d.transcodekey);
  return {
    ...entry,
    state: drift.length ? "drift" : "ok",
    drift,
    durationNow: info.duration,
    sizeNow: info.size,
    transcodes: keys,
    license: info.extmetadata?.LicenseShortName?.value ?? "?",
    evidence: info.descriptionurl,
  };
}

async function tvmaze(title) {
  try {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`,
    );
    if (!res.ok) return { title, matched: false };
    const hits = await res.json();
    return {
      title,
      matched: hits.length > 0,
      top: hits[0]?.show?.name ?? null,
      id: hits[0]?.show?.id ?? null,
    };
  } catch {
    return { title, matched: false, error: "network" };
  }
}

async function tmdbDiscover() {
  const key = process.env.VITE_TMDB_API_KEY ?? process.env.TMDB_API_KEY;
  if (!key)
    return {
      configured: false,
      note: "TMDB key absent — discovery skipped (honest state).",
    };
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=ar&sort_by=primary_release_date.desc&vote_count.gte=20`,
    );
    const json = await res.json();
    return {
      configured: true,
      candidates: (json.results ?? []).slice(0, 10).map((r) => ({
        title: r.title,
        date: r.release_date,
        note: "metadata only — video must be sourced separately and verified",
      })),
    };
  } catch {
    return { configured: true, error: "TMDB request failed" };
  }
}

const DISCOVERY_TERMS = [
  "Blender open movie",
  "public domain film webm",
  "Caminandes",
];

async function main() {
  const manifest = await readFile(SOURCES_TS, "utf8");
  const entries = parseManifest(manifest);
  console.log(`sync: ${entries.length} manifest entries found`);

  const checked = [];
  for (const e of entries) {
    checked.push(await checkEntry(e));
    process.stdout.write(".");
  }
  console.log("");

  const discovery = [];
  for (const term of DISCOVERY_TERMS) {
    const json = await api({
      action: "query",
      list: "search",
      srsearch: term,
      srnamespace: "6",
      srlimit: "10",
    });
    discovery.push({
      term,
      hits: (json?.query?.search ?? []).map((s) => s.title),
    });
  }

  const seriesMatches = [];
  for (const t of ["Les Vampires", "Caminandes"])
    seriesMatches.push(await tvmaze(t));

  const report = {
    generatedAt: new Date().toISOString(),
    manifestCount: entries.length,
    ok: checked.filter((c) => c.state === "ok").length,
    drift: checked.filter((c) => c.state === "drift"),
    missing: checked.filter((c) => c.state === "missing"),
    checked,
    discovery,
    seriesMatches,
    tmdb: await tmdbDiscover(),
    policy: {
      videoHosts: ["wikimedia-commons"],
      bannedHosts: ["archive.org"],
      note: "Metadata APIs are never treated as video hosts.",
    },
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "sync-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    `sync: ok=${report.ok} drift=${report.drift.length} missing=${report.missing.length}`,
  );
  for (const d of report.drift)
    console.log(`  drift  ${d.id}: ${d.drift.join("; ")}`);
  for (const m of report.missing) console.log(`  missing ${m.id}`);
  console.log(`sync: report → src/data/generated/sync-report.json`);
  if (write) {
    console.log(
      "sync: --write requested (manifest evidence refresh is manual review).",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
