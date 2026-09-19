export type IngredientFlag = "sensitive" | "pregnancy" | "acne" | "sun" | "allergen";

export type IngredientEntry = {
  slug: string;
  name: string;
  aliases: string[];
  family: string;
  summary: string;
  benefits: string[];
  cautions: string[];
  flags: IngredientFlag[];
};

export const INGREDIENT_ENTRIES: IngredientEntry[] = [
  {
    slug: "niacinamide",
    name: "Niacinamide",
    aliases: ["vitamin b3", "vitamine b3", "nicotinamide"],
    family: "Barrière & taches",
    summary: "Actif polyvalent pour calmer les rougeurs, soutenir la barrière cutanée et aider les marques pigmentaires.",
    benefits: ["Peaux sujettes aux imperfections", "Teint irrégulier", "Confort de la barrière"],
    cautions: ["Peut picoter à fort dosage sur peau irritée"],
    flags: ["sensitive", "acne"],
  },
  {
    slug: "retinol",
    name: "Rétinol",
    aliases: ["retinal", "retinyl palmitate", "vitamin a", "vitamine a"],
    family: "Renouvellement",
    summary: "Dérivé de vitamine A utilisé pour lisser le grain, les rides visibles et les marques.",
    benefits: ["Texture", "Signes de l'âge", "Imperfections adultes"],
    cautions: ["Photosensibilisant", "À introduire progressivement", "Caution grossesse et allaitement"],
    flags: ["pregnancy", "sun", "sensitive"],
  },
  {
    slug: "salicylic-acid",
    name: "Acide salicylique",
    aliases: ["salicylic acid", "bha", "beta hydroxy acid"],
    family: "Imperfections",
    summary: "BHA lipophile utile pour les pores, les points noirs et les brillances.",
    benefits: ["Pores", "Points noirs", "Excès de sébum"],
    cautions: ["Peut dessécher", "Éviter le contour des yeux", "Caution si peau très sensible"],
    flags: ["acne", "sensitive"],
  },
  {
    slug: "glycolic-acid",
    name: "Acide glycolique",
    aliases: ["glycolic acid", "aha", "alpha hydroxy acid"],
    family: "Éclat",
    summary: "AHA exfoliant qui aide l'éclat, la texture et certaines marques de surface.",
    benefits: ["Éclat", "Texture", "Taches superficielles"],
    cautions: ["Photosensibilisant", "Ne pas multiplier les exfoliants le même soir"],
    flags: ["sun", "sensitive"],
  },
  {
    slug: "vitamin-c",
    name: "Vitamine C",
    aliases: ["ascorbic acid", "acide ascorbique", "sodium ascorbyl phosphate", "ascorbyl glucoside"],
    family: "Antioxydant",
    summary: "Antioxydant pour l'éclat et le teint terne, souvent placé le matin sous SPF.",
    benefits: ["Éclat", "Teint terne", "Antioxydant"],
    cautions: ["Certaines formes piquent sur peau sensible"],
    flags: ["sensitive"],
  },
  {
    slug: "hyaluronic-acid",
    name: "Acide hyaluronique",
    aliases: ["hyaluronic acid", "sodium hyaluronate", "hydrolyzed hyaluronic acid"],
    family: "Hydratation",
    summary: "Humectant qui retient l'eau dans les couches superficielles et donne du confort.",
    benefits: ["Déshydratation", "Confort", "Peau repulpée"],
    cautions: ["À sceller avec une crème si l'air est très sec"],
    flags: ["sensitive"],
  },
  {
    slug: "ceramides",
    name: "Céramides",
    aliases: ["ceramide", "ceramide np", "ceramide ap", "ceramide eop"],
    family: "Barrière",
    summary: "Lipides de barrière utiles pour sécheresse, inconfort et peau fragilisée.",
    benefits: ["Barrière", "Sécheresse", "Peaux fragilisées"],
    cautions: ["Aucune alerte générale, vérifier la formule complète"],
    flags: ["sensitive"],
  },
  {
    slug: "benzoyl-peroxide",
    name: "Peroxyde de benzoyle",
    aliases: ["benzoyl peroxide", "peroxide benzoyle"],
    family: "Imperfections",
    summary: "Actif anti-imperfections puissant, souvent réservé aux usages ciblés.",
    benefits: ["Boutons inflammatoires", "Usage localisé"],
    cautions: ["Peut décolorer les textiles", "Desséchant", "Demander conseil si irritation"],
    flags: ["acne", "sensitive"],
  },
  {
    slug: "zinc-pca",
    name: "Zinc PCA",
    aliases: ["zinc pidolate", "zinc gluconate"],
    family: "Sébum",
    summary: "Actif d'équilibre souvent utilisé pour brillances, imperfections et cuir chevelu gras.",
    benefits: ["Brillance", "Pores", "Imperfections"],
    cautions: ["Peut être asséchant dans une formule très purifiante"],
    flags: ["acne"],
  },
  {
    slug: "fragrance",
    name: "Parfum / fragrance",
    aliases: ["parfum", "fragrance", "linalool", "limonene", "citral", "geraniol", "citronellol"],
    family: "Sensibilité",
    summary: "Composants parfumants agréables mais plus surveillés chez les peaux réactives.",
    benefits: ["Sensorialité"],
    cautions: ["Risque de réaction sur peau sensible", "Vérifier les allergènes listés"],
    flags: ["allergen", "sensitive"],
  },
  {
    slug: "avobenzone",
    name: "Avobenzone",
    aliases: ["butyl methoxydibenzoylmethane"],
    family: "Filtre UV",
    summary: "Filtre UVA utilisé dans de nombreuses protections solaires.",
    benefits: ["Protection UVA", "Photoprotection"],
    cautions: ["Vérifier la tolérance oculaire si yeux sensibles"],
    flags: ["sun"],
  },
  {
    slug: "octocrylene",
    name: "Octocrylène",
    aliases: ["octocrylene"],
    family: "Filtre UV",
    summary: "Filtre UV et stabilisateur de formule solaire.",
    benefits: ["Protection solaire", "Stabilité"],
    cautions: ["Peut gêner certaines peaux sensibles"],
    flags: ["sun", "sensitive"],
  },
];

