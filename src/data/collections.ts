import { collectionSchema, type Collection } from "./types";

/**
 * Programming, not categories. Each collection is a curator's act with its
 * own essay and — crucially — its own layout composition, so the homepage
 * can never collapse into a stack of interchangeable rails.
 */

const rawCollections = [
  {
    slug: "shadows-moons",
    titleAr: "ظلال وأقمار",
    titleLat: "Shadows & Moons",
    essayAr:
      "حين خسرت ألمانيا الحرب الأولى، لم تجد السينما هناك ما تقوله عن الواقع، فقالت عنه الظل. ديكورات مرسومة ومائلة، ضوء مدهون بالفرشاة على الجدران، وجوه تذوب في العتمة: التعبيرية لم تكن أسلوب تصوير بل طريقة اعتراف. معها وُلد الرعب السينمائي بلغته التي نعرفها — الوحش يدخل الغرفة قبل أن نراه، ظلًّا على الحائط.",
    layout: "salon",
    tint: "green",
    members: ["caligari", "nosferatu", "golem", "haxan", "phantom-of-the-opera"],
    homeOrder: 2,
  },
  {
    slug: "keaton",
    titleAr: "كيتون: الوجه الذي لا يضحك",
    titleLat: "Keaton: The Great Stone Face",
    essayAr:
      "باستر كيتون لا يبتسم أبدًا، لأن العالم من حوله يستحق وجهًا أخطر. مهندس كوميديا بالحساب والقياس: قطارات حقيقية، بيوت تدور، واجهات مبانٍ تسقط بفارق سنتيمترات عن رقبته. جسده آلة دقيقة في عالم يختبر قوانين الفيزياء عليه — وكل لقطة خطرة نُفّذت مرة واحدة، أمام الكاميرا، بلا خدع إخفاء.",
    layout: "rail",
    tint: "amber",
    members: ["the-general", "sherlock-jr", "steamboat-bill-jr", "our-hospitality", "the-cameraman", "one-week", "cops"],
    homeOrder: 1,
  },
  {
    slug: "noir",
    titleAr: "مدينة بالأسود والأبيض",
    titleLat: "A City in Black and White",
    essayAr:
      "بعد الحرب العالمية، نزلت السينما إلى الشارع: مطر على أسفلت لامع، وستائر تلقي قضبانًا من ظل على الوجوه، ورجل عادي يتخذ قرارًا واحدًا غبيًا فتقوده المدينة إلى مصيره. النوار ليس نوعًا بقدر ما هو مزاج — تشاؤم أنيق، وأخلاق رمادية، ونساء يعرفن أكثر مما يقلن. هذه فهرسه في أرشيفنا.",
    layout: "index",
    tint: "blue",
    members: ["detour", "the-stranger", "scarlet-street", "the-big-combo", "doa", "the-hitch-hiker", "too-late-for-tears", "angel-on-my-shoulder"],
    homeOrder: 3,
  },
  {
    slug: "chills",
    titleAr: "قشعريرة",
    titleLat: "Chills",
    essayAr:
      "من مصاص دماء بلا صوت إلى موتى يقومون في بنسلفانيا: قرنٌ من الخوف المجاني. الرعب أرخص أنواع السينما إنتاجًا وأغلاها أثرًا — لأن ما تخافه الشاشة الصغيرة في نفوس مشاهديها أكبر من أي ميزانية. هذه جدار القشعريرة عندنا: كلاسيكيات سقطت في الملكية العامة فصارت كوابيس الجميع.",
    layout: "wall",
    tint: "red",
    members: ["night-of-the-living-dead", "carnival-of-souls", "house-on-haunted-hill", "the-last-man-on-earth", "white-zombie", "plan-9-from-outer-space", "reefer-madness"],
    homeOrder: 5,
  },
  {
    slug: "beginnings",
    titleAr: "البدايات",
    titleLat: "Beginnings",
    essayAr:
      "١٩٠٢–١٩٢٥: سنوات كانت فيها السينما تكتشف كل شيء للمرة الأولى — أن تقصّ، أن تكذب بجمال، أن تخلق وحوشًا من كرتون وأن تبيع تذاكر إلى القمر. الأفلام هنا قصيرة أحيانًا وصامتة دائمًا، لكنها اللحظة التي تعلمت فيها الصورة الحركةَ الكلامَ.",
    layout: "feature",
    tint: "sepia",
    members: ["trip-to-the-moon", "lost-world", "one-week", "cops"],
    homeOrder: 6,
  },
  {
    slug: "open-workshop",
    titleAr: "الورشة المفتوحة",
    titleLat: "The Open Workshop",
    essayAr:
      "ليست كل الأفلام الحرة قديمة: مؤسسة بلندر تصنع منذ ٢٠٠٦ أفلام تحريك بمعايير الاستوديوهات وتنشرها برخصة المشاع الإبداعي CC BY، مع مصادرها الكاملة. الورشة المفتوحة رفٌّ للمستقبل: أفلام يحق لك مشاهدتها ونسخها وإعادة صناعتها — ونسبتها لصانعيها فقط.",
    layout: "wide",
    tint: "green",
    members: ["sintel", "big-buck-bunny", "tears-of-steel", "cosmos-laundromat", "elephants-dream"],
    homeOrder: 4,
  },
  {
    slug: "free-hollywood",
    titleAr: "هوليوود الحرة",
    titleLat: "Free Hollywood",
    essayAr:
      "أستوديوهات نسيت تجديد حقوقها، وموزعون أضاعوا إشعارات الحقوق، فأصبحت روائع كاملة ملكًا عامًا بحكم القانون والإهمال معًا. هذه المجموعة حكاية عن كيفية تحرر الأفلام أحيانًا: ليس بالكرم، بل بالأخطاء البيروقراطية التي صنعت ذاكرة مشتركة.",
    layout: "rail",
    tint: "sepia",
    members: ["his-girl-friday", "detour", "doa", "angel-on-my-shoulder", "the-snows-of-kilimanjaro"],
    onHome: false,
  },
] as const;

export const collections: Collection[] = collectionSchema.array().parse(rawCollections);
