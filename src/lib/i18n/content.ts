import type { Locale } from "./config";
import "server-only";

/**
 * CONTENT IN THE TWO TOUNSES.
 *
 * The catalogue belongs to the laboratories — product *names* stay as written
 * (a « Sérum Vinoperfect » is a proper noun in any language). Everything the
 * house itself says about that catalogue — the universes, the categories, the
 * needs, the short descriptions, the standing advice texts — is mirrored here,
 * keyed by slug, so the translation layer is pure data and the pages stay
 * pure composition.
 *
 * A product's long `description`, `ingredients` and `howToUse` are generated
 * from fixed templates in the seed; we regenerate them the same way, from the
 * translated short line. No French leaks into the Tunisian pages that way.
 */

type L10 = { tn: string; tna: string };

/* ── Universes & categories ─────────────────────────────────────────────── */
export const CATEGORY_I18N: Record<string, { name?: L10; description?: L10; story?: L10 }> = {
  visage: {
    name: { tn: "Wéj", tna: "الوجه" },
    description: { tn: "Nettoyants, sérums, crèmes wel 3inâyât mawḍû3a.", tna: "منظّفات، سيرومات، كريمات وعناية موضوعة." },
    story: {
      tn: "El wéj yetda3wa bel ṣabr. Ejtanayna 3inâyât dqaîqa, mizânha mezyen, bech jeldek yeb9â metwâzin kol fasl.",
      tna: "الوجه يتداوى بالصبر. خلّينا عنايات دقيقة، ميزانها مليح، باش جلدك يبقى متوازن كل فصل.",
    },
  },
  corps: {
    name: { tn: "Ejlism", tna: "الجسم" },
    description: { tn: "Hydratation, douch, yeddayn wel 3inâyât khaṣṣa.", tna: "ترطيب، دوش، اليدين وعناية خاصّة." },
    story: {
      tn: "Rituel ejlism kol youm, mebnî lel jeld et-tounsî: hydratation 3amî9a, textures yedoboû, rî7a khfîfa.",
      tna: "روتين الجسم كل يوم، مبني للجلد التونسي: ترطيب عميق، تكسطةري تسيح، ريحة خفيفة.",
    },
  },
  cheveux: {
    name: { tn: "Ech-cho3r", tna: "الشعر" },
    description: { tn: "Champooings, 3inâyât, te9qoû wel 9awra.", tna: "شامبوانغ، عناية، التساقط وفروة الرأس." },
    story: {
      tn: "Cho3r ezbân yebda men 9awra mohadda. Ekhtiyârna yemchi m3a nabtât wel-dermatolojie.",
      tna: "شعر صحّ يبدأ من فروة مهدّية. اختياراتنا تمشي مع النبات والجلد.",
    },
  },
  solaire: {
    name: { tn: "Solaire", tna: "الشمس" },
    description: { tn: "Wiqâya 9wiya, ba3d ech-chems wel auto-bronzant.", tna: "وقاية عالية، بعد الشمس والبرونزاج." },
    story: {
      tn: "Te7t ech-chems et-toûnsîya, el wiqâya mouch ikhtiyâr. Textures wâdha7, yet9awmoû el maâ, lel âïla kamla.",
      tna: "تحت الشمس التونسية، الوقاية ماشي اختيار. تكسطةري شفّافة، تصمد في الما، للعائلة كاملة.",
    },
  },
  "bebe-maman": {
    name: { tn: "Qseksâr wel Omm", tna: "الرضيع والأم" },
    description: { tn: "Toilette, change, hydratation wel ḥebel.", tna: "تنظيف، حفاضات، ترطيب والحمل." },
    story: {
      tn: "El lutf howa el mezyan wekhed. Formoules âmina, men eçel tabî3î, lel seneïn el oulal wel-ḥebel.",
      tna: "اللطافة هي المعيار وحدّها. تركيبة آمنة، من أصل طبيعي، لأول سنين والحمل.",
    },
  },
  complements: {
    name: { tn: "Compléments", tna: "المكمّلات" },
    description: { tn: "Nchât, immunité, nem wel jamâl men eddâhel.", tna: "الحيوية، المناعة، النوم والجمال من الداخل." },
    story: {
      tn: "Nkammel bel doun isrâf. Aktîf men eçel me3rifa, dozes naf3a, wel nasiḥa men el pharmaciens.",
      tna: "نكمّل بلا إسراف. نشيط من أصل معروف، جرعات نافعة، والنصيحة من الصيدلية.",
    },
  },
  hygiene: {
    name: { tn: "Nadâfa wel 7al", tna: "النظافة والراحة" },
    description: { tn: "Sen wel fomm, intime, déodorants wel assâsiyyât.", tna: "الأسنان، الحمّام، مزيلات الرائحة والأساسيات." },
    story: {
      tn: "Assâsiyyât kol youm, mkhtâra leṭlâfha wel 7âja mte3ha, bel doun azâ2d.",
      tna: "أساسيات كل يوم، مخيّرة للتحمّل وللنفع، بلا زوائد.",
    },
  },
  "nettoyants-demaquillants": { name: { tn: "Nettoyants wel démaquillants", tna: "تنظيف وإزالة المكياج" } },
  serums: { name: { tn: "Sérums", tna: "السيرومات" } },
  hydratants: { name: { tn: "Crèmes hydratantes", tna: "كريمات مرطّبة" } },
  "anti-age": { name: { tn: "Anti-âge", tna: "مضادّ التجاعيد" } },
  "contour-des-yeux": { name: { tn: "Daour el 3eyoun", tna: "محيط العين" } },
  "peaux-a-imperfections": { name: { tn: "Jeld fîh l-ḥabâb", tna: "جلد الحباب" } },
  "hydratants-corps": { name: { tn: "Hydratants ejlism", tna: "ترطيب الجسم" } },
  "douche-bain": { name: { tn: "Douch wel hammâm", tna: "دوش وحمام" } },
  "mains-pieds": { name: { tn: "El kaff wel qadem", tna: "اليدين والقدمين" } },
  "vergetures-fermete": { name: { tn: "Vergetures wel chedd", tna: "التشققات والشدّ" } },
  shampooings: { name: { tn: "Champooings", tna: "شامبوانغ" } },
  "apres-shampooings-masques": { name: { tn: "Après-champooing wel maçques", tna: "بلسم وأقنعة" } },
  "anti-chute": { name: { tn: "Edad te9oû ech-cho3r", tna: "ضدّ التساقط" } },
  "cuir-chevelu-sensible": { name: { tn: "9awra 7âssa", tna: "فروة حسّاسة" } },
  "protection-visage": { name: { tn: "Wiqâyet el wéj", tna: "وقاية الوجه" } },
  "protection-corps": { name: { tn: "Wiqâyet ejlism", tna: "وقاية الجسم" } },
  "apres-soleil": { name: { tn: "Ba3d ech-chems", tna: "بعد الشمس" } },
  enfants: { name: { tn: "Sghayar", tna: "الأطفال" } },
  "toilette-bebe": { name: { tn: "Toilette qseksâr", tna: "تنظيف الرضيع" } },
  change: { name: { tn: "Change", tna: "الحفاضات" } },
  "soins-maman": { name: { tn: "3inâyet el omm", tna: "عناية الأم" } },
  "vitalite-immunite": { name: { tn: "Nchât wel immunité", tna: "حيوية ومناعة" } },
  "sommeil-stress": { name: { tn: "Nem wel trîk", tna: "نوم وتوتر" } },
  "beaute-in-out": { name: { tn: "Jamâl men dda wel barra", tna: "جمال من الداخل والخارج" } },
  digestion: { name: { tn: "Ma3da", tna: "هضم" } },
  "bucco-dentaire": { name: { tn: "Sen wel fomm", tna: "أسنان وفم" } },
  "hygiene-intime": { name: { tn: "Nadâfa intime", tna: "نظافة حمّام" } },
  deodorants: { name: { tn: "Déodorants", tna: "مزيلات الرائحة" } },
  "premiers-soins": { name: { tn: "Premiers soins", tna: "إسعافات أولى" } },
};