export type RecallNotice = {
  id: string;
  title: string;
  severity: "info" | "watch" | "urgent";
  scope: string;
  publishedAt: string;
  body: string;
  action: string;
};

export const RECALL_NOTICES: RecallNotice[] = [
  {
    id: "R-2026-09-SPF",
    title: "Contrôle renforcé sur trois lots solaires",
    severity: "watch",
    scope: "Solaire visage et corps",
    publishedAt: "2026-09-12",
    body: "Les lots courts ou abîmés sont isolés avant vente. Aucun rappel consommateur actif dans la base de démonstration.",
    action: "Scanner le lot ou demander la vérification comptoir avant utilisation.",
  },
  {
    id: "R-2026-08-PUMP",
    title: "Pompes airless à vérifier",
    severity: "info",
    scope: "Crèmes airless sélectionnées",
    publishedAt: "2026-08-29",
    body: "Signalement logistique interne sur des pompes qui peuvent se bloquer. Produit non dangereux, échange possible si défaut constaté.",
    action: "Conserver le ticket ou le numéro de commande et contacter le support.",
  },
  {
    id: "R-2026-07-RET",
    title: "Caution renforcée rétinoïdes",
    severity: "urgent",
    scope: "Produits contenant des dérivés de vitamine A",
    publishedAt: "2026-07-18",
    body: "Les fiches avec rétinol, retinal ou rétinyl palmitate doivent porter une caution grossesse/allaitement claire.",
    action: "Suspendre en cas de doute et demander conseil avant usage.",
  },
];

export type FaqBlock = {
  question: string;
  answer: string;
  topic: string;
};

export const SEO_FAQS: FaqBlock[] = [
  {
    topic: "Stock",
    question: "Comment savoir si un produit est disponible avant de me déplacer ?",
    answer: "La page Stock live indique les unités par comptoir et signale les références basses ou en rupture.",
  },
  {
    topic: "Lots",
    question: "Puis-je vérifier une date de péremption en ligne ?",
    answer: "Oui, le vérificateur de lot accepte un SKU, un nom ou un numéro de lot et montre le statut connu.",
  },
  {
    topic: "Conseil",
    question: "L'analyse INCI remplace-t-elle un avis médical ?",
    answer: "Non. Elle repère des signaux de formule et invite à demander conseil quand une alerte apparaît.",
  },
  {
    topic: "Retrait",
    question: "Puis-je préparer un retrait sans payer en ligne ?",
    answer: "Oui, la réservation comptoir prépare une référence pour retrait, sans ajouter de paiement en ligne.",
  },
];

export type ConsentChoice = {
  key: string;
  label: string;
  description: string;
  required?: boolean;
};

export const CONSENT_CHOICES: ConsentChoice[] = [
  { key: "necessary", label: "Fonctionnel", description: "Panier, sécurité, session et préférences indispensables.", required: true },
  { key: "stock", label: "Alertes stock", description: "Messages liés aux retours en stock et produits suivis." },
  { key: "safety", label: "Alertes sécurité", description: "Rappels, lots, précautions et communications importantes." },
  { key: "marketing", label: "Conseils & lettres", description: "Newsletters, guides et sélections éditoriales." },
  { key: "analytics", label: "Mesure anonyme", description: "Mesure locale pour comprendre les pages utiles." },
];

export function normaliseText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function findIngredientMatches(text: string): IngredientEntry[] {
  const hay = normaliseText(text);
  return INGREDIENT_ENTRIES.filter((entry) => [entry.name, ...entry.aliases].some((alias) => hay.includes(normaliseText(alias))));
}
