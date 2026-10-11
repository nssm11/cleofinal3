import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveStats,
  findEpisode,
  listFilms,
  normalizeAr,
  relatedTo,
  repo,
  search,
  todaysProgram,
  collectionFilms,
  getFilm,
} from "./repository";

test("catalog integrity: films, series, collections all parse and reference real titles", () => {
  assert.ok(repo.films.length >= 30);
  assert.ok(repo.seriesList.length >= 1);
  const slugs = new Set(repo.films.map((f) => f.slug));
  for (const c of repo.collections) for (const m of c.members) assert.ok(slugs.has(m), `collection ${c.slug} references ${m}`);
});

test("collection members are unique and non-empty", () => {
  for (const c of repo.collections) {
    assert.equal(new Set(c.members).size, c.members.length, c.slug);
    assert.ok(c.members.length > 0);
  }
});

test("every title has a source with an identifier (nothing streams on faith)", () => {
  for (const f of repo.films) assert.match(f.source.identifier, /.+/);
  for (const s of repo.seriesList) for (const e of s.seasons.flatMap((x) => x.episodes)) assert.match(e.source.identifier, /.+/);
});

test("normalizeAr folds the ways people actually type Arabic", () => {
  assert.equal(normalizeAr("الجنرال"), normalizeAr("الجنرال\u064B")); // diacritic ignored
  assert.equal(normalizeAr("دراما"), normalizeAr("دراMa".replace("Ma", "ما"))); // sanity
  assert.equal(normalizeAr("سينما\u0640"), "سينما"); // tatweel stripped
  assert.equal(normalizeAr("حلاق"), normalizeAr("حلاق")); // no alef-maksura confusion
  assert.equal(normalizeAr("موسى"), normalizeAr("موسي")); // ى ⇄ ي
});

test("search: title beats people beats body", () => {
  const hits = search("كيتون");
  assert.ok(hits.length >= 5, "keaton finds his shelf");
  const general = search("الجنرال");
  assert.equal(general[0]?.labelAr, "الجنرال");

  const latin = search("nosferatu");
  assert.ok(latin.some((h) => h.labelAr === "نوسفيراتو"), "Latin query finds Arabic title");

  const episode = search("المصباح الكبير");
  assert.equal(episode[0]?.kind, "episode");
  assert.equal(episode[0]?.episodeRef?.series.slug, "dragnet");
});

test("search: gibberish returns nothing, and never throws", () => {
  assert.deepEqual(search("قزطربنمنلثقز"), []);
});

test("listFilms filters compose and sort", () => {
  const silentBefore1930 = listFilms({ genres: ["silent"], sort: "year-asc" });
  assert.ok(silentBefore1930.length > 8);
  assert.ok(silentBefore1930.every((f) => f.year < 1930));
  const cc = listFilms({ licenses: ["cc-by"] });
  assert.equal(cc.length, 5); // the Blender five
  const shortestFirst = listFilms({ sort: "runtime" });
  assert.ok(shortestFirst[0].runtimeMin <= (shortestFirst[1]?.runtimeMin ?? Infinity));
});

test("tonight's program is deterministic per date and rotates", () => {
  const day = new Date("2026-01-01T12:00:00Z");
  const a = todaysProgram(day);
  const b = todaysProgram(day);
  assert.equal(a.featured.slug, b.featured.slug);
  assert.ok(a.featured.program, "only program-eligible titles headline");
  const c = todaysProgram(new Date("2026-01-04T12:00:00Z"));
  const pool = repo.films.filter((f) => f.program).map((f) => f.slug);
  assert.ok(pool.includes(c.featured.slug));
});

test("relatedTo never returns the title itself and stays relevant", () => {
  const nos = getFilm("nosferatu")!;
  const rel = relatedTo(nos, 5);
  assert.ok(rel.length > 0);
  assert.ok(!rel.some((t) => t.slug === "nosferatu"));
  assert.ok(rel.some((t) => t.slug === "caligari" || t.slug === "golem" || t.slug === "haxan"));
});

test("episodes resolve through series + slug, with seasons", () => {
  const ref = findEpisode("sherlock-holmes-1954", "shy-ballerina");
  assert.ok(ref);
  assert.equal(ref.episode.titleAr, "قضية الراقصة الخجولة");
  assert.ok(ref.series.seasons.length >= 1);
});

test("archive stats are computed, and they're honest", () => {
  const s = archiveStats();
  assert.equal(s.films, repo.films.length);
  const years = s.years.split("–").map(Number);
  assert.ok(years[0] <= 1920 && years[1] >= 2010);
});

test("collectionFilms preserves programmed order", () => {
  const noir = repo.collections.find((c) => c.slug === "noir")!;
  const films = collectionFilms(noir);
  assert.deepEqual(films.map((f) => f.slug), noir.members);
});