/* ── Concerns (besoins) ─────────────────────────────────────────────────── */
export const CONCERN_I18N: Record<string, { name: L10; intro: L10 }> = {
  "peau-sensible": {
    name: { tn: "Jeld 7âss", tna: "جلد حسّاس" },
    intro: { tn: "El jeld el 7âss yetraddé ghedâ: e77merâr, chadd, 9a7a. El qâ3da: moins composants, plus tolérance.", tna: "الجلد الحسّاس يردّى على عينه: حمرة، شدّة، حكّة. القاعدة: براّي أقل، تحمّل أكثر." },
  },
  "peau-seche": {
    name: { tn: "Jeld naçef", tna: "جلد ناشف" },
    intro: { tn: "El jeld en-naçef yn9oçou ech-chahm. Nerrjou3ou el barrièr bel céramides, karité wel glïcérine.", tna: "الجلد الناشف ينقصه الدهن. نرجّع الحاجز بالسيراميد، الشيا والزيت." },
  },
  acne: {
    name: { tn: "Ḥabâb wel acné", tna: "حباب وبشرة دهنية" },
    intro: { tn: "Nnassem ez-zeboûm, ta9chîr leflîf, hydratation ma t-seddach el pores: tlâth asâtin jeld net.", tna: "تنظيم الزهم، تقشير لطيف، ترطيب ما يسدّش المسام: ثلاث ركائز لبشرة نقية." },
  },
  "anti-age": {
    name: { tn: "Anti-âge", tna: "مضادّ الشيخوخة" },
    intro: { tn: "Rétinol, vitamine C, acide hyaluronique we SPF kol sbâh: el assâs, bel doun wboûd kbâr.", tna: "ريتينول، فيتامين س، حمض الهيالورونيك و SPF كل صباح: الأساس، بلا مبالغة." },
  },
  taches: {
    name: { tn: "Et-tâaf", tna: "التصوغات" },
    intro: { tn: "Et-tâaf tetwwaqé awwal bel SPF 50+. El aktîf el mokhafef ya99ed el ba9i, bel istimrâr.", tna: "التصوغات تتقى أول بـ SPF 50+. النشيط المخرّف يكملّ، بالاستمرار." },
  },
  hydratation: {
    name: { tn: "Hydratation", tna: "ترطيب" },
    intro: { tn: "Jeld mtrabbeh howa jeld râda2, yetla3 w a7san me7mi.", tna: "جلد مرطّب هو جلد مرتاح، نضر وأحسن محمي." },
  },
  "chute-de-cheveux": {
    name: { tn: "Te9qoû ech-cho3r", tna: "سقوط الشعر" },
    intro: { tn: "Fasli wala mel trîk, et-te9qoû yetda3wa b koûr: compléments mawḍû3în wel sérum ye7mî el 9awra.", tna: "فصلي أو من التوتّر، التساقط يتداوى بكور: مكمّلات موضوعة وسيروم يحامي الفروة." },
  },
  pellicules: {
    name: { tn: "Pellicule", tna: "قشرة" },
    intro: { tn: "Nahddoû el 9awra wennessamoû el flores: el maftâ7 lel 9awra net we bâ9ye.", tna: "نهدّي الفروة وننظّم الجراثيم: مفتاح فروة نظيفة وطاويلة." },
  },
  "protection-solaire": {
    name: { tn: "Wiqâya mel chems", tna: "حماية من الشمس" },
    intro: { tn: "SPF 50+ kol sbâh howa aktar geste contre el khṭoût wel tâaf li yekhdem.", tna: "SPF 50+ كل صباح هو أحسن حركة ضدّ التجاعيد والتصوغات." },
  },
  immunite: {
    name: { tn: "Immunité wel nchât", tna: "مناعة وحيوية" },
    intro: { tn: "Vitamine C, D, zinc wel probiotiques yesna3oû el defâ3 fî zman et-ta3b.", tna: "فيتامين س، د، زنك وبروبيوتيك يدعّموا الدفاع في وقت التعب." },
  },
  sommeil: {
    name: { tn: "Nem wel trîk", tna: "نوم وتوتر" },
    intro: { tn: "Mélatonine, magnésium wel 3echbâb el mohaddi a3lâ nem yesna3 rekwek.", tna: "ميلاتونين، مغنيزيوم ومهدّئات نباتية تعين على نوم عميق." },
  },
  "grossesse": { name: { tn: "Ḥebel", tna: "حمل" }, intro: { tn: "El jeld fi zman el ḥebel yetbeddel: yetcheddes, yetwassa9 we yetsa77er. 3inâya b eçel âmne, wahda wekhed.", tna: "الجلد في الحمل يتبدّل: يتشدّد، يتوسّع ويتحسّس. عناية بأمان المصدر، وحدة." } },
  "secheresse": { name: { tn: "Nchaaf ejlism", tna: "جفاف الجسم" }, intro: { tn: "Jeld el ejlism en-naçef yetloub baume ba3d el hammâm wekhed, 9bel ma tenchef el 9ichra.", tna: "جسم ناشف يطلب بلسم بعد الحمام بس، قبل ما تنشف البيشة." } },
  "peau-atopique": { name: { tn: "Jeld atoubik", tna: "جلد أتوبي" }, intro: { tn: "Krîz yetjaoudoû: relipidation kol youm, savon wela abadan, wel barde wel kharâf yetet7âsebou.", tna: "نوبات تعاود: ترطيب يومي، صابون أبدًا، والبرد والحرارة يتحاربو." } },
  "fermete": { name: { tn: "El chedd", tna: "الشدّ" }, intro: { tn: "Massage si3âd, collagène we do3a mte3 el aad. El jeld yerja3 yetched ki nchaddou bel âda wela bel 9aḍâya.", tna: "مساج تصاعدي، كولاجين وصبر. الجلد يرجع يشدّ كي نعدّو بالعادات لا بالقضايا." } },
  "cuir-chevelu-sensible": { name: { tn: "9awra 7âssa", tna: "فروة حساسة" }, intro: { tn: "Tehrîj, wja3, w dja3da: shampoings sans sulfates wel lotion mohaddiâ.", tna: "تهيج، ألم وحكّة: شامبوان بلا سلفات ولوسيون مهدّئ." } },
  "digestion": { name: { tn: "El ma3da", tna: "الهضم" }, intro: { tn: "Kharîr el 3echbâb, probiotiques wel artîchanô: el ma3da trja3 khedma behi.", tna: "منقوع الأعشاب، بروبيوتيك وأرتيشو: المعدة ترجع تخدم مليح." } },
  "hygiene-intime": { name: { tn: "Nadâfa intime", tna: "نظافة خاصة" }, intro: { tn: "pH mezyen, syndet leflîf: el ta3âod el assâs lel 7al wel éqitîl.", tna: "pH متوازن، سيندي لطف: التعود الأساس للراحة والتوازن." } },
  "bucco-dentaire": { name: { tn: "Sen wel fomm", tna: "أسنان وفم" }, intro: { tn: "Dentifrice bel fluour, brousette soupl, we fil dentaire kel leyl: 3 inâya wâ9îa.", tna: "معجون بالفلور، فرشاة ناعمة وخيط كل ليلة: عناية واقية." } },
};

