import "server-only";

/**
 * THE SEVEN ROOMS — an atmosphere per universe.
 *
 * The palette never changes; what changes is how the room is lit and how the
 * composition is built. Each universe gets a motif (the shape language of its
 * opening plate), a lighting direction and the register of its title, so a
 * visitor feels they have walked into a different part of the same house
 * rather than into a different website.
 */
export type Motif = "light" | "architecture" | "fluid" | "precision" | "warmth" | "botanical" | "clarity";

export type UniverseAtmosphere = {
  motif: Motif;
  /** Direction the light comes from, as a pair of percentages. */
  light: [number, number];
  /** Which side the opening plate sits on. */
  side: "left" | "right";
  /** Sentence used under the title when the universe has no story yet. */
  promise: string;
  /** How the title is set. */
  register: "italic" | "roman";
};

export const ATMOSPHERES: Record<string, UniverseAtmosphere> = {
  visage: {
    motif: "light",
    light: [72, 12],
    side: "right",
    promise: "Un teint tenu, saison après saison, par des formules dosées avec justesse.",
    register: "italic",
  },
  corps: {
    motif: "architecture",
    light: [22, 18],
    side: "left",
    promise: "Des textures fondantes et des gestes simples, pour une peau du Sud qui demande de l'eau.",
    register: "roman",
  },
  cheveux: {
    motif: "fluid",
    light: [60, 26],
    side: "right",
    promise: "Tout commence par un cuir chevelu apaisé — le reste suit.",
    register: "italic",
  },
  solaire: {
    motif: "clarity",
    light: [50, 6],
    side: "right",
    promise: "Sous nos latitudes, se protéger n'est pas une option : c'est un réflexe quotidien.",
    register: "roman",
  },
  "bebe-maman": {
    motif: "warmth",
    light: [34, 16],
    side: "left",
    promise: "La douceur comme seule exigence, pour les premières années et pour la maternité.",
    register: "italic",
  },
  complements: {
    motif: "botanical",
    light: [78, 30],
    side: "right",
    promise: "Compléter sans excès : des actifs d'origine contrôlée, aux dosages utiles.",
    register: "roman",
  },
  hygiene: {
    motif: "precision",
    light: [46, 10],
    side: "right",
    promise: "Les essentiels du quotidien, retenus pour leur tolérance — jamais pour leur emballage.",
    register: "roman",
  },
};

export function atmosphereFor(slug: string): UniverseAtmosphere {
  return (
    ATMOSPHERES[slug] ?? {
      motif: "light",
      light: [50, 12],
      side: "right",
      promise: "Une sélection courte, conseillée par nos pharmaciens.",
      register: "italic",
    }
  );
}
