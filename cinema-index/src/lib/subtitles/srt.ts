/**
 * SRT parsing + VTT conversion (zero-dependency).
 * SRT is the interchange format we ship; VTT is what <track> consumes.
 */

export interface SrtCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string; // may contain \n for multi-line
}

const TIME_RE = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;

export function parseTimeToMs(raw: string): number {
  const m = TIME_RE.exec(raw.trim());
  if (!m) throw new Error(`توقيت غير صالح: ${raw}`);
  const [, h, mi, s, ms] = m;
  return (
    Number(h) * 3_600_000 +
    Number(mi) * 60_000 +
    Number(s) * 1_000 +
    Number(ms.padEnd(3, "0"))
  );
}

export function formatSrtTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const rem = Math.floor(ms % 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(rem).padStart(3, "0")}`;
}

export function formatVttTime(ms: number): string {
  return formatSrtTime(ms).replace(",", ".");
}

/** Parse .srt text into cues. Tolerant of \r\n and blank-line variations. */
export function parseSrt(content: string): SrtCue[] {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/^\uFEFF/, "")
    .trim();
  const blocks = normalized.split(/\n{2,}/);
  const cues: SrtCue[] = [];
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .filter((l, i, arr) => !(l === "" && i === arr.length - 1));
    if (lines.length < 2) continue;
    let cursor = 0;
    let index = cues.length + 1;
    if (/^\d+$/.test(lines[0]?.trim() ?? "")) {
      index = Number(lines[0]?.trim());
      cursor = 1;
    }
    const timeLine = lines[cursor] ?? "";
    const parts = timeLine.split("-->");
    if (parts.length !== 2) continue;
    const startMs = parseTimeToMs(parts[0] ?? "");
    const endMs = parseTimeToMs(parts[1] ?? "");
    const text = lines
      .slice(cursor + 1)
      .join("\n")
      .trim();
    if (!text) continue;
    cues.push({ index, startMs, endMs, text });
  }
  return cues;
}

/** Serialize cues back to SRT (round-trippable). */
export function toSrt(cues: SrtCue[]): string {
  return (
    cues
      .map(
        (c) =>
          `${c.index}\n${formatSrtTime(c.startMs)} --> ${formatSrtTime(c.endMs)}\n${c.text}\n`,
      )
      .join("\n") + "\n"
  );
}

/** Convert cues to WebVTT text — the format browsers consume in <track>. */
export function srtToVtt(
  content: string,
  { rtl = true }: { rtl?: boolean } = {},
): string {
  const cues = parseSrt(content);
  const header = `WEBVTT${rtl ? "\n\nNOTE\nRTL Arabic track" : ""}\n\n`;
  const body = cues
    .map((c) => {
      const text = rtl
        ? c.text.replace(/^(.*)$/gm, (line) => (line.trim() ? line : line))
        : c.text;
      return `${formatVttTime(c.startMs)} --> ${formatVttTime(c.endMs)}\n${text}\n`;
    })
    .join("\n");
  return header + body;
}

/** Build a Blob URL VTT track from SRT text (for <track src>). */
export function srtObjectUrl(content: string, rtl = true): string {
  return URL.createObjectURL(
    new Blob([srtToVtt(content, { rtl })], { type: "text/vtt" }),
  );
}