/** Translate a category row (name + description + story) into the active locale. */
export function localeCategory<T extends { slug: string; name: string; description: string | null; story: string | null }>(
  row: T,
  locale: Locale,
): T {
  const tr = CATEGORY_I18N[row.slug];
  if (!tr || locale === "fr") return row;
  const key = locale === "tn" ? "tn" : "tna";
  return {
    ...row,
    name: tr.name?.[key] ?? row.name,
    description: tr.description ? tr.description[key] : row.description,
    story: tr.story ? tr.story[key] : row.story,
  };
}

export function localeConcern<T extends { slug: string; name: string; intro: string | null }>(row: T, locale: Locale): T {
  const tr = CONCERN_I18N[row.slug];
  if (!tr || locale === "fr") return row;
  const key = locale === "tn" ? "tn" : "tna";
  return { ...row, name: tr.name[key], intro: tr.intro[key] };
}

/* ── Products: short line + generated long copy ─────────────────────────── */
import { PRODUCT_I18N, productHowToUseTn, productLongTn, INGREDIENTS_TN } from "./product-copy";
export { PRODUCT_I18N };

/** Pull a translated short-description for a slug (empty ⇒ fall back to FR). */
export function productShortTn(slug: string, locale: Locale): string | null {
  const t = PRODUCT_I18N[slug];
  if (!t) return null;
  return locale === "tn" ? t.tn : locale === "tn-arab" ? t.tna : null;
}

