import type { Series } from "./types";
import { archiveMedia } from "./films";

/**
 * Series — one real serial with a verified episode ledger.
 * Episode identifiers were checked item-by-item against the Internet Archive.
 */
export const series: Series[] = [
  {
    id: "les-vampires",
    indexCode: "ف-020",
    titleAr: "المصاصون",
    titleOriginal: "Les Vampires",
    titleLatin: "Les Vampires",
    yearStart: 1915,
    yearEnd: 1916,
    eraId: "first-light",
    director: { nameAr: "لويس فوياد", nameLatin: "Louis Feuillade" },
    countryAr: "فرنسا",
    genres: ["serial", "silent", "thriller", "city"],
    synopsisAr:
      "عشرة أجزاء من باريس تحت الاحتلال: جماعة إجرامية تسمّي نفسها «المصاصون» تختبئ في قنوات الصرف والفنادق، ويواجهها الصحفي فيليب غيروند وحلفاؤه. ارتجالٌ في السرد، وتنفيذٌ في أماكن حقيقية، وشخصية واحدة — إيرما فيب — كفت عصابة كاملة من الأفلام.",
    noteAr:
      "العمل الأهم في تاريخ المسلسلات الصامتة: يُقرأ اليوم كجسر بين مسرح الغوبلان وسينما الجريمة، وكأول عالم تلفزيوني مفتوح قبل التلفزيون.",
    cast: [
      { nameAr: "موزيدورا", nameLatin: "Musidora", roleAr: "إيرما فيب" },
      { nameAr: "إدوارد ماتيه", nameLatin: "Édouard Mathé", roleAr: "فيليب غيروند" },
      { nameAr: "جان إيميه", nameLatin: "Jean Aymé", roleAr: "الفامبير الكبير" },
      { nameAr: "مارسيل ليفيسك", nameLatin: "Marcel Lévesque", roleAr: "مازامِت" },
    ],
    collectionIds: ["dream-machines"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/still-zinc-roofs.jpg",
      altAr: "تعبير تحريري: سطوح باريس الليلية وأطقم مداخن وصِلَتان",
    },
    detailsUrl: "https://archive.org/details/LesVampires1915DirectedByLouisFeuillade",
    rightsNoteAr: "ملكية عامة — الحلقات تُقدَّم عبر Internet Archive",
    relatedIds: ["das-cabinet-des-dr-caligari", "detour", "le-voyage-dans-la-lune"],
    episodes: [
      {
        id: "les-vampires-e1",
        number: 1,
        titleAr: "الرأسُ المقطوع",
        titleOriginal: "La Tête coupée",
        runtimeMin: 33,
        synopsisAr: "الصحافي فيليب غيروند يبدأ تتبع «المصاصين» بعد العثور على رأس قُطع في حفلة أقنعة.",
        media: archiveMedia("lesVampires1915Episode1-theSeveredHead", "episode"),
      },
      {
        id: "les-vampires-e2",
        number: 2,
        titleAr: "الخاتمُ القاتل",
        titleOriginal: "La Bague qui tue",
        runtimeMin: 16,
        synopsisAr: "خاتمٌ مسموم يقود فيليب خطوة أعمق داخل الشبكة، والفرار يبدو مستحيلاً.",
        media: archiveMedia("lesVampires1915Episode2-theRingThatKills", "episode"),
      },
      {
        id: "les-vampires-e3",
        number: 3,
        titleAr: "الشفرةُ الحمراء",
        titleOriginal: "Le Cryptogramme rouge",
        runtimeMin: 37,
        synopsisAr: "شفرةٌ سرّية في مخطوطة حمراء تكشف أموال المجموعة، ومازامِت يظهر من جديد.",
        media: archiveMedia("lesVampires1915Episode3-theRedCodebook", "episode"),
      },
      {
        id: "les-vampires-e4",
        number: 4,
        titleAr: "الطيف",
        titleOriginal: "Le Spectre",
        runtimeMin: 24,
        synopsisAr: "قناعٌ أسود باسم «الطيف» يخترق أفخم الفنادق، ولا أحد يعرف أين يكمن الفامبير الكبير.",
        media: archiveMedia("lesVampires1915Episode4-theSpectre", "episode"),
      },
      {
        id: "les-vampires-e5",
        number: 5,
        titleAr: "هروبُ الميت",
        titleOriginal: "L'Évasion du mort",
        runtimeMin: 36,
        synopsisAr: "حبسٌ وحيلة مقبرة: أحد الرجال يخرج من السجن كما لو كان قد عاد من الموت.",
        media: archiveMedia("lesVampires1915Episode5-lvasionDuMort", "episode"),
      },
      {
        id: "les-vampires-e6",
        number: 6,
        titleAr: "العيونُ المُسيطِرة",
        titleOriginal: "Les Yeux qui fascinent",
        runtimeMin: 24,
        synopsisAr: "إيرما فيب تستخدم نظرتها المُسَيْطِرة، والقرصنة تدخل الحبكة من البحر.",
        media: archiveMedia("lesVampires1915Episode6-hypnoticEyes", "episode"),
      },
      {
        id: "les-vampires-e7",
        number: 7,
        titleAr: "ساتاناس",
        titleOriginal: "Satanas",
        runtimeMin: 17,
        synopsisAr: "زعيمٌ جديد يرتدي لقب Satanas، ويبدأ داخليًا صراع على قيادة العصابة.",
        media: archiveMedia("lesVampires1915Episode7-satanus", "episode"),
      },
      {
        id: "les-vampires-e8",
        number: 8,
        titleAr: "سيّدُ الرعد",
        titleOriginal: "Le Maître de la foudre",
        runtimeMin: 43,
        synopsisAr: "سلاحٌ كهربائي مرعب يُستعمل ضد أعداء المجموعة، وفيليب أمام محاكمته.",
        media: archiveMedia("lesVampires1915Episode8-theThunderMaster", "episode"),
      },
      {
        id: "les-vampires-e9",
        number: 9,
        titleAr: "رجلُ الفلفل",
        titleOriginal: "L'Homme de poivre",
        runtimeMin: 31,
        synopsisAr: "جرعةُ فلفل قاتلة جدًا، وإيرما فيب تحت أزياء لا تُحصى، وشبكة المصاصين تضعف.",
        media: archiveMedia("lesVampires1915Episode9-thePoisoner", "episode"),
      },
      {
        id: "les-vampires-e10",
        number: 10,
        titleAr: "الزفافُ الدموي",
        titleOriginal: "Les Noces sanglantes",
        runtimeMin: 60,
        synopsisAr: "المواجهة الأخيرة في قلعة ريفية: زفافٌ يتحول إلى مذبحة، ونهاية المصاصين.",
        media: archiveMedia("lesVampires1915Episode10-theTerribleWedding", "episode"),
      },
    ],
  },
];

export const seriesById = (id: string): Series | undefined => series.find((s) => s.id === id);
