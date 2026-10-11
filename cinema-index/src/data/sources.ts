/**
 * VERIFIED SOURCE MANIFEST — the availability layer of the catalogue.
 *
 * Every entry below corresponds to a real file on Wikimedia Commons that was
 * verified through the Commons videoinfo API during production (2026-10-11):
 * original URL, transcode ladder, byte size, duration, resolution and licence.
 * Evidence page: `evidence` (the provider's own file page).
 *
 * Policy:
 * - Internet Archive is NOT used anywhere (explicit product requirement).
 * - A work enters the catalogue only when at least one playable file exists.
 * - No placeholder, mock or invented URLs. `npm test` enforces this.
 * - Upload URLs are stable Commons originals/transcodes (CC or public domain).
 *
 * Re-verification: `src/lib/media/verify.ts` probes these live in the browser
 * (Commons API + Range requests) and caches results; `scripts/sync-catalog.mjs`
 * re-pulls the same API data when run in a network-enabled environment.
 */

export interface SourceVariant {
  /** Quality label shown in the player/download UI, e.g. "1080p". */
  label: string;
  url: string;
  width: number;
  height: number;
  /** bits per second (from the provider API) — used for size estimates. */
  bandwidth: number;
  mime: string;
  /** Provider-declared transcode key; "original" for the master file. */
  transcodeKey: string;
}

export interface VerifiedSource {
  id: string;
  provider: "wikimedia-commons";
  /** Commons file title, e.g. "Nosferatu (1922).webm". */
  commonsFile: string;
  evidence: string;
  license: string;
  licenseUrl: string;
  attribution?: string;
  durationSec: number;
  /** Master file (also the highest-quality download). */
  originalUrl: string;
  originalBytes: number;
  variants: SourceVariant[];
  /** When this evidence was collected (ISO date). */
  verifiedAt: string;
}

const WM = "https://upload.wikimedia.org/wikipedia/commons";
const CC_PD = {
  license: "Public domain",
  licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
};
const CC_BY_3 = {
  license: "CC BY 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  attribution: "Blender Foundation / blender.org",
};
const CC_BY_SA_3 = {
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  attribution: "Blender Foundation / caminandes.com",
};
const CC_BY_25 = {
  license: "CC BY 2.5",
  licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
  attribution: "Blender Foundation / Netherlands Media Art Institute",
};

/** Build the deterministic Commons transcode URL for a verified file. */
export const transcodeUrl = (hash: string, file: string, key: string): string =>
  `${WM}/transcoded/${hash}/${file}/${file}.${key}`;

const V = (
  label: string,
  hash: string,
  file: string,
  key: string | null,
  width: number,
  height: number,
  bandwidth: number,
  mime: string,
  originalUrl: string,
): SourceVariant => ({
  label,
  url: key === null ? originalUrl : transcodeUrl(hash, file, key),
  width,
  height,
  bandwidth,
  mime,
  transcodeKey: key ?? "original",
});

/**
 * Standard ladder helper: Commons provides 240p/360p/480p/1080p vp9 transcodes
 * for every file tall enough. Only variants observed in the API are listed.
 */
function ladder(
  hash: string,
  file: string,
  originalUrl: string,
  origW: number,
  origH: number,
  origBps: number,
  origMime: string,
  steps: Array<[string, number, number, number, string]>,
): SourceVariant[] {
  const out: SourceVariant[] = [
    V(
      `${origH >= 2160 ? "4K" : origH >= 1080 ? "1080p" : `${origH}p`} (أصلي)`,
      hash,
      file,
      null,
      origW,
      origH,
      origBps,
      origMime,
      originalUrl,
    ),
  ];
  for (const [key, w, h, bps, mime] of steps) {
    const label = key.startsWith("240")
      ? "240p"
      : key.startsWith("360")
        ? "360p"
        : key.startsWith("480")
          ? "480p"
          : "1080p";
    out.push(V(label, hash, file, key, w, h, bps, mime, originalUrl));
  }
  // playable order: highest first
  return out.sort((a, b) => b.height - a.height);
}

