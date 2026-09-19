import type { MetadataRoute } from "next";

/**
 * LA CARTE — what the house declares to a handset that installs it.
 *
 * Deliberately small: the shop is a shop, not an application pretending to be
 * one. It opens at the door (`/`), in its own surface, in French of Tunisia,
 * left to right. Colours are the filmed ground and the day ground of the
 * house, so the splash matches the first paint instead of flashing white.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cléopâtre — Espace Santé Beauté",
    short_name: "Cléopâtre",
    description:
      "Officine dermo-cosmétique à Ezzahra et Hammam-Lif. Peau, cheveu, corps, soleil, bébé : des produits authentiques, sélectionnés et conseillés par nos pharmaciens, livrés partout en Tunisie.",
    lang: "fr-TN",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    categories: ["shopping", "health", "beauty"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
