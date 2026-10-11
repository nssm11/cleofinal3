import type { SourceVariant, VerifiedSource } from "../../data/sources";
import { sourceFor, estimateBytes } from "../../data/sources";

/** Human file-size label for download rows. */
export const bytesLabel = (b: number): string => {
  if (b >= 1_000_000_000) return `${(b / 1_000_000_000).toFixed(2)} غ.ب`;
  if (b >= 1_000_000) return `${Math.round(b / 1_000_000)} م.ب`;
  return `${Math.round(b / 1_000)} ك.ب`;
};

export interface DownloadRow {
  label: string;
  url: string;
  mime: string;
  sizeBytes: number;
  sizeIsEstimate: boolean;
  width: number;
  height: number;
}

/**
 * Download rows for a source. The master file's size is exact (provider API);
 * transcode sizes are honest estimates from bandwidth × duration.
 * Downloads are the provider's own file URLs — permitted by the licence.
 */
export function downloadRows(source: VerifiedSource): DownloadRow[] {
  return source.variants.map((v: SourceVariant) => {
    const isOriginal = v.transcodeKey === "original";
    return {
      label: `${v.label} · ${v.width}×${v.height}`,
      url: v.url,
      mime: v.mime,
      sizeBytes: isOriginal
        ? source.originalBytes
        : estimateBytes(v, source.durationSec),
      sizeIsEstimate: !isOriginal,
      width: v.width,
      height: v.height,
    };
  });
}

/** Playable variants sorted best-first with honest quality labels. */
export const playableVariants = (sourceId: string): SourceVariant[] =>
  sourceFor(sourceId)?.variants ?? [];

/** Best variant that most likely plays everywhere (vp9 webm first). */
export function defaultVariant(sourceId: string): SourceVariant | undefined {
  const vs = playableVariants(sourceId);
  return (
    vs.find(
      (v) => v.transcodeKey.includes("1080") || v.transcodeKey.includes("480"),
    ) ?? vs[0]
  );
}