const verifiedAt = "2026-10-11";
const evidence = (file: string) =>
  `https://commons.wikimedia.org/wiki/File:${file}`;

export const verifiedSources: Record<string, VerifiedSource> = {
  /* ============ FEATURE FILMS ============ */
  nosferatu: {
    id: "nosferatu",
    provider: "wikimedia-commons",
    commonsFile: "Nosferatu (1922).webm",
    evidence: evidence("Nosferatu_(1922).webm"),
    ...CC_PD,
    durationSec: 5518.7,
    originalUrl: `${WM}/7/78/Nosferatu_%281922%29.webm`,
    originalBytes: 5027286483,
    verifiedAt,
    variants: ladder(
      "7/78",
      "Nosferatu_%281922%29.webm",
      `${WM}/7/78/Nosferatu_%281922%29.webm`,
      1440,
      1080,
      7287592,
      "video/webm",
      [
        ["1080p.vp9.webm", 1440, 1080, 3166296, "video/webm"],
        ["480p.vp9.webm", 640, 480, 634928, "video/webm"],
        ["240p.vp9.webm", 320, 240, 175528, "video/webm"],
      ],
    ),
  },
  "battleship-potemkin": {
    id: "battleship-potemkin",
    provider: "wikimedia-commons",
    commonsFile: "Battleship Potemkin (1925) by Sergei Eisenstein.webm",
    evidence: evidence("Battleship_Potemkin_(1925)_by_Sergei_Eisenstein.webm"),
    ...CC_PD,
    durationSec: 4267.3,
    originalUrl: `${WM}/7/74/Battleship_Potemkin_%281925%29_by_Sergei_Eisenstein.webm`,
    originalBytes: 1756606590,
    verifiedAt,
    variants: ladder(
      "7/74",
      "Battleship_Potemkin_%281925%29_by_Sergei_Eisenstein.webm",
      `${WM}/7/74/Battleship_Potemkin_%281925%29_by_Sergei_Eisenstein.webm`,
      1920,
      1080,
      3293137,
      "video/webm",
      [
        ["1080p.vp9.webm", 1920, 1080, 4202648, "video/webm"],
        ["480p.vp9.webm", 854, 480, 1132120, "video/webm"],
        ["240p.vp9.webm", 426, 240, 360936, "video/webm"],
      ],
    ),
  },
  "das-cabinet-des-dr-caligari": {
    id: "das-cabinet-des-dr-caligari",
    provider: "wikimedia-commons",
    commonsFile: "The Cabinet of Dr. Caligari (1920).webm",
    evidence: evidence("The_Cabinet_of_Dr._Caligari_(1920).webm"),
    ...CC_PD,
    durationSec: 4526.9,
    originalUrl: `${WM}/8/88/The_Cabinet_of_Dr._Caligari_%281920%29.webm`,
    originalBytes: 3895920240,
    verifiedAt,
    variants: ladder(
      "8/88",
      "The_Cabinet_of_Dr._Caligari_%281920%29.webm",
      `${WM}/8/88/The_Cabinet_of_Dr._Caligari_%281920%29.webm`,
      1440,
      1080,
      6884866,
      "video/webm",
      [
        ["1080p.vp9.webm", 1440, 1080, 3166296, "video/webm"],
        ["480p.vp9.webm", 640, 480, 598208, "video/webm"],
        ["240p.vp9.webm", 320, 240, 111544, "video/webm"],
      ],
    ),
  },
  "man-with-a-movie-camera": {
    id: "man-with-a-movie-camera",
    provider: "wikimedia-commons",
    commonsFile: "Man with a Movie Camera (1929) by Dziga Vertov.webm",
    evidence: evidence("Man_with_a_Movie_Camera_(1929)_by_Dziga_Vertov.webm"),
    ...CC_PD,
    durationSec: 4000.5,
    originalUrl: `${WM}/e/e6/Man_with_a_Movie_Camera_%281929%29_by_Dziga_Vertov.webm`,
    originalBytes: 5150565970,
    verifiedAt,
    variants: ladder(
      "e/e6",
      "Man_with_a_Movie_Camera_%281929%29_by_Dziga_Vertov.webm",
      `${WM}/e/e6/Man_with_a_Movie_Camera_%281929%29_by_Dziga_Vertov.webm`,
      1440,
      1080,
      10299738,
      "video/webm",
      [
        ["1080p.vp9.webm", 1440, 1080, 3156880, "video/webm"],
        ["480p.vp9.webm", 640, 480, 796184, "video/webm"],
        ["240p.vp9.webm", 320, 240, 245800, "video/webm"],
      ],
    ),
  },
  "nanook-of-the-north": {
    id: "nanook-of-the-north",
    provider: "wikimedia-commons",
    commonsFile: "Nanook of the North (1922) by Robert J. Flaherty HD.webm",
    evidence: evidence(
      "Nanook_of_the_North_(1922)_by_Robert_J._Flaherty_HD.webm",
    ),
    ...CC_PD,
    durationSec: 4683.2,
    originalUrl: `${WM}/a/a2/Nanook_of_the_North_%281922%29_by_Robert_J._Flaherty_HD.webm`,
    originalBytes: 2120339028,
    verifiedAt,
    variants: ladder(
      "a/a2",
      "Nanook_of_the_North_%281922%29_by_Robert_J._Flaherty_HD.webm",
      `${WM}/a/a2/Nanook_of_the_North_%281922%29_by_Robert_J._Flaherty_HD.webm`,
      1920,
      1440,
      3622060,
      "video/webm",
      [
        ["480p.vp9.webm", 640, 480, 704608, "video/webm"],
        ["240p.vp9.webm", 320, 240, 195440, "video/webm"],
      ],
    ),
  },
  "le-voyage-dans-la-lune": {
    id: "le-voyage-dans-la-lune",
    provider: "wikimedia-commons",
    commonsFile: "Le Voyage dans la Lune (1902).webm",
    evidence: evidence("Le_Voyage_dans_la_Lune_(1902).webm"),
    ...CC_PD,
    durationSec: 766,
    originalUrl: `${WM}/6/6d/Le_Voyage_dans_la_Lune_%281902%29.webm`,
    originalBytes: 2294373601,
    verifiedAt,
    variants: ladder(
      "6/6d",
      "Le_Voyage_dans_la_Lune_%281902%29.webm",
      `${WM}/6/6d/Le_Voyage_dans_la_Lune_%281902%29.webm`,
      1440,
      1080,
      23960812,
      "video/webm",
      [
        ["1080p.vp9.webm", 1440, 1080, 3178824, "video/webm"],
        ["480p.vp9.webm", 640, 480, 801528, "video/webm"],
        ["240p.vp9.webm", 320, 240, 247472, "video/webm"],
      ],
    ),
  },
  "stamp-day-for-superman": {
    id: "stamp-day-for-superman",
    provider: "wikimedia-commons",
    commonsFile: "Stamp Day For Superman.webm",
    evidence: evidence("Stamp_Day_For_Superman.webm"),
    ...CC_PD,
    durationSec: 1052.5,
    originalUrl: `${WM}/f/fd/Stamp_Day_For_Superman.webm`,
    originalBytes: 182480215,
    verifiedAt,
    variants: ladder(
      "f/fd",
      "Stamp_Day_For_Superman.webm",
      `${WM}/f/fd/Stamp_Day_For_Superman.webm`,
      640,
      480,
      1387033,
      "video/webm",
      [
        ["480p.vp9.webm", 640, 480, 887144, "video/webm"],
        ["240p.vp9.webm", 320, 240, 328824, "video/webm"],
      ],
    ),
  },

  /* ============ OPEN MOVIES (modern, CC) ============ */
  sintel: {
    id: "sintel",
    provider: "wikimedia-commons",
    commonsFile: "Sintel movie - Blender Fondation.ogv",
    evidence: evidence("Sintel_movie_-_Blender_Fondation.ogv"),
    ...CC_BY_3,
    durationSec: 888,
    originalUrl: `${WM}/7/79/Sintel_movie_-_Blender_Fondation.ogv`,
    originalBytes: 237796024,
    verifiedAt,
    variants: ladder(
      "7/79",
      "Sintel_movie_-_Blender_Fondation.ogv",
      `${WM}/7/79/Sintel_movie_-_Blender_Fondation.ogv`,
      2047,
      872,
      2142175,
      "video/ogg",
      [
        ["1080p.vp9.webm", 1920, 818, 2655240, "video/webm"],
        ["480p.vp9.webm", 854, 364, 739856, "video/webm"],
        ["240p.vp9.webm", 426, 182, 289208, "video/webm"],
      ],
    ),
  },
  "big-buck-bunny": {
    id: "big-buck-bunny",
    provider: "wikimedia-commons",
    commonsFile: "Big Buck Bunny 4K.webm",
    evidence: evidence("Big_Buck_Bunny_4K.webm"),
    ...CC_BY_SA_3,
    durationSec: 634.6,
    originalUrl: `${WM}/c/c0/Big_Buck_Bunny_4K.webm`,
    originalBytes: 2964839055,
    verifiedAt,
    variants: ladder(
      "c/c0",
      "Big_Buck_Bunny_4K.webm",
      `${WM}/c/c0/Big_Buck_Bunny_4K.webm`,
      4000,
      2250,
      37378615,
      "video/webm",
      [
        ["1080p.vp9.webm", 1920, 1080, 3788064, "video/webm"],
        ["480p.vp9.webm", 854, 480, 1218440, "video/webm"],
        ["240p.vp9.webm", 426, 240, 383864, "video/webm"],
      ],
    ),
  },
  "elephants-dream": {
    id: "elephants-dream",
    provider: "wikimedia-commons",
    commonsFile: "Elephants Dream (2006).webm",
    evidence: evidence("Elephants_Dream_(2006).webm"),
    ...CC_BY_25,
    durationSec: 658.1,
    originalUrl: `${WM}/a/a2/Elephants_Dream_%282006%29.webm`,
    originalBytes: 840078359,
    verifiedAt,
    variants: ladder(
      "a/a2",
      "Elephants_Dream_%282006%29.webm",
      `${WM}/a/a2/Elephants_Dream_%282006%29.webm`,
      1920,
      1080,
      10212352,
      "video/webm",
      [
        ["1080p.vp9.webm", 1920, 1080, 2653944, "video/webm"],
        ["480p.vp9.webm", 854, 480, 706488, "video/webm"],
        ["240p.vp9.webm", 426, 240, 275240, "video/webm"],
      ],
    ),
  },
  "tears-of-steel": {
    id: "tears-of-steel",
    provider: "wikimedia-commons",
    commonsFile:
      "Tears of Steel in 4k - Official Blender Foundation release.webm",
    evidence: evidence(
      "Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm",
    ),
    ...CC_BY_3,
    durationSec: 734.1,
    originalUrl: `${WM}/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm`,
    originalBytes: 958806974,
    verifiedAt,
    variants: ladder(
      "1/10",
      "Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm",
      `${WM}/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm`,
      3840,
      1714,
      10449429,
      "video/webm",
      [
        ["1080p.vp9.webm", 1920, 858, 3380168, "video/webm"],
        ["480p.vp9.webm", 854, 382, 996288, "video/webm"],
        ["240p.vp9.webm", 426, 190, 358312, "video/webm"],
      ],
    ),
  },

  /* ============ SERIES EPISODES ============ */
  "les-vampires-e1": {
    id: "les-vampires-e1",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - La tête coupée (1915).webm",
    evidence: evidence("Les_Vampires_-_La_t%C3%AAte_coup%C3%A9e_(1915).webm"),
    ...CC_PD,
    durationSec: 1863.8,
    originalUrl: `${WM}/1/14/Les_Vampires_-_La_t%C3%AAte_coup%C3%A9e_%281915%29.webm`,
    originalBytes: 107971508,
    verifiedAt,
    variants: ladder(
      "1/14",
      "Les_Vampires_-_La_t%C3%AAte_coup%C3%A9e_%281915%29.webm",
      `${WM}/1/14/Les_Vampires_-_La_t%C3%AAte_coup%C3%A9e_%281915%29.webm`,
      352,
      272,
      463456,
      "video/webm",
      [["240p.vp9.webm", 310, 240, 224776, "video/webm"]],
    ),
  },
  "les-vampires-e2": {
    id: "les-vampires-e2",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - La Bague qui tue (1915).webm",
    evidence: evidence("Les_Vampires_-_La_Bague_qui_tue_(1915).webm"),
    ...CC_PD,
    durationSec: 788.1,
    originalUrl: `${WM}/3/32/Les_Vampires_-_La_Bague_qui_tue_%281915%29.webm`,
    originalBytes: 68302939,
    verifiedAt,
    variants: ladder(
      "3/32",
      "Les_Vampires_-_La_Bague_qui_tue_%281915%29.webm",
      `${WM}/3/32/Les_Vampires_-_La_Bague_qui_tue_%281915%29.webm`,
      480,
      360,
      693324,
      "video/webm",
      [["240p.vp9.webm", 320, 240, 232080, "video/webm"]],
    ),
  },
  "les-vampires-e3": {
    id: "les-vampires-e3",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - Le Cryptogramme rouge (1915).webm",
    evidence: evidence("Les_Vampires_-_Le_Cryptogramme_rouge_(1915).webm"),
    ...CC_PD,
    durationSec: 2351.4,
    originalUrl: `${WM}/d/d9/Les_Vampires_-_Le_Cryptogramme_rouge_%281915%29.webm`,
    originalBytes: 141789572,
    verifiedAt,
    variants: ladder(
      "d/d9",
      "Les_Vampires_-_Le_Cryptogramme_rouge_%281915%29.webm",
      `${WM}/d/d9/Les_Vampires_-_Le_Cryptogramme_rouge_%281915%29.webm`,
      352,
      256,
      482410,
      "video/webm",
      [["240p.vp9.webm", 330, 240, 249920, "video/webm"]],
    ),
  },
  "les-vampires-e4": {
    id: "les-vampires-e4",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - Le Spectre (1916).webm",
    evidence: evidence("Les_Vampires_-_Le_Spectre_(1916).webm"),
    ...CC_PD,
    durationSec: 1798,
    originalUrl: `${WM}/f/f5/Les_Vampires_-_Le_Spectre_%281916%29.webm`,
    originalBytes: 87058382,
    verifiedAt,
    variants: ladder(
      "f/f5",
      "Les_Vampires_-_Le_Spectre_%281916%29.webm",
      `${WM}/f/f5/Les_Vampires_-_Le_Spectre_%281916%29.webm`,
      352,
      256,
      387364,
      "video/webm",
      [["240p.vp9.webm", 330, 240, 206208, "video/webm"]],
    ),
  },
  "les-vampires-e5": {
    id: "les-vampires-e5",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - L'Evasion du mort (1916).webm",
    evidence: evidence("Les_Vampires_-_L'Evasion_du_mort_(1916).webm"),
    ...CC_PD,
    durationSec: 2128.6,
    originalUrl: `${WM}/2/23/Les_Vampires_-_L%27Evasion_du_mort_%281916%29.webm`,
    originalBytes: 99702466,
    verifiedAt,
    variants: ladder(
      "2/23",
      "Les_Vampires_-_L%27Evasion_du_mort_%281916%29.webm",
      `${WM}/2/23/Les_Vampires_-_L%27Evasion_du_mort_%281916%29.webm`,
      352,
      256,
      374710,
      "video/webm",
      [["240p.vp9.webm", 330, 240, 208328, "video/webm"]],
    ),
  },
  "les-vampires-e6": {
    id: "les-vampires-e6",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - Les Yeux qui fascinent (1916).webm",
    evidence: evidence("Les_Vampires_-_Les_Yeux_qui_fascinent_(1916).webm"),
    ...CC_PD,
    durationSec: 3213.2,
    originalUrl: `${WM}/3/36/Les_Vampires_-_Les_Yeux_qui_fascinent_%281916%29.webm`,
    originalBytes: 179532075,
    verifiedAt,
    variants: ladder(
      "3/36",
      "Les_Vampires_-_Les_Yeux_qui_fascinent_%281916%29.webm",
      `${WM}/3/36/Les_Vampires_-_Les_Yeux_qui_fascinent_%281916%29.webm`,
      352,
      256,
      446984,
      "video/webm",
      [["240p.vp9.webm", 330, 240, 235496, "video/webm"]],
    ),
  },
  "les-vampires-e7": {
    id: "les-vampires-e7",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - Satanas(1916).webm",
    evidence: evidence("Les_Vampires_-_Satanas(1916).webm"),
    ...CC_PD,
    durationSec: 2525.9,
    originalUrl: `${WM}/9/9b/Les_Vampires_-_Satanas%281916%29.webm`,
    originalBytes: 144701152,
    verifiedAt,
    variants: ladder(
      "9/9b",
      "Les_Vampires_-_Satanas%281916%29.webm",
      `${WM}/9/9b/Les_Vampires_-_Satanas%281916%29.webm`,
      352,
      256,
      458303,
      "video/webm",
      [["240p.vp9.webm", 330, 240, 242808, "video/webm"]],
    ),
  },
  "les-vampires-e8": {
    id: "les-vampires-e8",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - Le Maître de la foudre (1916).webm",
    evidence: evidence(
      "Les_Vampires_-_Le_Ma%C3%AEtre_de_la_foudre_(1916).webm",
    ),
    ...CC_PD,
    durationSec: 2989,
    originalUrl: `${WM}/7/70/Les_Vampires_-_Le_Ma%C3%AEtre_de_la_foudre_%281916%29.webm`,
    originalBytes: 146753051,
    verifiedAt,
    variants: ladder(
      "7/70",
      "Les_Vampires_-_Le_Ma%C3%AEtre_de_la_foudre_%281916%29.webm",
      `${WM}/7/70/Les_Vampires_-_Le_Ma%C3%AEtre_de_la_foudre_%281916%29.webm`,
      352,
      272,
      392783,
      "video/webm",
      [["240p.vp9.webm", 310, 240, 197576, "video/webm"]],
    ),
  },
  "les-vampires-e9": {
    id: "les-vampires-e9",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - L'Homme des poisons (1916).webm",
    evidence: evidence("Les_Vampires_-_L'Homme_des_poisons_(1916).webm"),
    ...CC_PD,
    durationSec: 2899.9,
    originalUrl: `${WM}/2/28/Les_Vampires_-_L%27Homme_des_poisons_%281916%29.webm`,
    originalBytes: 165347132,
    verifiedAt,
    variants: ladder(
      "2/28",
      "Les_Vampires_-_L%27Homme_des_poisons_%281916%29.webm",
      `${WM}/2/28/Les_Vampires_-_L%27Homme_des_poisons_%281916%29.webm`,
      352,
      256,
      456146,
      "video/webm",
      [["240p.vp9.webm", 330, 240, 245816, "video/webm"]],
    ),
  },
  "les-vampires-e10": {
    id: "les-vampires-e10",
    provider: "wikimedia-commons",
    commonsFile: "Les Vampires - Les Noces sanglantes (1916).webm",
    evidence: evidence("Les_Vampires_-_Les_Noces_sanglantes_(1916).webm"),
    ...CC_PD,
    durationSec: 3272.5,
    originalUrl: `${WM}/3/32/Les_Vampires_-_Les_Noces_sanglantes_%281916%29.webm`,
    originalBytes: 233394101,
    verifiedAt,
    variants: ladder(
      "3/32",
      "Les_Vampires_-_Les_Noces_sanglantes_%281916%29.webm",
      `${WM}/3/32/Les_Vampires_-_Les_Noces_sanglantes_%281916%29.webm`,
      640,
      360,
      570552,
      "video/webm",
      [["240p.vp9.webm", 426, 240, 196288, "video/webm"]],
    ),
  },

  /* ============ MODERN SERIES (open animation) ============ */
  "caminandes-1": {
    id: "caminandes-1",
    provider: "wikimedia-commons",
    commonsFile: "Caminandes- Llama Drama - Short Movie.ogv",
    evidence: evidence("Caminandes-_Llama_Drama_-_Short_Movie.ogv"),
    ...CC_BY_SA_3,
    durationSec: 89.9,
    originalUrl: `${WM}/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv`,
    originalBytes: 31428271,
    verifiedAt,
    variants: ladder(
      "d/d0",
      "Caminandes-_Llama_Drama_-_Short_Movie.ogv",
      `${WM}/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv`,
      1920,
      1080,
      2796403,
      "video/ogg",
      [
        ["1080p.vp9.webm", 1920, 1080, 1440480, "video/webm"],
        ["480p.vp9.webm", 854, 480, 422648, "video/webm"],
        ["240p.vp9.webm", 426, 240, 207616, "video/webm"],
      ],
    ),
  },
  "caminandes-2": {
    id: "caminandes-2",
    provider: "wikimedia-commons",
    commonsFile:
      "Caminandes - Gran Dillama - Blender Foundation's new Open Movie.webm",
    evidence: evidence(
      "Caminandes_-_Gran_Dillama_-_Blender_Foundation's_new_Open_Movie.webm",
    ),
    ...CC_BY_SA_3,
    durationSec: 146.1,
    originalUrl: `${WM}/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm`,
    originalBytes: 43033601,
    verifiedAt,
    variants: ladder(
      "7/7c",
      "Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm",
      `${WM}/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm`,
      1920,
      1080,
      2355972,
      "video/webm",
      [
        ["1080p.vp9.webm", 1920, 1080, 2855336, "video/webm"],
        ["480p.vp9.webm", 854, 480, 879912, "video/webm"],
        ["240p.vp9.webm", 426, 240, 342896, "video/webm"],
      ],
    ),
  },
  "caminandes-3": {
    id: "caminandes-3",
    provider: "wikimedia-commons",
    commonsFile: "Caminandes 3 - Llamigos - Blender Animated Short.webm",
    evidence: evidence("Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm"),
    ...CC_BY_SA_3,
    durationSec: 150.1,
    originalUrl: `${WM}/a/ab/Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm`,
    originalBytes: 59968030,
    verifiedAt,
    variants: ladder(
      "a/ab",
      "Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm",
      `${WM}/a/ab/Caminandes_3_-_Llamigos_-_Blender_Animated_Short.webm`,
      1920,
      1080,
      3196079,
      "video/webm",
      [
        ["1080p.vp9.webm", 1920, 1080, 2918544, "video/webm"],
        ["480p.vp9.webm", 854, 480, 887688, "video/webm"],
        ["240p.vp9.webm", 426, 240, 349864, "video/webm"],
      ],
    ),
  },
};

export const sourceFor = (id: string): VerifiedSource | undefined =>
  verifiedSources[id];

/** Estimated transfer size in bytes for a variant (bandwidth × duration). */
export const estimateBytes = (v: SourceVariant, durationSec: number): number =>
  Math.round((v.bandwidth * durationSec) / 8);