/** A product-card row in the active tongue (name is a proper noun ⇒ untouched). */
export function translateCard<T extends { slug: string; shortDescription: string | null }>(p: T, locale: Locale): T {
  if (locale === "fr") return p;
  const t = PRODUCT_I18N[p.slug];
  if (!t) return p;
  return { ...p, shortDescription: locale === "tn" ? t.tn : t.tna };
}

/**
 * A full PDP payload. Long-form fields in the seed are generated from fixed
 * templates; we regenerate them from the translated short line so the page
 * never drops back into French mid-ritual.
 */
export function translateProductFull<T extends {
  slug: string; shortDescription: string | null; description: string | null;
  ingredients: string | null; howToUse: string | null;
}>(p: T, locale: Locale, universeSlug: string): T {
  if (locale === "fr") return p;
  const t = PRODUCT_I18N[p.slug];
  const script = locale === "tn" ? "tn" : "tn-arab";
  const short = t ? (script === "tn" ? t.tn : t.tna) : p.shortDescription;
  return {
    ...p,
    shortDescription: short,
    description: t ? productLongTn(p.slug, short ?? "", script, universeSlug) : p.description,
    howToUse: productHowToUseTn(script, universeSlug),
    ingredients: INGREDIENTS_TN[script][universeSlug === "complements" ? "complements" : "cosm"],
  };
}

/** Translate a batch of card rows in the active tongue. */
export function translateCardsAll<T extends { slug: string; shortDescription: string | null }>(rows: T[], locale: Locale): T[] {
  if (locale === "fr") return rows;
  return rows.map((r) => translateCard(r, locale));
}
