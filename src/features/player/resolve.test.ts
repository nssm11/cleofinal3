import test from "node:test";
import assert from "node:assert/strict";
import { downloadUrl, pickSources, presetSource } from "./resolve";

test("downloadUrl encodes nested file paths segment-wise", () => {
  assert.equal(
    downloadUrl("Item_1", "Content/dir/file name.mp4"),
    "https://archive.org/download/Item_1/Content/dir/file%20name.mp4",
  );
});

test("pickSources prefers mp4 derivatives, ascending height", () => {
  const meta = {
    files: [
      { name: "movie_512kb.mp4", source: "derivative", height: "360" },
      { name: "movie_720p.mp4", source: "derivative", height: "720" },
      { name: "movie.mkv", source: "original" },
      { name: "movie.mpg" },
      { name: "movie_archive.torrent" },
      { name: "movie.srt", format: "SubRip" },
    ],
  };
  const { sources, subtitles } = pickSources(meta as never, "movie");
  assert.deepEqual(sources.map((s) => s.label), ["SD", "720p"]);
  assert.equal(sources[1].url, "https://archive.org/download/movie/movie_720p.mp4");
  assert.equal(subtitles.length, 1);
  assert.equal(subtitles[0].format, "srt");
});

test("pickSources falls back to originals when no derivative mp4 exists", () => {
  const meta = { files: [{ name: "only.mp4" }, { name: "clip.ogv" }] };
  const { sources } = pickSources(meta as never, "only");
  assert.equal(sources.length, 1);
  assert.equal(sources[0].height, 480); // unknown → conservative SD assumption
});

test("pickSources ignores Arabic-titled subtitle files (out of scope) but keeps vtt", () => {
  const meta = {
    files: [
      { name: "a.mp4", source: "derivative", height: "480" },
      { name: "ترجمة.vtt" },
      { name: "caps.vtt" },
    ],
  };
  const { subtitles } = pickSources(meta as never, "a");
  assert.deepEqual(subtitles.map((s) => s.url.split("/").pop()), ["caps.vtt"]);
});

test("presetSource marks build-time hints so the UI can say so", () => {
  const p = presetSource("x", "x.mp4");
  assert.equal(p.preset, true);
  assert.ok(p.url.includes("/x/x.mp4"));
});
