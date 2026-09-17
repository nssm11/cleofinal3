import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, stores } from "@/db/schema";
import { CinematicHero } from "@/components/cinematic/CinematicHero";
import { CinematicManifesto } from "@/components/cinematic/CinematicManifesto";
import { CinematicChapterSkin } from "@/components/cinematic/CinematicChapterSkin";
import { CinematicAtelier } from "@/components/cinematic/CinematicAtelier";
import { CinematicHairBody } from "@/components/cinematic/CinematicHairBody";
import { CinematicUniverseShowcase } from "@/components/cinematic/CinematicUniverseShowcase";
import { CinematicSunSection } from "@/components/cinematic/CinematicSunSection";
import { CinematicFooter } from "@/components/cinematic/CinematicFooter";
import { CinematicProgress } from "@/components/cinematic/CinematicProgress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cléopâtre — Beauty in Ritual · Dermo-Cosmétique d'Officine",
  description:
    "Peau, cheveu, corps, solaire, bébé : la maison de dermo-cosmétique Cléopâtre à Ezzahra et Hammam-Lif. Soins d'exception sélectionnés par nos docteurs en pharmacie, livrés partout en Tunisie.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cléopâtre — Beauty in Ritual",
    description:
      "Une odyssée cinématographique : l'exigence dermo-cosmétique au service du rituel de beauté. Visage, corps, cheveux, soleil et maternité filmés en pleine lumière.",
    url: "/",
    images: ["/videos/posters/hero.jpg"],
  },
};

/**
 * LE FILM CLÉOPÂTRE — Rebuilt from the ground up.
 *
 * Sequence:
 *   01. VIDEO     — Cinematic Opening Hero (Full Viewport Film)
 *   02. CONTENT   — Le Manifeste de la Maison (La Vision & Le Comptoir)
 *   03. VIDEO     — Chapitre Visage (L'Équilibre Cutané)
 *   04. CONTENT   — L'Atelier Dermo-Cosmétique & Les Grandes Maisons
 *   05. VIDEO     — Chapitre Cheveux & Corps (Matière & Texture)
 *   06. UNIVERSE  — Les Sept Rituels de la Maison (Cinema Showcase Hub)
 *   07. VIDEO     — Chapitre Solaire (La Haute Défense Méditerranéenne)
 *   08. FOOTER    — Clôture & Crédits de la Maison (Boutiques & Bulletin)
 */
export default async function HomePage() {
  const [storeRows, rawUniverses] = await Promise.all([
    db.select().from(stores).where(eq(stores.isActive, true)),
    db.query.categories.findMany({
      where: eq(categories.isUniverse, true),
      orderBy: asc(categories.sortOrder),
      with: {
        children: {
          orderBy: asc(categories.sortOrder),
        },
      },
    }),
  ]);

  const universes = rawUniverses.map((u) => ({
    id: u.id,
    name: u.name,
    slug: u.slug,
    description: u.description,
    image: u.image,
    children: (u.children ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
  }));

  const formattedStores = storeRows.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    city: s.city,
    phone: s.phone,
    hours: s.hours,
  }));

  return (
    <div className="cine-page relative">
      <CinematicProgress />

      {/* 01 · VIDEO — OPENING SCENE */}
      <CinematicHero />

      {/* 02 · CONTENT — MANIFESTO & COMMITMENTS */}
      <CinematicManifesto />

      {/* 03 · VIDEO — CHAPTER SKIN */}
      <CinematicChapterSkin />

      {/* 04 · CONTENT — ATELIER & FORMULATION HOUSES */}
      <CinematicAtelier />

      {/* 05 · VIDEO — CHAPTER HAIR & BODY */}
      <CinematicHairBody />

      {/* 06 · UNIVERSE — THE SEVEN RAYONS CINEMA HUB */}
      <CinematicUniverseShowcase universes={universes} />

      {/* 07 · VIDEO — CHAPTER SUN PROTECTION */}
      <CinematicSunSection />

      {/* 08 · FOOTER — CLOSING FRAME & CREDITS */}
      <CinematicFooter stores={formattedStores} />
    </div>
  );
}
