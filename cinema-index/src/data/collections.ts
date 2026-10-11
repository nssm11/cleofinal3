import type { Collection } from "./types";

/**
 * Curated collections — real editorial organization over the catalog.
 * `code` is the collection's identifier inside this publication (not a ranking).
 */
export const collections: Collection[] = [
  {
    id: "light-city",
    code: "المجموعة 01",
    titleAr: "الضوءُ والمدينة",
    subtitleAr: "ثلاثة أفلام ترى الحداثة كما تراها الكاميرا",
    introAr:
      "المدينة هي الموضوع الأول للسينما ومرآتها المفضّلة. من مرسى أوديسا إلى طوابق متروبوليس، ومن شوارع موسكو إلى غرف الأخبار: ثلاثة أفلام ترى الحداثة زاحفةً وصاخبةً ومشحونةً بالوعود. ابدأ من الفيلم الذي يشرح كيف ترى الآلة، ثم انتقل إلى الذي يخاف منها، ثم إلى الذي يضحك منها.",
    pullQuoteAr: "الكاميرا ليست مرآة ساكنة؛ إنها آلة تُعيد ترتيب العالم.",
    filmIds: ["man-with-a-movie-camera", "metropolis", "battleship-potemkin"],
    seriesIds: [],
    art: {
      kind: "editorial-interpretation",
      src: "/art/still-city-tram.jpg",
      altAr: "تعبير تحريري: مدينة ليلًا وخطوط ترام في الأسفلت",
    },
  },
  {
    id: "houses-horror",
    code: "المجموعة 02",
    titleAr: "بيوتُ الرعب",
    subtitleAr: "من جدران كاليجاري إلى مزرعة خشبية في بيتسبرغ",
    introAr:
      "كيف يُبنى الخوف في السينما؟ نصف قرن من الإجابات: جدارٌ مائل، ظلٌّ على الدرج، صالة رقص مهجورة، وطاولة يتنازع عليها سبعة أحياء. أربعة أفلام من أربع بيئات إنتاجية مختلفة — ألمانيا التعبيرية، هوليوود الظلية، والمستقلون — تتفق على أن الرعب يُصنع من الضوء لا من الدم.",
    pullQuoteAr: "الظل أرخص من كل مؤثرات العصر، وأدوم منها.",
    filmIds: ["das-cabinet-des-dr-caligari", "nosferatu", "carnival-of-souls", "night-of-the-living-dead"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/still-rain-window.jpg",
      altAr: "تعبير تحريري: مطرٌ على زجاج وشارع ليلي",
    },
  },
  {
    id: "dream-machines",
    code: "المجموعة 03",
    titleAr: "آلاتُ الحلم",
    subtitleAr: "قذيفة في عين القمر، وشمعة في حجرة ساحرة",
    introAr:
      "قبل أن تعرف السينما الحكاية، عرفت الحيلة. ميلييس الساحر يبني صاروخًا من الورق المقوّى، وبونويل ودالي يشقوان عين القمر في ست عشرة دقيقة، وكريستنسن يصوّر الشيطان كما لو كان وثيقة. ثلاث محاولات لإخراج ما لا يرى إلى الضوء.",
    pullQuoteAr: "الحيلة ليست عكس الجدّ؛ إنها أول لغة للسينما.",
    filmIds: ["le-voyage-dans-la-lune", "un-chien-andalou", "haxan"],
    seriesIds: ["les-vampires"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/still-projector.jpg",
      altAr: "تعبير تحريري: بروجكتور وشريط سينمائي في ضوء دافئ",
    },
  },
  {
    id: "side-streets",
    code: "المجموعة 04",
    titleAr: "حاراتُ هوليوود الجانبية",
    subtitleAr: "أفلامٌ صُنعت سريعًا، وبقيت",
    introAr:
      "ليس كل ما بقي من هوليوود هو الضخم. في أرصفة الإنتاج الرخيص، صُنعت أفلامٌ في أيام معدودة: نوارٌ بستة أيام تصوير، كوميديا حوارات لا تتنفس، وإثارة بلا حقوق محفوظة صارت أشهر من الأفلام المحمية. هذه هي الحارة الجانبية — حيث تُختبر الأفكار قبل أن تُقنَّن.",
    pullQuoteAr: "الميزانية تُقرّر كيف يُصوَّر الفيلم، لا كيف يُتذكَّر.",
    filmIds: ["detour", "his-girl-friday", "charade"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/still-desert-road.jpg",
      altAr: "تعبير تحريري: طريق صحراوي عند الغروب",
    },
  },
  {
    id: "documentary-eye",
    code: "المجموعة 05",
    titleAr: "عينُ الوثائقي",
    subtitleAr: "كيف تُصوَّر حياة، وكيف تُراجَع",
    introAr:
      "من جليد الأركتيك إلى شوارع موسكو: محاولتان مبكرتان لتصوير الحياة كما هي — والفارق بينهما يشرح نشوء الوثائقي الحديث. الأول أعاد تمثيل حياة بطله؛ والثاني كشف أدواته على الشاشة. اقرأهما معًا، والملاحظة النقدية إلى جانبك.",
    pullQuoteAr: "كل وثائقي يختار زاويته؛ السؤال هو هل يُصارحك بها.",
    filmIds: ["nanook-of-the-north", "man-with-a-movie-camera"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/still-salt-flat.jpg",
      altAr: "تعبير تحريري: سهل ملحي وأفق بعيد",
    },
  },
];

export const collectionById = (id: string): Collection | undefined =>
  collections.find((c) => c.id === id);
