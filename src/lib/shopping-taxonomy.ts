export const SKIN_TYPE_FILTERS = [
  { slug: "oily", label: "Oily", fr: "Peau grasse", concerns: ["imperfections", "acne"], query: "sébum" },
  { slug: "dry", label: "Dry", fr: "Peau sèche", concerns: ["peau-seche", "hydratation", "secheresse"], query: "baume" },
  { slug: "sensitive", label: "Sensitive", fr: "Peau sensible", concerns: ["peau-sensible", "peau-atopique"], tolerances: ["peauAtopique", "yeuxSensibles"] },
  { slug: "combination", label: "Combination", fr: "Peau mixte", concerns: ["hydratation", "imperfections"], query: "fluide" },
  { slug: "mature", label: "Mature", fr: "Peau mature", concerns: ["anti-age"], query: "âge" },
] as const;

export const ROUTINE_STEP_FILTERS = [
  { slug: "cleanser", label: "Cleanser", fr: "Nettoyant", terms: ["nettoy", "gel", "moussant", "micellaire", "shampoo"] },
  { slug: "serum", label: "Serum", fr: "Sérum", terms: ["sérum", "serum", "vitamine", "hyaluron", "ampoule"] },
  { slug: "moisturizer", label: "Moisturizer", fr: "Hydratant", terms: ["crème", "creme", "baume", "hydra", "lait"] },
  { slug: "spf", label: "SPF", fr: "SPF", terms: ["spf", "solaire", "anthelios", "photoderm", "vinosun"], concerns: ["protection-solaire"] },
  { slug: "treatment", label: "Treatment", fr: "Traitement", terms: ["traitement", "cica", "anti", "correct", "effaclar", "sérum"] },
] as const;

export const AGE_FILTERS = [
  { slug: "baby", label: "Baby", fr: "Bébé", maxMonths: 36, query: "bébé" },
  { slug: "teen", label: "Teen", fr: "Ado", minMonths: 120, query: "imperfections" },
  { slug: "adult", label: "Adult", fr: "Adulte", minMonths: 216 },
  { slug: "family", label: "Family", fr: "Famille", query: "famille" },
] as const;

export const FINISH_FILTERS = [
  { slug: "matte", label: "Matte", fr: "Mat", terms: ["mat", "matifiant", "nude"] },
  { slug: "glowy", label: "Glowy", fr: "Éclat", terms: ["éclat", "glow", "vitamine", "boost"] },
  { slug: "invisible", label: "Invisible", fr: "Invisible", terms: ["invisible", "fluide", "fusion"] },
  { slug: "rich", label: "Rich", fr: "Riche", terms: ["riche", "baume", "nourrissant", "réparateur"] },
] as const;

export const CONCERN_LANDING_GROUPS = [
  { slug: "acne", title: "Acne and blemishes", fr: "Acné & imperfections", query: "imperfections", href: "/boutique?concerns=imperfections,acne" },
  { slug: "pigmentation", title: "Pigmentation and dark spots", fr: "Taches & pigmentation", query: "taches", href: "/boutique?concerns=taches&sort=featured" },
  { slug: "hair-loss", title: "Hair loss", fr: "Chute de cheveux", query: "chute", href: "/boutique?concerns=chute-de-cheveux&sort=featured" },
  { slug: "dryness", title: "Dryness and barrier repair", fr: "Sécheresse & barrière", query: "peau sèche", href: "/boutique?concerns=peau-seche,secheresse,hydratation" },
  { slug: "baby-care", title: "Baby care", fr: "Bébé", query: "bébé", href: "/univers/bebe-maman" },
  { slug: "sun", title: "Sun protection", fr: "Protection solaire", query: "spf", href: "/boutique?step=spf&sort=featured" },
  { slug: "sensitive", title: "Sensitive skin", fr: "Peau sensible", query: "peau sensible", href: "/boutique?skin=sensitive" },
  { slug: "anti-age", title: "Ageing and firmness", fr: "Anti-âge & fermeté", query: "anti âge", href: "/boutique?skin=mature&sort=rating" },
] as const;

export const SEARCH_SYNONYMS: Record<string, string> = {
  boutons: "imperfections",
  bouton: "imperfections",
  acne: "imperfections",
  acné: "imperfections",
  ecran: "spf solaire",
  écran: "spf solaire",
  sunscreen: "spf solaire",
  sunblock: "spf solaire",
  seche: "peau sèche hydratation",
  sèche: "peau sèche hydratation",
  tache: "pigmentation taches",
  taches: "pigmentation taches",
  rides: "anti âge",
  hairloss: "chute cheveux",
};

export type SkinTypeSlug = (typeof SKIN_TYPE_FILTERS)[number]["slug"];
export type RoutineStepSlug = (typeof ROUTINE_STEP_FILTERS)[number]["slug"];
