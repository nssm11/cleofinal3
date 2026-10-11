import type { Film } from "./types";
import { subtitlesFor } from "./subtitles";

/**
 * Film register — availability-driven.
 * Every entry has a `sourceId` into `verifiedSources` (real Commons file with
 * playable transcodes + download rows). No film without a verified source is
 * published here.
 */

const cast = (nameAr: string, nameLatin: string, roleAr?: string) => ({
  nameAr,
  nameLatin,
  roleAr,
});

export const films: Film[] = [
  {
    id: "nosferatu",
    indexCode: "ف-001",
    titleAr: "نوسفيراتو",
    titleOriginal: "Nosferatu, eine Symphonie des Grauens",
    titleLatin: "Nosferatu, eine Symphonie des Grauens",
    year: 1922,
    eraId: "silent-peak",
    director: { nameAr: "ف. و. مورناو", nameLatin: "F. W. Murnau" },
    countryAr: "ألمانيا (فايمار)",
    runtimeMin: 94,
    genres: ["horror", "fantasy", "silent"],
    synopsisAr:
      "يوكل الشاب هوتر تاجرًا غامضًا بالسفر إلى جبال الكارباثيا لبيع منزل في البلدة. يبدأ الطريق كمهمة تجارية، وينتهي عند أبواب قلعة يسكنها شيء لا ينتمي إلى ضوء النهار.",
    noteAr:
      "«سيمفونية الرعب» هي أقدم محاولة جادة لتصوير مصاص الدماء على الشاشة، ونسيجها الطيفي — نورٌ ضارب إلى الشحوب، وظلال تتحرك كأنها تتنفس — رسّخت لغة الرعب بصريًا قبل أن تتوارثها الأجيال. النسخة المرئية هنا من كومنز، مصحوبة بترجمة عربية كاملة أُنتجت لهذه الطبعة.",
    cast: [
      cast("ماكس شريك", "Max Schreck", "الكونت أورلوك"),
      cast("غوستاف فون فانغنهايم", "Gustav von Wangenheim", "هوتر"),
      cast("غريتا شرودر", "Greta Schröder", "إلين"),
      cast("ألكسندر غراناخ", "Alexander Granach", "نوك"),
    ],
    collectionIds: ["collection-houses-horror"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/nosferatu.png",
      altAr: "رسم تحريري استلهمي لمخلوق سامٍ يدندن حول شحوب حضوره",
      position: "50% 40%",
    },
    sourceId: "nosferatu",
    subtitles: subtitlesFor("nosferatu"),
    relatedIds: ["das-cabinet-des-dr-caligari", "les-vampires"],
  },
  {
    id: "battleship-potemkin",
    indexCode: "ف-002",
    titleAr: "السفينة الحربية بوتيمكين",
    titleOriginal: "Броненосец «Потёмкин»",
    titleLatin: "Bronenosets Potyomkin",
    year: 1925,
    eraId: "silent-peak",
    director: { nameAr: "سيرغي آيزنشتاين", nameLatin: "Sergei Eisenstein" },
    countryAr: "الاتحاد السوفيتي",
    runtimeMin: 75,
    genres: ["history", "silent"],
    synopsisAr:
      "على متن سفينة حربية في ميناء أوديسا، يتحول اعتراض عن لحم فاسد إلى تمرّد كامل. ومن فوق الدرج الحجري، تتحول المدينة المتضامنة إلى موجة واحدة.",
    noteAr:
      "أسطورة «المونتاج السوفيتي» في ساعتين قصيرتين: اقتطاع الزمن ووصله صورةً بصورة حتى يصبح القلب هو المونتير. مشهد درج أوديسا يُدرَّس حتى اليوم كأنه كتاب، لا كأنه فيلم.",
    cast: [
      cast("ألكسندر أنتونوف", "Aleksandr Antonov", "البحّار فاكنشوك"),
      cast("فلاديمير بارسكي", "Vladimir Barsky", "القبطان غوليكوف"),
    ],
    collectionIds: ["collection-light-city"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/potemkin.png",
      altAr: "لوحة تحريرية سوداء يعلوها شكل سفينة وشرارة احتجاج",
      position: "50% 40%",
    },
    sourceId: "battleship-potemkin",
    subtitles: [],
    relatedIds: ["man-with-a-movie-camera", "nosferatu"],
  },
  {
    id: "das-cabinet-des-dr-caligari",
    indexCode: "ف-003",
    titleAr: "مطبعة الدكتور كاليجاري",
    titleOriginal: "Das Cabinet des Dr. Caligari",
    titleLatin: "Das Cabinet des Dr. Caligari",
    year: 1920,
    eraId: "silent-peak",
    director: { nameAr: "روبرت فينه", nameLatin: "Robert Wiene" },
    countryAr: "ألمانيا (فايمار)",
    runtimeMin: 77,
    genres: ["horror", "fantasy", "silent"],
    synopsisAr:
      "في معرضٍ تُعرض فيه مومياء نائمة، يوقظ د. كاليجاري «الم梦ّر» سيزار لينبؤ بالقتل. الشهادة على كل هذا يرويها شاب في مستشفى المجانين، ولكل رواية وجهٌ آخر.",
    noteAr:
      "التعبيرية الألمانية في أنقى صورها: جدران مائلة، ظلال مرسومة على الحائط، ومدينة كاملة كأنها انثنت في مكانها. فيلمٌ يقول إن ما نراه قد يكون أقرب إلى الحقيقة مما توافق عليه العيون.",
    cast: [
      cast("كونراد فايت", "Conrad Veidt", "سيزار"),
      cast("فيرنر كراوس", "Werner Krauss", "د. كاليجاري"),
    ],
    collectionIds: ["collection-houses-horror"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/caligari.png",
      altAr:
        "جرافيتي قوطي أزرق مائل الشكل على جدار معدني، مستوحى من زوايا فيلم كاليجاري",
      position: "50% 45%",
    },
    sourceId: "das-cabinet-des-dr-caligari",
    subtitles: [],
    relatedIds: ["nosferatu", "les-vampires"],
  },
  {
    id: "le-voyage-dans-la-lune",
    indexCode: "ف-004",
    titleAr: "الرحلة إلى القمر",
    titleOriginal: "Le Voyage dans la Lune",
    titleLatin: "Le Voyage dans la Lune",
    year: 1902,
    eraId: "first-light",
    director: { nameAr: "جورج ميلييس", nameLatin: "Georges Méliès" },
    countryAr: "فرنسا",
    runtimeMin: 15,
    genres: ["fantasy", "silent"],
    synopsisAr:
      "يلتقي ثلة من الفلكيين الأشاوس، وقرروا أن يزوروا القمر في قذيفة مدفعية. الهبوط على العين اليمنى للقمر، وحشٌ دخاني، وعودة ملحمية إلى الأرض واحتفالٌ بالعلم.",
    noteAr:
      "ميلييس، الساحر المسرحي، حوّل اللعب بالبوب-أب المسرحي إلى سينما: تلوين يدوي في نسخ، ومونتاج عن قصد، وقذيفة تُطلق الخيال العلمي قبل أن يصبح نوعًا.",
    cast: [cast("جورج ميلييس", "Georges Méliès", "الفلكي باربينفليه")],
    collectionIds: ["collection-dream-machines"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/voyage.png",
      altAr: "وجه مرسوم على هلال يتلقى قذيفة مسرحية، بأسلوب ملصق فني ملوّن",
      position: "50% 45%",
    },
    sourceId: "le-voyage-dans-la-lune",
    subtitles: [],
    relatedIds: ["sintel", "big-buck-bunny"],
  },
  {
    id: "nanook-of-the-north",
    indexCode: "ف-005",
    titleAr: "نانوك من الشمال",
    titleOriginal: "Nanook of the North",
    titleLatin: "Nanook of the North",
    year: 1922,
    eraId: "silent-peak",
    director: { nameAr: "روبرت فلاهارتي", nameLatin: "Robert J. Flaherty" },
    countryAr: "الولايات المتحدة",
    runtimeMin: 79,
    genres: ["documentary", "silent"],
    synopsisAr:
      "مواسمٌ في حياة صيادٍ إينويت وعائلته: صيد الفقمة، وبناء الإيغلو، ورحلات على الجليد حيث يصبح البقاء نفسه نوعًا من الحكاية.",
    noteAr:
      "فيلمٌ أسّس كلمة «وثائقي» عمليًا، وفي الوقت نفسه شهد على مغامرتها الأخلاقية الأولى: فلاهارتي مثّل ونظّم ما صوّر. ملاحظة المصادر إخراجية: مشاهد الصيد مؤلفة بعناية، والرجل نفسه — آلاكري — مات جوعًا بعد سنوات.",
    cast: [cast("آلاكري", "Allakarialik (Nanook)", "نانوك")],
    collectionIds: ["collection-documentary-eye"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/nanook.png",
      altAr:
        "تكوين أزرق كثيف من لفاتٍ وومضات لونية، نسخة تحريرية ملوّنة للوحة العام",
      position: "50% 45%",
    },
    sourceId: "nanook-of-the-north",
    subtitles: [],
    relatedIds: ["man-with-a-movie-camera"],
  },
  {
    id: "man-with-a-movie-camera",
    indexCode: "ف-006",
    titleAr: "رجل مع كاميرا",
    titleOriginal: "Человек с киноаппаратом",
    titleLatin: "Chelovek s kino-apparatom",
    year: 1929,
    eraId: "silent-peak",
    director: { nameAr: "دزيغا فيرتوف", nameLatin: "Dziga Vertov" },
    countryAr: "الاتحاد السوفيتي",
    runtimeMin: 68,
    genres: ["documentary", "silent"],
    synopsisAr:
      "يومٌ كامل في مدينة سوفييتية — من الاستيقاظ إلى الملهى — يمرّ عبر عدسة مصور يمشي، ويتسلق، ويصوّر، بينما تتصادق الجسور والقطارات والوجوه على إيقاعٍ واحد.",
    noteAr:
      "السينما تنظر إلى نفسها وتفرح: مونتاج مفرط الحركة، وكل حيلة في الكتاب — الكاميرا المزدوجة، والتوقف الزمني، والتشريح البصري — معلنةً لا مخفية. النسخة المستخدمة هنا بجودة بلو-راي 1080p.",
    cast: [cast("ميخائيل كوفمان", "Mikhail Kaufman", "المصور")],
    collectionIds: ["collection-light-city", "collection-documentary-eye"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/vertov.png",
      altAr:
        "رسم تحريري بأسلوب تعبيري لهيئة رجل يقف أمام شبكة أفقية ويرفع ذراعه",
      position: "50% 30%",
    },
    sourceId: "man-with-a-movie-camera",
    subtitles: [],
    relatedIds: ["battleship-potemkin", "nanook-of-the-north"],
  },
  {
    id: "stamp-day-for-superman",
    indexCode: "ف-007",
    titleAr: "يوم الطوابع لسوبرمان",
    titleOriginal: "Stamp Day for Superman",
    titleLatin: "Stamp Day for Superman",
    year: 1954,
    eraId: "american-shadows",
    director: { nameAr: "توماس كار", nameLatin: "Thomas Carr" },
    countryAr: "الولايات المتحدة",
    runtimeMin: 38,
    genres: ["adventure", "comedy"],
    synopsisAr:
      "سوبرمان وجيمي أولسن في مهمة خاصة: إنقاذ «يوم الطوابع» المدرسي من عصابة تزوير. خمسة وثلاثون دقيقة من التلفزيون الذهبي، بألوانها، وجدّيتها المدهشة في أهدافها المدنية.",
    noteAr:
      "حلقة تلفزيونية عامة الأغراض أنتجتها الأستوديوهات لتشجيع ادخار الطوابع — ليست فيلمًا روائيًا طويلًا، ولا تدّعي ذلك. موقعها في الرفوف: توثيق لسوبرمان التلفزيوني (جورج ريفز) كما كان يُبثّ على الهواء مباشرة، ومقابلًا مفتوح الاستخدام.",
    cast: [
      cast("جورج ريفز", "George Reeves", "سوبرمان / كلارك كنت"),
      cast("جاك لارسون", "Jack Larson", "جيمي أولسن"),
    ],
    collectionIds: ["collection-dream-machines"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/superman-1954.png",
      altAr:
        "رسم تحريري لشخصية طيّار على خلفية داكنة، مستوحى من سوبرمان التلفزيوني",
      position: "50% 35%",
    },
    sourceId: "stamp-day-for-superman",
    subtitles: [],
    relatedIds: ["sintel", "tears-of-steel"],
  },
  {
    id: "elephants-dream",
    indexCode: "ف-008",
    titleAr: "حلم الفيلة",
    titleOriginal: "Elephants Dream",
    titleLatin: "Elephants Dream",
    year: 2006,
    eraId: "open-era",
    director: { nameAr: "بسام كردالي", nameLatin: "Bassam Kurdali" },
    countryAr: "هولندا / مؤسسة بلندر",
    runtimeMin: 11,
    genres: ["sci-fi", "fantasy"],
    synopsisAr:
      "رجلان داخل آلة عملاقة لا تنتهي: بروغ القديم الذي يعرف كل شيء، وإيميل الشاب الذي يرى أن هناك شيئًا خارج الآلة. كل شيء يمكن أن يكون مختلفًا.",
    noteAr:
      "أول «فيلم مفتوح» في تاريخ مؤسسة بلندر (2006): كل لقطة، وكل نموذج، وكل نغمة — تحت رخصة حرة. العمل هنا ليس فقط فيلمًا، بل بيان إنتاج مفتوح.",
    cast: [],
    collectionIds: ["collection-open-movies", "collection-dream-machines"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/big-buck-bunny.png",
      altAr: "رسم تحريري لغابة مرسومة رقميًا بأسلوب أفلام بلندر المفتوحة",
      position: "50% 45%",
    },
    sourceId: "elephants-dream",
    subtitles: [],
    relatedIds: ["sintel", "big-buck-bunny", "tears-of-steel"],
  },
  {
    id: "sintel",
    indexCode: "ف-009",
    titleAr: "سينتل",
    titleOriginal: "Sintel",
    titleLatin: "Sintel",
    year: 2010,
    eraId: "open-era",
    director: { nameAr: "كولين ليفي", nameLatin: "Colin Levy" },
    countryAr: "هولندا / مؤسسة بلندر",
    runtimeMin: 15,
    genres: ["fantasy", "adventure"],
    synopsisAr:
      "فتاة تبحث عن صديقها التنين المفقود عبر جبال قاحلة ومدنٍ نائية. كل خطوة في الرحلة تكشف أن بعض الحكايات لا تعود كما كانت.",
    noteAr:
      "المشروع الثالث لبلندر المفتوح، وأكثرها عاطفة: رحلة بصرية بواقعية مدهش للمواد والثلج والإضاءة. كل شيء مفتوح — ومن أراد أن يعيد المونتاج نفسه، فله ذلك حرًا.",
    cast: [],
    collectionIds: ["collection-open-movies", "collection-dream-machines"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/big-buck-bunny.png",
      altAr: "رسم تحريري لغابة مرسومة رقميًا بأسلوب أفلام بلندر المفتوحة",
      position: "50% 55%",
    },
    sourceId: "sintel",
    subtitles: [],
    relatedIds: ["elephants-dream", "tears-of-steel", "le-voyage-dans-la-lune"],
  },
  {
    id: "tears-of-steel",
    indexCode: "ف-010",
    titleAr: "دموع من فولاذ",
    titleOriginal: "Tears of Steel",
    titleLatin: "Tears of Steel",
    year: 2012,
    eraId: "open-era",
    director: { nameAr: "إيان هوبرت", nameLatin: "Ian Hubert" },
    countryAr: "هولندا / مؤسسة بلندر",
    runtimeMin: 12,
    genres: ["sci-fi", "adventure"],
    synopsisAr:
      "في أمستردام ما بعد الكوارث، يحاول فريقٌ من العلماء استعادة ذاكرة روبوتاتٍ كادت تُفني البشرية. المفتاح: ذكرى حبٍّ قديمة، مسجّلة على الجسر.",
    noteAr:
      "أول تجربة بلندر المفتوحة بتصوير حيّ حقيقي + مؤثرات مفتوحة المصدر بالكامل. الفيلم هو نفسه ورشة عمل: كل ملفات إنتاجه مفتوحة على الهواء.",
    cast: [],
    collectionIds: ["collection-open-movies", "collection-dream-machines"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/big-buck-bunny.png",
      altAr: "رسم تحريري بأسلوب رقمي حضري مستوحى من أفلام بلندر المفتوحة",
      position: "50% 35%",
    },
    sourceId: "tears-of-steel",
    subtitles: [],
    relatedIds: ["sintel", "elephants-dream"],
  },
  {
    id: "big-buck-bunny",
    indexCode: "ف-011",
    titleAr: "الأرنب الضخم باني",
    titleOriginal: "Big Buck Bunny",
    titleLatin: "Big Buck Bunny",
    year: 2008,
    eraId: "open-era",
    director: { nameAr: "ساشا غويديغيبور", nameLatin: "Sacha Goedegebure" },
    countryAr: "هولندا / مؤسسة بلندر",
    runtimeMin: 10,
    genres: ["comedy", "adventure"],
    synopsisAr:
      "أرنب ضخم طيّب يستيقظ في صباحٍ جميل، ليجد ثلاثة قوارض تعبث بجنّته. الانتقام — بلباقة، وبعضٌ من الأزهار — قادم.",
    noteAr:
      "كلاسيكيا الإيقاع الهزلي في نسخة رقمية مفتوحة بالكامل (ر.ت.ب 3.0). الفيلم أصبح أيضًا معيارًا قياسيًا لاختبار مشغّلات الفيديو في العالم — وقد اختبرناه هنا على المشغّل نفسه.",
    cast: [],
    collectionIds: ["collection-open-movies"],
    art: {
      kind: "editorial-interpretation",
      src: "/art/big-buck-bunny.png",
      altAr:
        "رسم تحريري لغابة ملوّنة مع مخلوقات صغيرة، مستوحى من عالم أفلام بلندر",
      position: "50% 55%",
    },
    sourceId: "big-buck-bunny",
    subtitles: [],
    relatedIds: ["elephants-dream", "sintel"],
  },
];

export const filmById = (id: string): Film | undefined =>
  films.find((f) => f.id === id);
