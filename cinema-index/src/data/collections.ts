import type { Collection } from "./types";

/**
 * Editorial shelves — mixed dates on purpose; every film referenced here is
 * playable from the verified source layer.
 */

export const collections: Collection[] = [
  {
    id: "collection-light-city",
    code: "ف-01",
    titleAr: "أضواء المدينة",
    subtitleAr: "قبل أن تصير المدينة حكاية، كانت إيقاعًا",
    introAr:
      "المدينة في السينما الصامتة ليست خلفية، بل ممثلٌ يتحرك بسرعة الكاميرا. هنا، شارعٌ وميناءٌ وسفنٌ وأسواق — وكل شيء يُرى على المونتاج كأنه موسيقى.",
    pullQuoteAr: "الشاشة الوحيدة التي لا تُغلق: سينما بلا كهرباء كاملة.",
    filmIds: ["man-with-a-movie-camera", "battleship-potemkin"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/light-city.png",
      altAr: "لوحة تحريرية مستوحاة من فيلم أضواء المدينة",
      position: "50% 35%",
    },
  },
  {
    id: "collection-houses-horror",
    code: "ف-02",
    titleAr: "بيوت الرعب",
    subtitleAr: "ثلاثة أبواب مواربة، وفكرة واحدة عن الليل",
    introAr:
      "في هذه المجموعة، ليس البيت مكانًا يُخاف منه بل طريقة رؤية: الظلال تكبر، والجدران تميل، والمدينة كلها تتحول إلى متاهةٍ واحدة.",
    pullQuoteAr: "كل ما تحتاجه الرعب: جدارٌ مائل، وصمتٌ طويل.",
    filmIds: ["nosferatu", "das-cabinet-des-dr-caligari"],
    seriesIds: ["les-vampires"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/houses-horror.png",
      altAr: "لوحة تحريرية مستوحاة من مجموعة بيوت الرعب",
      position: "50% 45%",
    },
  },
  {
    id: "collection-dream-machines",
    code: "ف-03",
    titleAr: "آلات الأحلام",
    subtitleAr: "من القذيفة المسرحية إلى الأفق الحضري",
    introAr:
      "كيف تنتقل الفكرة من مسرحٍ مضاء إلى محركٍ ثلاثي الأبعاد؟ هذه المجموعة تتتبّع الأدوات: المدفع، الكاميرا، الآلة، والقلم الرقمي.",
    pullQuoteAr: "الأدوات تتغيّر، والخيال يبقى كما كان: شقّاقًا.",
    filmIds: [
      "le-voyage-dans-la-lune",
      "sintel",
      "tears-of-steel",
      "stamp-day-for-superman",
    ],
    art: {
      kind: "editorial-interpretation",
      src: "/art/dream-machines.png",
      altAr: "لوحة تحريرية مستوحاة من مجموعة آلات الأحلام",
      position: "50% 45%",
    },
  },
  {
    id: "collection-open-movies",
    code: "ف-04",
    titleAr: "السينما المفتوحة",
    subtitleAr: "أفلام تُصنع لتُشارَك، لا لتُقفل",
    introAr:
      "مجموعة الأفلام المفتوحة المصدر: كل ما هنا — الصورة، والصوت، وملفات الإنتاج — مرخّص للجميع. شاهدها، حمّلها، أعد مونتاجها، وأعد نشرها.",
    pullQuoteAr: "الترخيص ليس خاتمة الفيلم، بل بدايته الثانية.",
    filmIds: ["elephants-dream", "big-buck-bunny", "sintel", "tears-of-steel"],
    seriesIds: ["caminandes"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/open-movies.png",
      altAr: "لوحة تحريرية مستوحاة من مجموعة الأفلام المفتوحة",
      position: "50% 45%",
    },
  },
  {
    id: "collection-documentary-eye",
    code: "ف-05",
    titleAr: "عين الوثائقي",
    subtitleAr: "الواقع كما يراه من يحمل الكاميرا",
    introAr:
      "الوثائقي الأول، والتجريبي الأشهر: فيلمان يسألان سؤالًا واحدًا — ماذا نرى حين نصوّر الحقيقة؟",
    pullQuoteAr: "الكاميرا تمشي، والمدينة تردّ.",
    filmIds: ["nanook-of-the-north", "man-with-a-movie-camera"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/nanook.png",
      altAr: "لوحة تحريرية مستوحاة من مجموعة عين الوثائقي",
      position: "50% 45%",
    },
  },
];

export const collectionById = (id: string): Collection | undefined =>
  collections.find((c) => c.id === id);
