/**
 * Playback resolution — the network boundary of the player.
 *
 * The archive stores only each Internet Archive item identifier (+ a verified
 * file hint for the marquee titles). In the browser we fetch the item's
 * metadata JSON, pick the H.264 MP4 derivatives, and let the viewer choose a
 * quality. If the metadata API is unreachable (offline, strict network,
 * regional block), the player falls back to the Archive's own embed — a
 * degraded but honest mode, clearly labeled — and finally to a link to the
 * source item. Nothing is ever played from an unauthorized copy.
 */

export interface ArchiveSource {
  /** Full, streamable URL to an .mp4 file. */
  url: string;
  /** Human label for the quality menu ("HD 1080", "720", "SD"). */
  label: string;
  height: number;
  bytes?: number;
  /** True for the *fileHint* fast path we know at build time. */
  preset?: boolean;
}

export interface SubtitleSource {
  url: string;
  format: "vtt" | "srt";
  lang: string;
}

interface RawFile {
  name: string;
  source?: string;
  format?: string;
  height?: string | number;
  size?: string;
}

interface RawMetadata {
  files?: RawFile[];
}

export function downloadUrl(identifier: string, file: string): string {
  const path = file
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${path}`;
}

function qualityLabel(height: number): string {
  if (height >= 900) return "1080p";
  if (height >= 600) return "720p";
  if (height >= 400) return "480p";
  return "SD";
}

/**
 * Pure picker — fed metadata JSON, returns playable MP4 sources (best last
 * for ascending order) plus any English subtitles. Unit-tested; no DOM.
 */
export function pickSources(
  meta: RawMetadata,
  identifier: string,
): { sources: ArchiveSource[]; subtitles: SubtitleSource[] } {
  const files = meta.files ?? [];
  const all = files.filter((f) => f.name.toLowerCase().endsWith(".mp4"));
  const derivatives = all.filter((f) => (f.source ?? "") === "derivative");
  const chosen = (derivatives.length ? derivatives : all).slice();
  const sources = chosen
    .map((f) => {
      const height = Number(f.height ?? 0) || 0;
      return {
        url: downloadUrl(identifier, f.name),
        label: qualityLabel(height || 480),
        height: height || 480,
        bytes: f.size ? Number(f.size) * 1000000 : undefined,
      };
    })
    .sort((a, b) => a.height - b.height);
  const subtitles: SubtitleSource[] = files
    .filter((f) => /\.(vtt|srt)$/i.test(f.name) && !/[\u0600-\u06FF]/.test(f.name))
    .slice(0, 4)
    .map((f) => ({
      url: downloadUrl(identifier, f.name),
      format: /\.srt$/i.test(f.name) ? ("srt" as const) : ("vtt" as const),
      lang: "en",
    }));
  return { sources, subtitles };
}

export function presetSource(identifier: string, fileHint: string): ArchiveSource {
  return { url: downloadUrl(identifier, fileHint), label: "المجهّز", height: 0, preset: true };
}

export async function fetchSources(identifier: string, signal?: AbortSignal): Promise<{ sources: ArchiveSource[]; subtitles: SubtitleSource[] }> {
  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, { signal });
  if (!res.ok) throw new Error(`metadata ${res.status}`);
  const json = (await res.json()) as RawMetadata;
  const out = pickSources(json, identifier);
  if (out.sources.length === 0) throw new Error("no playable mp4");
  return out;
}

/** SRT → VTT with an in-memory blob (browsers won't eat raw SRT). */
export async function toVttBlobUrl(srtUrl: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(srtUrl, { signal });
  if (!res.ok) throw new Error("subtitle fetch failed");
  const srt = await res.text();
  const vtt =
    "WEBVTT\n\n" +
    srt
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}:\d{2}[,.]\d{3}/g, (m) => m.replace(",", "."));
  return URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
}
