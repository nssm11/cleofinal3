import type { Series, Episode } from "./types";
import { subtitlesFor } from "./subtitles";

function cast(nameAr: string, nameLatin: string, roleAr?: string) {
  return { nameAr, nameLatin, roleAr };
}

/**
 * Series register. Each episode carries its own verified source.
 * - Les Vampires (1915-16): 10 real episode files on Wikimedia Commons (PD).
 * - Caminandes (2013-16): 3 real episodes, CC BY-SA (Blender open movies).
 * Both are complete works — we publish only what exists and plays.
 */

const ep = (
  number: number,
  id: string,
  titleAr: string,
  titleOriginal: string,
  runtimeMin: number,
  synopsisAr: string,
): Episode => ({
  id,
  number,
  titleAr,
  titleOriginal,
  runtimeMin,
  synopsisAr,
  sourceId: id,
  subtitles: subtitlesFor(id),
});

export const series: Series[] = [
  {
    id: "les-vampires",
    indexCode: "ف-020",
    titleAr: "مصّاصو الدماء",
    titleOriginal: "Les Vampires",
    titleLatin: "Les Vampires",
    yearStart: 1915,
    yearEnd: 1916,
    eraId: "silent-peak",
    director: { nameAr: "لوي فيوياد", nameLatin: "Louis Feuillade" },
    countryAr: "فرنسا",
    genres: ["crime", "thriller", "silent"],
    synopsisAr:
      "عصابة سرية تُسمّى «مصّاصو الدماء» تحكم باريس من تحت الأرض: سرقات، واغتيالات، وقناع حريري أسود يحمله فيليب غيوم. الصحفي فيليب غيرّاب يتعقّبهم عبر عشر مهمات، من «الجمجمة» إلى «الدماء الزكية».",
    noteAr:
      "عشرة أفلام قصيرة — صامتة بالكامل، ومؤرشفة بالكامل — من أكثر أعمال ما قبل الحرب شهرة في التلفّ والغموض. فيوياد صوّر الجريمة كما هي في الشارع: أسطح، ومتاهات، ووجوه هادئة تخفي كل شيء. لا ترجمة لهذه الحلقات بعد — ونحن نقول ذلك بوضوح بدل أن نزوّرها.",
    cast: [
      cast("موسيدور", "Musidora", "إيرما فيب"),
      cast("إدوارد ماتيه", "Édouard Mathé", "فيليب غيرّاب"),
      cast("مارس لانغ", "Marcel Lévesque", "مازيوم"),
    ],
    collectionIds: ["collection-houses-horror"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/les-vampires.png",
      altAr: "رسم تحريري أخضر داكن لهيئة ملثّم يراقب من الظل",
      position: "50% 35%",
    },
    episodes: [
      ep(
        1,
        "les-vampires-e1",
        "الجمجمة",
        "La Tête coupée",
        33,
        "تختفي رأس محتضرٍ من مستشفى شاريتون، ويعثر عليها غيرّاب معلّقة على سور. القافلة الأولى لعصابة «مصّاصو الدماء» تبدأ برأسٍ مقطوع.",
      ),
      ep(
        2,
        "les-vampires-e2",
        "السرقة",
        "La Bague qui tue",
        15,
        "خاتمٌ مسموم ووفاة غامضة في حفل راقص. فيليب غيرّاب يقترب خطوة من الظلال التي تحكم المدينة.",
      ),
      ep(
        3,
        "les-vampires-e3",
        "الشفرة الحمراء",
        "Le Cryptogramme rouge",
        37,
        "أبو فارس يبيع الحصان الفائز للمقامرين، والشفرة الحمراء تقود غيرّاب إلى شفرات العصابة.",
      ),
      ep(
        4,
        "les-vampires-e4",
        "الشبح",
        "Le Spectre",
        15,
        "شخصية «الشبح» تظهر وتختفي — وسمّ إعصارٍ يطال من يقترب من الحقيقة.",
      ),
      ep(
        5,
        "les-vampires-e5",
        "استسلام الموت",
        "L'Évasion du mort",
        37,
        "عملية إنقاذ مستحيلة من السجن تكشف أن «مصّاصو الدماء» لا يعترفون بالجدران.",
      ),
      ep(
        6,
        "les-vampires-e6",
        "عين هيبنو",
        "Les Yeux qui fascinent",
        32,
        "النوم المغناطيسي سلاح: عيونٌ تُسَيْطِر، وقرارات تُتخذ لصالح من يملك النظرة.",
      ),
      ep(
        7,
        "les-vampires-e7",
        "شيطان المريخ",
        "Satanas",
        15,
        "«شيطان المريخ» — القناع الجديد للجريمة — يدخل اللعبة، ويقترب غيرّاب من قلب الشبكة.",
      ),
      ep(
        8,
        "les-vampires-e8",
        "المليون المسموم",
        "Le Maître de la foudre",
        58,
        "الرصاصات السامة والساعات التوقيتية: العصابة تهاجم بالعلم نفسه الذي يلاحقها.",
      ),
      ep(
        9,
        "les-vampires-e9",
        "المال المسموم",
        "L'Homme des poisons",
        37,
        "السموم والابتزاز يشتدّان، والعدالة الفرنسية تتقدّم خطوة واحدة في كل مرة.",
      ),
      ep(
        10,
        "les-vampires-e10",
        "الدماء الزكية",
        "Le Traître",
        28,
        "المهمة الأخيرة: الخيانة من الداخل، والاتفاق الذي يُنهي حكم «مصّاصو الدماء» على باريس — مؤقتًا.",
      ),
    ],
    relatedIds: ["nosferatu", "das-cabinet-des-dr-caligari"],
    tvmazeId: undefined,
  },
  {
    id: "caminandes",
    indexCode: "ف-021",
    titleAr: "كامينانديس",
    titleOriginal: "Caminandes",
    titleLatin: "Caminandes",
    yearStart: 2013,
    yearEnd: 2016,
    eraId: "open-era",
    director: { nameAr: "فريق مؤسسة بلندر", nameLatin: "Blender Institute" },
    countryAr: "هولندا / الأرجنتين (بلندر)",
    genres: ["comedy", "adventure"],
    synopsisAr:
      "ثلاث مغامرات قصيرة لخروفٍ عنيد في باتاغونيا: سياج كهربائي، وثلج، وتشقّق الأرض. لا حوار، لكن الدعابة مرئية حتى آخر شعرة.",
    noteAr:
      "السلسلة القصيرة المفتوحة بالكامل (ر.ت.ب 3.0) من مؤسسة بلندر — إيقاع هزلي صامت يجمع بين أفلام الأطفال والدروس الرقمية. الحلقات الثلاث مرفوعة بالجودة الأصلية 1080p.",
    cast: [],
    collectionIds: ["collection-open-movies"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/caminandes.png",
      altAr: "رسم تحريري لخروفٍ واقف على طريق جبلي بأسلوب قصص مصوّرة ملونة",
      position: "50% 45%",
    },
    episodes: [
      ep(
        1,
        "caminandes-1",
        "لامو",
        "Llama Drama",
        3,
        "خروفٌ عطشان يحاول عبور سياجٍ كهربائي — والكهرباء عنيدة مثله.",
      ),
      ep(
        2,
        "caminandes-2",
        "الثلج الكبير",
        "Gran Dillama",
        3,
        "الثلج يسدّ الطريق، والخروف يخترع الحلول… وكل حل أسوأ من سابقه.",
      ),
      ep(
        3,
        "caminandes-3",
        "تشقّق الصيف",
        "Chicken in the Oven",
        3,
        "الجفاف يهدّد الجميع، والخروف يتعلّم أن الماء أثمن من العناد.",
      ),
    ],
    relatedIds: ["big-buck-bunny", "sintel", "elephants-dream"],
    tvmazeId: undefined,
  },
];

export const seriesById = (id: string): Series | undefined =>
  series.find((s) => s.id === id);
