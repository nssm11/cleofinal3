/**
 * Wikimedia Commons media provider — the only video host used by this app.
 * Runs client-side (the live verification layer must see what the visitor's
 * browser sees). Also used by scripts/sync-catalog.mjs for catalogue refresh.
 *
 * Docs: https://www.mediawiki.org/wiki/API:Videoinfo (derivatives)
 */

export interface CommonsDerivative {
  transcodekey: string;
  src: string;
  type: string;
  width: number;
  height: number;
  bandwidth: number;
}

export interface CommonsVideoInfo {
  title: string;
  url: string;
  descriptionurl: string;
  descriptionshorturl: string;
  size: number;
  width: number;
  height: number;
  mime: string;
  duration: number;
  derivatives: CommonsDerivative[];
  licenseShortName?: string;
  artistHtml?: string;
}

export interface CommonsSearchHit {
  title: string;
  pageid: number;
  snippetHtml: string;
}

const API = "https://commons.wikimedia.org/w/api.php";

async function api(params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams({
    format: "json",
    formatversion: "2",
    origin: "*",
    ...params,
  });
  const res = await fetch(`${API}?${qs.toString()}`);
  if (!res.ok) throw new Error(`Commons API: HTTP ${res.status}`);
  return res.json();
}

/** Live videoinfo for one File: title — includes the full transcode ladder. */
export async function fetchVideoInfo(
  fileTitle: string,
): Promise<CommonsVideoInfo | undefined> {
  const json = (await api({
    action: "query",
    titles: fileTitle,
    prop: "videoinfo",
    viprop: "url|size|mime|derivatives|extmetadata",
  })) as {
    query?: {
      pages?: Array<{
        title: string;
        videoinfo?: Array<{
          url: string;
          descriptionurl: string;
          descriptionshorturl: string;
          size: number;
          width: number;
          height: number;
          mime: string;
          duration: number;
          derivatives?: CommonsDerivative[];
          extmetadata?: Record<string, { value: string }>;
        }>;
      }>;
    };
  };
  const info = json.query?.pages?.[0]?.videoinfo?.[0];
  if (!info) return undefined;
  return {
    title: json.query?.pages?.[0]?.title ?? fileTitle,
    url: info.url,
    descriptionurl: info.descriptionurl,
    descriptionshorturl: info.descriptionshorturl,
    size: info.size,
    width: info.width,
    height: info.height,
    mime: info.mime,
    duration: info.duration,
    derivatives: info.derivatives ?? [],
    licenseShortName: info.extmetadata?.LicenseShortName?.value,
    artistHtml: info.extmetadata?.Artist?.value,
  };
}

/** CirrusSearch over File: namespace (single-term queries; OR-queries unsupported). */
export async function searchVideos(
  term: string,
  limit = 20,
): Promise<CommonsSearchHit[]> {
  const json = (await api({
    action: "query",
    list: "search",
    srsearch: term,
    srnamespace: "6",
    srlimit: String(limit),
  })) as {
    query?: {
      search?: Array<{ title: string; pageid: number; snippet: string }>;
    };
  };
  return (json.query?.search ?? []).map((s) => ({
    title: s.title,
    pageid: s.pageid,
    snippetHtml: s.snippet,
  }));
}

/** Evidence page URL for a File: title. */
export const filePage = (fileTitle: string): string =>
  `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle.replace(/ /g, "_"))}`;
