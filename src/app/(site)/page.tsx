import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { VideoHero } from "@/components/cinematic/VideoHero";
import { VideoSection } from "@/components/cinematic/VideoSection";
import { CinematicFooter } from "@/components/cinematic/CinematicFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cléopâtre — Beauty in Ritual",
  description:
    "Peau, cheveu, corps, soleil, bébé — la maison de beauté Cléopâtre en cinq chapitres. Produits authentiques conseillés par nos pharmaciens, livrés partout en Tunisie.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cléopâtre — Beauty in Ritual",
    description:
      "Un film en cinq chapitres : skin, hair, body, sun, baby. La dermo-cosmétique de la maison, filmée en pleine lumière.",
    url: "/",
    images: ["/videos/posters/hero.jpg"],
  },
};

/**
 * LE FILM — the homepage as a campaign.
 *
 *   OPENING  — the film, the name, the invitation
 *   SKIN     — the ritual begins
 *   HAIR     — strength and beauty
 *   BODY     — care in every detail
 *   SUN      — protection with elegance
 *   BABY     — gentle essentials
 *   CREDITS  — the maison, by name
 *
 * Nothing else lives on this page. The commerce engine — products, prices,
 * stock, every rayon's catalogue — waits one gesture inside each chapter.
 */

const CHAPTERS = [
  {
    id: "chapter-skin",
    video: "category-skin",
    poster: "skin",
    kicker: "SKIN",
    title: "The ritual begins.",
    ctaLabel: "Discover",
    href: "/univers/visage",
  },
  {
    id: "chapter-hair",
    video: "category-hair",
    poster: "hair",
    kicker: "HAIR",
    title: "Strength and beauty.",
    ctaLabel: "Explore",
    href: "/univers/cheveux",
  },
  {
    id: "chapter-body",
    video: "category-body",
    poster: "body",
    kicker: "BODY",
    title: "Care in every detail.",
    ctaLabel: "Discover",
    href: "/univers/corps",
  },
  {
    id: "chapter-sun",
    video: "category-sun",
    poster: "sun",
    kicker: "SUN",
    title: "Protection with elegance.",
    ctaLabel: "Explore",
    href: "/univers/solaire",
  },
  {
    id: "chapter-baby",
    video: "category-baby",
    poster: "baby",
    kicker: "BABY",
    title: "Gentle essentials.",
    ctaLabel: "Discover",
    href: "/univers/bebe-maman",
  },
] as const;

export default async function HomePage() {
  const storeRows = await db.select().from(stores).where(eq(stores.isActive, true));

  return (
    <>
      <VideoHero />
      {CHAPTERS.map((c, i) => (
        <VideoSection key={c.id} {...c} index={i + 1} total={CHAPTERS.length} />
      ))}
      <CinematicFooter
        stores={storeRows.map((s) => ({
          id: s.id,
          name: s.name,
          address: s.address,
          city: s.city,
          phone: s.phone,
          hours: s.hours,
        }))}
      />
    </>
  );
}
