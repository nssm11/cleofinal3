import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseSrt, srtToVtt, toSrt, parseTimeToMs, formatSrtTime } from "./srt";

const AR_SRT = path.resolve(
  __dirname,
  "../../../public/subtitles/nosferatu-ar.srt",
);

describe("SRT parser + VTT conversion", () => {
  it("parses the real Arabic Nosferatu track: 240 cues, monotonic timings", () => {
    const raw = readFileSync(AR_SRT, "utf8");
    const cues = parseSrt(raw);
    expect(cues.length).toBe(240);
    for (let i = 1; i < cues.length; i += 1) {
      expect(cues[i]!.startMs).toBeGreaterThanOrEqual(cues[i - 1]!.startMs);
      expect(cues[i]!.endMs).toBeGreaterThanOrEqual(cues[i]!.startMs);
    }
    // first/last timings match the licensed provider track exactly
    expect(cues[0]!.startMs).toBe(0);
    expect(cues[0]!.endMs).toBe(parseTimeToMs("00:00:05,505"));
    expect(cues[239]!.text).toContain("النهاية");
  });

  it("keeps Arabic text intact and never strips line breaks", () => {
    const cues = parseSrt(readFileSync(AR_SRT, "utf8"));
    const multi = cues.find((c) => c.text.includes("\n"));
    expect(multi).toBeDefined();
    expect(multi!.text.split("\n").length).toBeGreaterThanOrEqual(2);
  });

  it("converts to WebVTT with identical cue count and times", () => {
    const raw = readFileSync(AR_SRT, "utf8");
    const cues = parseSrt(raw);
    const vtt = srtToVtt(raw, { rtl: true });
    expect(vtt.startsWith("WEBVTT")).toBe(true);
    expect(vtt).toContain("NOTE");
    const bodies = vtt.split("\n\n").filter((b) => b.includes("-->"));
    expect(bodies.length).toBe(cues.length);
    expect(vtt).toContain("00:00:05.505"); // comma → dot
  });

  it("round-trips SRT serialization", () => {
    const cues = parseSrt(readFileSync(AR_SRT, "utf8"));
    const again = parseSrt(toSrt(cues));
    expect(again.length).toBe(cues.length);
    expect(again[10]!.startMs).toBe(cues[10]!.startMs);
    expect(again[10]!.text).toBe(cues[10]!.text);
  });

  it("formats times as strict SRT", () => {
    expect(formatSrtTime(3_723_456)).toBe("01:02:03,456");
  });
});
