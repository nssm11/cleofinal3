/**
 * LE QUESTIONNAIRE — la partie **sans base de données**.
 *
 * Ce fichier est importé par un composant client : il ne doit donc toucher ni
 * `db`, ni `pg`, ni aucun module serveur. Le couper en deux n'est pas une
 * coquetterie — sans cette séparation, Turbopack tire `pg` dans le bundle du
 * navigateur et la page tombe avec « Can't resolve 'tls' ».
 *
 * LA CONSEILLÈRE — quatre questions, un conseil tenu.
 *
 * Le parti pris : un quiz de parapharmacie n'est pas un entonnoir de vente.
 * Quatre questions seulement, aucune donnée superflue, et un conseil qui
 * **explique pourquoi** — une recommandation sans raison se lit comme une
 * publicité, et la cliente le sent.
 *
 * Le barème est déclaratif et lisible ici, pas enfoui dans un algorithme :
 * chaque réponse pose des priorités (concerns pondérés) et une contrainte
 * (peau sensible ⇒ écarter ce qui n'est pas tolérant). On peut donc relire ce
 * fichier et savoir exactement ce que le site conseille.
 */

export type AdvisorQuestion = {
  id: string;
  /** La question, telle qu'elle est posée. */
  ask: string;
  hint?: string;
  options: { value: string; label: string; detail?: string }[];
};

/** Priorités : slug de préoccupation + poids apporté par cette réponse. */
export type Priority = { concern: string; weight: number };

export type AdvisorAnswers = Record<string, string>;

export const ADVISOR_QUESTIONS: AdvisorQuestion[] = [
  {
    id: "skin",
    ask: "Comment est votre peau, le plus souvent ?",
    hint: "Répondez pour l'ensemble du visage, pas pour une zone.",
    options: [
      { value: "normale", label: "Normale", detail: "Confortable, peu de brillance, peu de tiraillements" },
      { value: "seche", label: "Sèche", detail: "Tiraille, desquame parfois, manque de gras" },
      { value: "grasse", label: "Grasse", detail: "Brille sur tout le visage, pores visibles" },
      { value: "mixte", label: "Mixte", detail: "Zone T brillante, joues normales ou sèches" },
      { value: "sensible", label: "Sensible", detail: "Rougissait facilement, réagit aux nouveautés" },
    ],
  },
  {
    id: "priority",
    ask: "Quelle est votre priorité en ce moment ?",
    hint: "Une seule : c'est elle qui guide le conseil.",
    options: [
      { value: "acne", label: "Imperfections & acné" },
      { value: "anti-age", label: "Rides & fermeté" },
      { value: "taches", label: "Taches & éclat" },
      { value: "hydratation", label: "Hydratation & confort" },
      { value: "peau-sensible", label: "Rougeurs & tolérance" },
      { value: "protection-solaire", label: "Protection solaire" },
    ],
  },
  {
    id: "routine",
    ask: "Quand pouvez-vous vraiment prendre ce temps ?",
    hint: "Une routine tenue vaut mieux qu'une routine ambitieuse abandonnée.",
    options: [
      { value: "matin", label: "Le matin" },
      { value: "soir", label: "Le soir" },
      { value: "deux", label: "Matin et soir" },
    ],
  },
  {
    id: "scope",
    ask: "Jusqu'où voulez-vous aller ?",
    options: [
      { value: "essentiel", label: "L'essentiel", detail: "Deux à trois produits, pas plus" },
      { value: "complete", label: "Une routine complète", detail: "Quatre à six étapes" },
    ],
  },
];

/**
 * Le barème. Chaque réponse ajoute des priorités pondérées : la priorité
 * déclarée pèse le plus, le type de peau ajuste, et une peau sensible ajoute
 * systématiquement la tolérance — c'est la seule règle non négociable.
 */
const SKIN_PRIORITIES: Record<string, Priority[]> = {
  normale: [{ concern: "hydratation", weight: 2 }],
  seche: [
    { concern: "peau-seche", weight: 4 },
    { concern: "hydratation", weight: 3 },
  ],
  grasse: [
    { concern: "acne", weight: 4 },
    { concern: "hydratation", weight: 1 },
  ],
  mixte: [
    { concern: "hydratation", weight: 3 },
    { concern: "acne", weight: 1 },
  ],
  sensible: [
    { concern: "peau-sensible", weight: 5 },
    { concern: "hydratation", weight: 2 },
  ],
};

const PRIORITY_WEIGHT: Record<string, number> = {
  acne: 6,
  "anti-age": 6,
  taches: 6,
  hydratation: 6,
  "peau-sensible": 6,
  "protection-solaire": 6,
};

/** Combien de références conseiller, selon l'ambition déclarée. */
const SCOPE_LIMIT: Record<string, number> = { essentiel: 3, complete: 6 };

export function advisorPriorities(answers: AdvisorAnswers): { weights: Map<string, number>; limit: number; sensitive: boolean } {
  const weights = new Map<string, number>();
  const add = (slug: string, w: number) => weights.set(slug, (weights.get(slug) ?? 0) + w);

  const priority = answers.priority;
  if (priority && PRIORITY_WEIGHT[priority]) add(priority, PRIORITY_WEIGHT[priority]);

  for (const p of SKIN_PRIORITIES[answers.skin] ?? []) add(p.concern, p.weight);

  const sensitive = answers.skin === "sensible";
  if (sensitive) add("peau-sensible", 3);

  // Le soleil passe après tout le reste, mais il ne disparaît jamais : c'est le
  // seul geste dont un pharmacien ne dira jamais qu'il est facultatif.
  add("protection-solaire", 1);

  return { weights, limit: SCOPE_LIMIT[answers.scope] ?? 3, sensitive };
}

/**
 * Pourquoi ce conseil — une phrase par préoccupation retenue, dans l'ordre du
 * poids. C'est ce qui distingue un conseil d'une liste de produits.
 */
export function advisorRationale(answers: AdvisorAnswers, weights: Map<string, number>): string[] {
  const out: string[] = [];
  const skin = ADVISOR_QUESTIONS[0].options.find((o) => o.value === answers.skin);
  const priority = ADVISOR_QUESTIONS[1].options.find((o) => o.value === answers.priority);
  if (skin) out.push(`Votre peau ${skin.label.toLowerCase()} guide la texture des produits retenus.`);
  if (priority) out.push(`Votre priorité — ${priority.label.toLowerCase()} — classe les références.`);
  if (answers.skin === "sensible")
    out.push("Peau sensible : les formules parfumées ou très actives sont écartées d'office.");
  out.push("Une protection solaire ferme le conseil : sans elle, le reste se défait.");
  return out;
}

