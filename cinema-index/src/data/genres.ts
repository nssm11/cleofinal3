import type { GenreRef, Era } from "./types";

export const genres: GenreRef[] = [
  { id: "silent", labelAr: "صامت" },
  { id: "documentary", labelAr: "وثائقي" },
  { id: "expressionism", labelAr: "تعبيرية" },
  { id: "horror", labelAr: "رعب" },
  { id: "avant-garde", labelAr: "طليعة" },
  { id: "sci-fi", labelAr: "خيال علمي" },
  { id: "noir", labelAr: "نوار" },
  { id: "comedy", labelAr: "كوميديا" },
  { id: "thriller", labelAr: "إثارة" },
  { id: "history", labelAr: "تاريخي" },
  { id: "serial", labelAr: "مسلسل" },
  { id: "city", labelAr: "المدينة" },
];

export const genreById = (id: string): GenreRef =>
  genres.find((g) => g.id === id) ?? { id, labelAr: id };

export const eras: Era[] = [
  { id: "first-light", labelAr: "السينما الأولى", rangeAr: "1902 – 1916" },
  { id: "silent-peak", labelAr: "ذروة الصمت", rangeAr: "1920 – 1929" },
  { id: "american-shadows", labelAr: "ظلال أمريكية", rangeAr: "1940 – 1959" },
  { id: "independent-sixties", labelAr: "الستونيات المستقلة", rangeAr: "1960 – 1969" },
];

export const eraById = (id: string): Era =>
  eras.find((e) => e.id === id) ?? { id, labelAr: id, rangeAr: "" };
