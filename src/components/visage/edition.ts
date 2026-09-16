/**
 * L'ÉDITION VISAGE — the art-direction layer of the Visage nocturne.
 *
 * The catalogue (products, concerns, categories, counts) always comes from
 * the database; this file only carries the sentences the maison says over
 * them. Every string here is presentation, never data.
 */
/**
 * The nocturne's micro-caps — the house eyebrow re-struck in champagne on
 * the dark, as explicit classes (the shared `eyebrow` utility carries the
 * day's colour and is never fought over).
 */
export const NOIR_EYEBROW =
  "text-[0.64rem] font-bold uppercase tracking-[0.3em] leading-[1.4] text-cine-gold";

export const VISAGE_EDITION = {
  opening: {
    kicker: "Visage — Univers",
    lines: ["Chaque peau", "a son rituel."] as [string, string],
    cta: "Explorer le visage",
  },
  sommaire: {
    label: "Sommaire",
    chapters: [
      { id: "rituel", label: "Le rituel" },
      { id: "besoins", label: "Par besoin" },
      { id: "edito", label: "L'éditorial" },
      { id: "collections", label: "Les collections" },
      { id: "rayon", label: "Tout le rayon" },
      { id: "conseil", label: "Conseil" },
    ],
  },
  ritual: {
    kicker: "Le geste premier",
    shelf: "La suite du rituel",
    seeAll: "Tout le comptoir",
  },
  concerns: {
    kicker: "Par besoin",
    lines: ["Choisir", "son rituel."] as [string, string],
    hint: "Dites-nous ce que votre peau demande : le rayon entier se filtre et ne garde que ce qui y répond.",
    care: "soins",
  },
  editorial: {
    kicker: "L'éditorial",
    caption: "Le geste du soir",
    title: "La peau se répare la nuit.",
    body: "Quand la lumière tombe, la peau cesse de se défendre et commence de se reconstruire. C'est l'heure des textures riches, des actifs patients, du geste lent. Le soir n'est pas la fin du rituel — c'est son sommet.",
    cta: "Le rituel du soir, en deux gestes",
  },
  collections: {
    kicker: "Les collections",
    title: "Six chambres,",
    titleItalic: "un même soin.",
    refs: "références",
    ref: "référence",
  },
  gateway: {
    kicker: "Le rayon, en entier",
    lead: ["Les", "références du visage."] as [string, string],
    body: "Nettoyants, sérums, hydratants, anti-âge, contours des yeux, imperfections — chaque référence est choisie au comptoir, une par une, et conseillée par nos pharmaciens.",
  },
  listing: {
    refine: "Affiner",
    sortLabel: "Trier par",
    results: "références",
    result: "référence",
    see: "Voir les {n} références",
  },
  conseil: {
    kicker: "Conseil",
    title: ["Votre peau mérite", "son propre rituel."] as [string, string],
    lead: "Un doute ?",
    body: "Nos pharmaciennes lisent votre peau avant de proposer un produit. Écrivez-nous, appelez-nous ou passez au comptoir — la réponse est la même : juste, mesurée, sans promesse excessive.",
    cta: "Demander conseil",
  },
  chapters: {
    kicker: "La suite du film",
  },
} as const;
