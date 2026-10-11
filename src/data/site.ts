/**
 * The masthead, the mission, and the small print — one place, no scattering.
 * Every string here is honest about what خيال actually is: a free, legal,
 * Arabic-first archive of public-domain and openly-licensed cinema.
 */
export const site = {
  nameAr: "خيال",
  nameLat: "KHAYAL",
  taglineAr: "دار الأفلام المفتوحة",
  taglineLat: "The Open Film Archive",
  descriptionAr:
    "خيال منصة عربية لمشاهدة روائع السينما الملكية العامة والأفلام المرخّصة بمشاع إبداعي — قانونية بالكامل، مجانية، ومنسّقة بعناية. من ظلال التعبيرية الألمانية إلى ورشة التحريك المفتوحة.",
  /** The seal that stamps every poster: archive index prefix. */
  archivePrefix: "KH",
  /** Honest attribution shown in the footer and on every watch page. */
  hosts: [
    {
      name: "Internet Archive",
      url: "https://archive.org",
      roleAr: "استضافة وتشغيل أفلام الملكية العامة",
    },
    {
      name: "Blender Foundation",
      url: "https://studio.blender.org",
      roleAr: "الأفلام المفتوحة · رخصة المشاع الإبداعي CC BY",
    },
  ],
  /* URLs stay Latin — the convention of every Arabic streaming product;
     the interface is Arabic end to end. */
  nav: [
    { href: "/", labelAr: "البرنامج" },
    { href: "/films", labelAr: "أفلام" },
    { href: "/series", labelAr: "مسلسلات" },
    { href: "/collections", labelAr: "مجموعات" },
    { href: "/list", labelAr: "قائمتي" },
    { href: "/about", labelAr: "حول" },
  ],
  /** The promise, printed on the paper section of /حول. */
  missionAr: [
    "السينما ذاكرة، والذاكرة لا تُحتكر. كل عمل في هذا الأرشيف إما ملكية عامة أو مرخّص بمشاع إبداعي — تشاهده مجانًا وبشكل قانوني، بلا اشتراك وبلا روابط مسروقة.",
    "ننسّق البرامج كما تُنسّق صالات السينما الفنية: مجموعة تشرح مجموعة، وفيلم يجرّ فيلمًا. البطاقات الفنية من تصميمنا — لا ندّعي أنها الملصقات الأصلية، ولا نزيّف عملًا لم نحصل على حقوقه.",
    "الشاشة العربية قادمة: نعمل على ترميم وترخيص كلاسيكيات السينما العربية، ولن تعرض المنصة عملًا عربيًا واحدًا قبل أن تملك حق عرضه. حتى ذلك الحين، نقولها صراحة: قريبًا.",
  ],
} as const;

export type SiteNav = (typeof site.nav)[number];
