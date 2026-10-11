import { seriesSchema, type Series, type Source } from "./types";

/**
 * The serial shelf — three public-domain television series, episode by
 * episode. Episode numbers appear ONLY where the archive documents them
 * (identifier or item metadata); preserved television arrives out of order,
 * and this catalog refuses to invent an order it cannot prove.
 */

const arc = (identifier: string, fileHint?: string): Source => ({
  host: "archive",
  identifier,
  ...(fileHint ? { fileHint } : {}),
  pageUrl: `https://archive.org/details/${identifier}`,
});

const rawSeries = [
  {
    kind: "series",
    slug: "sherlock-holmes-1954",
    titleAr: "شرلوك هولمز",
    titleLat: "Sherlock Holmes",
    yearFrom: 1954,
    yearTo: 1955,
    creatorAr: "شيلدون ريموند",
    creatorLat: "Sheldon Reynolds",
    countryAr: "فرنسا / الولايات المتحدة",
    countryLat: "France / USA",
    genres: ["mystery", "procedural", "drama"],
    synopsisAr:
      "أول مسلسل تلفزيوني عن شرلوك هولمز: ٣٩ حلقة من نصف الساعة صُوّرت في باريس للتلفزيون الأمريكي، مع رونالد هوارد في دور المحقق وهوارد ماريون-كروفورد في دور واطسون. لندن هنا استوديو فرنسي — والسذاجة جزء من السحر.",
    noteAr:
      "رونالد هوارد ابن الممثل ليزلي هوارد، وهذا أول هولمز صُنع للشاشة الصغيرة أصلًا. الحلقات المحفوظة في الأرشيف وصلت بلا ترتيب رسمي؛ نعرضها كما وصلت، ولا نختلق أرقامًا.",
    license: "pd",
    tint: "blue",
    motif: "blinds",
    seasons: [
      {
        labelAr: "حلقات محفوظة",
        noteAr: "١٩٥٤–١٩٥٥ · الأرقام حيث وثّقها الأرشيف فقط",
        episodes: [
          { slug: "shy-ballerina", titleAr: "قضية الراقصة الخجولة", titleLat: "The Case of the Shy Ballerina", runtimeMin: 26, year: 1954, source: arc("SherlockHolmes-TheCaseoftheShyBallerina") },
          { slug: "lady-beryl", titleAr: "قضية الليدي بيريل", titleLat: "The Case of Lady Beryl", runtimeMin: 26, year: 1954, source: arc("SherlockHolmes-TheCaseofLadyBeryl") },
          { slug: "cunningham-heritage", titleAr: "قضية إرث كانينغهام", titleLat: "The Case of the Cunningham Heritage", runtimeMin: 26, year: 1954, source: arc("SherlockHolmes-TheCaseoftheCunninghamHeritage") },
          { slug: "belligerent-ghost", titleAr: "قضية الشبح المشاكس", titleLat: "The Case of the Belligerent Ghost", runtimeMin: 26, year: 1954, source: arc("SherlockHolmes-TheCaseoftheBelligerentGhost") },
          { slug: "texas-cowgirl", titleAr: "قضية فتاة تكساس", titleLat: "The Case of the Texas Cowgirl", runtimeMin: 26, year: 1954, source: arc("SherlockHolmes-TheCaseoftheTexasCowgirl") },
          { slug: "pennsylvania-gun", titleAr: "قضية بندقية بنسلفانيا", titleLat: "The Case of the Pennsylvania Gun", runtimeMin: 26, year: 1954, source: arc("SherlockHolmes-TheCaseofthePennsylvaniaGun") },
          { slug: "harry-crocker", numberLabel: "E09", titleAr: "قضية هاري كروكر", titleLat: "The Case of Harry Crocker", runtimeMin: 26, year: 1954, source: arc("sherlock-holmes-1954-s-01-e-09-the-case-of-harry-crocker") },
          { slug: "french-interpreter", numberLabel: "E14", titleAr: "قضية المترجم الفرنسي", titleLat: "The Case of the French Interpreter", runtimeMin: 26, year: 1954, source: arc("sherlock-holmes-1954-s-01-e-14-the-case-of-the-french-interpreter-14-mbps") },
          { slug: "laughing-mummy", titleAr: "قضية المومياء الضاحكة", titleLat: "The Case of the Laughing Mummy", runtimeMin: 26, year: 1954, source: arc("Sherlock_Holmes_TCOT_Laughing_Mummy") },
          { slug: "split-ticket", titleAr: "قضية التذكرة المشطورة", titleLat: "The Case of the Split Ticket", runtimeMin: 26, year: 1954, source: arc("Sherlock_Holmes_TCOT_Split_Ticket") },
          { slug: "christmas-pudding", titleAr: "قضية حلوى الميلاد", titleLat: "The Christmas Pudding", runtimeMin: 26, year: 1955, source: arc("SherlockHolmesTheChristmasPudding") },
        ],
      },
    ],
  },
  {
    kind: "series",
    slug: "one-step-beyond",
    titleAr: "خطوة إلى المجهول",
    titleLat: "One Step Beyond",
    yearFrom: 1959,
    yearTo: 1961,
    creatorAr: "مروين جيرارد · تقديم جون نيولاند",
    creatorLat: "Merwin Gerard · John Newland",
    countryAr: "الولايات المتحدة",
    countryLat: "USA",
    genres: ["anthology", "mystery", "scifi", "horror"],
    synopsisAr:
      "أنثولوجيا خوارق تسبق «المنطقة الغامضة» بخطوة: كل حلقة دراما مستقلة تزعم أنها مبنية على «حالات موثقة» من التخاطر والاستبصار والأشباح، يقدمها المخرج نفسه بصوت هادئ يزيد الأمر رعبًا.",
    noteAr:
      "«القصص التالية موثقة… إلى حد ما» — الجملة الافتتاحية الشهيرة. الحلقات هنا مرقّمة بترقيم الأرشيف نفسه عبر ثلاثة مواسم.",
    license: "pd",
    tint: "violet",
    motif: "orbit",
    seasons: [
      {
        n: 1,
        labelAr: "الموسم الأول",
        episodes: [
          { slug: "emergency-only", numberLabel: "S01E03", titleAr: "طوارئ فقط", titleLat: "Emergency Only", runtimeMin: 25, year: 1959, source: arc("S1E3EMERGENCYONLY") },
          { slug: "epilogue", numberLabel: "S01E06", titleAr: "خاتمة", titleLat: "Epilogue", runtimeMin: 25, year: 1959, source: arc("S1E6Epilogue_201804") },
          { slug: "premonition", numberLabel: "S01E08", titleAr: "الحدس", titleLat: "Premonition", runtimeMin: 25, year: 1959, source: arc("S1E8PREMONITION") },
        ],
      },
      {
        n: 2,
        labelAr: "الموسم الثاني",
        episodes: [
          { slug: "open-window", numberLabel: "S02E07", titleAr: "النافذة المفتوحة", titleLat: "The Open Window", runtimeMin: 25, year: 1959, source: arc("S2E7THEOPENWINDOW_201804") },
          { slug: "earthquake", numberLabel: "S02E17", titleAr: "الزلزال", titleLat: "Earthquake", runtimeMin: 25, year: 1960, source: arc("OneStepBeyondEarthquake") },
        ],
      },
      {
        n: 3,
        labelAr: "الموسم الثالث",
        episodes: [
          { slug: "sacred-mushroom", numberLabel: "S03E18", titleAr: "الفطر المقدس", titleLat: "The Sacred Mushroom", runtimeMin: 25, year: 1961, source: arc("S3E18THESACREDMUSHROOM_201804") },
          { slug: "the-avengers", numberLabel: "S03E28", titleAr: "المنتقمون", titleLat: "The Avengers", runtimeMin: 25, year: 1961, source: arc("S3E28THEAVENGERS") },
        ],
      },
    ],
  },
  {
    kind: "series",
    slug: "dragnet",
    titleAr: "شبكة الشرطة",
    titleLat: "Dragnet",
    yearFrom: 1951,
    yearTo: 1959,
    creatorAr: "جاك ويب",
    creatorLat: "Jack Webb",
    countryAr: "الولايات المتحدة",
    countryLat: "USA",
    genres: ["procedural", "noir", "drama"],
    synopsisAr:
      "السرجنت جو فرايداي وشركاؤه في شرطة لوس أنجلوس: تحقيق إجرائي بأسلوب شبه وثائقي، حوار مقتضب، وموسيقى افتتاحية من أربع نوتات صارت أشهر جملة موسيقية في تلفزيون الشرطة. كل حلقة «مبنية على ملفات حقيقية».",
    noteAr:
      "جاك ويب أخرج ومثّل وفرض أسلوبًا مضادًا للدراما: الوقائع فقط. الحلقة الأولى «القنبلة البشرية» هي الفيلم الطويل الذي فتح للمسلسل بابه. إحدى الحلقات هنا وصلت بنسخة تحمل الإعلانات الأصلية لعام ١٩٥٢ — أبقيناها كما هي، فالإعلان جزء من الذاكرة.",
    license: "pd",
    tint: "blue",
    motif: "blinds",
    seasons: [
      {
        labelAr: "حلقات محفوظة",
        noteAr: "١٩٥١–١٩٥٩ · مختارات من الحلقات المتبقية في الملكية العامة",
        episodes: [
          { slug: "the-human-bomb", titleAr: "القنبلة البشرية", titleLat: "The Human Bomb", runtimeMin: 78, year: 1951, source: arc("DragnetTheHumanBomb") },
          { slug: "the-big-seventeen", titleAr: "السبعة عشر الكبار", titleLat: "The Big Seventeen", runtimeMin: 30, year: 1952, source: arc("DragnetEpisode18TheBigSeventeenwcommercials") },
          { slug: "the-big-actor", titleAr: "الممثل الكبير", titleLat: "The Big Actor", runtimeMin: 30, year: 1953, source: arc("DragnetTheBigActor") },
          { slug: "the-big-betty", titleAr: "بيتي الكبيرة", titleLat: "The Big Betty", runtimeMin: 30, year: 1953, source: arc("DragnetTheBigBetty") },
          { slug: "the-big-children", titleAr: "الأطفال الكبار", titleLat: "The Big Children", runtimeMin: 30, year: 1953, source: arc("DragnetTheBigChildren") },
          { slug: "the-big-lamp", titleAr: "المصباح الكبير", titleLat: "The Big Lamp", runtimeMin: 30, year: 1953, source: arc("DragnetTheBigLamp") },
          { slug: "the-big-mother", titleAr: "الأم الكبيرة", titleLat: "The Big Mother", runtimeMin: 30, year: 1954, source: arc("DragnetTheBigMother") },
          { slug: "the-big-will", titleAr: "الوصية الكبيرة", titleLat: "The Big Will", runtimeMin: 30, year: 1954, source: arc("DragnetTheBigWill") },
          { slug: "the-big-war", titleAr: "الحرب الكبيرة", titleLat: "The Big War", runtimeMin: 30, year: 1954, source: arc("DragnetTheBigWar") },
          { slug: "the-big-hate", titleAr: "الحقد الكبير", titleLat: "The Big Hate", runtimeMin: 30, year: 1955, source: arc("DragnetTheBigHate") },
          { slug: "the-big-fraud", titleAr: "الاحتيال الكبير", titleLat: "The Big Fraud", runtimeMin: 30, year: 1955, source: arc("DragnetTheBigFraud") },
          { slug: "the-big-deal", titleAr: "الصفقة الكبيرة", titleLat: "The Big Deal", runtimeMin: 30, year: 1956, source: arc("Dragnet-TheBigDeal1956") },
        ],
      },
    ],
  },
] as const;

export const seriesList: Series[] = seriesSchema.array().parse(rawSeries);
