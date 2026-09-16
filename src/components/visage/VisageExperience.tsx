import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/i18n/server";
import { facetsFor, getCategoryBySlug, listProducts } from "@/lib/catalog";
import { atmosphereFor } from "@/lib/atmospheres";
import { UNIVERSE_CINEMA } from "@/lib/universe-cinema";
import type { SP } from "@/components/catalog/listing";
import { Reveal } from "@/components/motion/reveal";
import { VisageOpening } from "./VisageOpening";
import { FeaturedRitual } from "./FeaturedRitual";
import { ConcernExplorer, type ConcernEntry } from "./ConcernExplorer";
import { EditorialMoment } from "./EditorialMoment";
import { CollectionIndex, type CollectionMeta } from "./CollectionIndex";
import { DiscoveryGateway } from "./DiscoveryGateway";
import { VisageListing } from "./VisageListing";
import { ConseilNoir } from "./ConseilNoir";
import { AutresChapitres } from "./AutresChapitres";
import { VisageRail, RailSlide } from "./VisageRail";
import { VisageCard } from "./VisageCard";
import { NOIR_EYEBROW, VISAGE_EDITION } from "./edition";

/**
 * LE VISAGE, LA NUIT — the universe re-imagined as a nocturne.
 *
 * Everything the old page could do is still here, one for one: the
 * breadcrumb and the universe's place in the film, the rayons, the counter
 * picks, the comparator, the wishlist, the cart, the whole shelf one honest
 * gesture away, the concern filter wired to the same URL language, and the
 * pharmacy's advice. What changed is everything the eye meets.
 *
 *   L'OUVERTURE     — one frame of film, the statement set like a credit
 *   01 LE RITUEL    — one counter pick set like a front page
 *   02 PAR BESOIN   — the great words that filter the shelf
 *   LE CHOIX        — the house's eight, gliding on a rail
 *   03 L'ÉDITORIAL  — the magazine plate of the night
 *   04 COLLECTIONS  — six chambers named like chapters
 *   05 LE RAYON     — the door to all references, or the shelf itself
 *   06 CONSEIL      — the pharmacy's quiet promise
 */
type UniverseRow = NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>;

export async function VisageExperience({
  u,
  all,
  sp,
}: {
  u: UniverseRow;
  all: { id: number; slug: string; name: string }[];
  sp: SP;
}) {
  const [copy, user] = await Promise.all([getCopy(), getCurrentUser()]);
  const t = copy.univers;
  const cinema = UNIVERSE_CINEMA[u.slug] ?? { video: "category-skin", poster: "skin", kicker: "SKIN", title: "" };
  const atmo = atmosphereFor(u.slug);

  /* The shelf's own contract, kept exactly: while no filter plays, the
     universe first shows the house's own eight; any parameter — or `all=1`
     — opens the whole shelf with its dock. */
  const raw = sp as Record<string, string | string[] | undefined>;
  const touched = ["brands", "concerns", "tol", "stock", "promo", "rating", "min", "max", "sort", "q", "page"].some(
    (k) => typeof raw[k] === "string" && raw[k] !== "",
  );
  const curated = !touched && raw.all !== "1";

  const wished = user
    ? (await db.select({ id: wishlistItems.productId }).from(wishlistItems).where(eq(wishlistItems.userId, user.id))).map((w) => w.id)
    : [];

  /* The house's eight and the shelf's facets, read at once. */
  const [room, facets] = await Promise.all([
    listProducts({ universeId: u.id, perPage: 8 }),
    facetsFor({ universeId: u.id }),
  ]);

  const concerns: ConcernEntry[] = (
    await Promise.all(
      facets.concerns.map(async (c) => {
        const r = await listProducts({ universeId: u.id, concernSlugs: [c.slug], perPage: 1 });
        const p = r.items[0];
        return { slug: c.slug, name: c.name, n: c.n, image: p?.image ?? null, productName: p?.name ?? null };
      }),
    )
  ).sort((a, b) => b.n - a.n);

  const collections: Record<string, CollectionMeta> = Object.fromEntries(
    await Promise.all(
      u.children.map(async (c) => {
        const r = await listProducts({ categoryId: c.id, perPage: 1 });
        return [c.slug, { n: r.total, image: r.items[0]?.image ?? null }] as const;
      }),
    ),
  );

  /* The front page of the night: a counter pick if the house named one. */
  const lead = room.items.find((p) => p.isCounterPick) ?? room.items[0];
  const supports = room.items.filter((p) => p.id !== lead?.id).slice(0, 3);
  const railItems = room.items.filter((p) => p.id !== lead?.id);

  /* The editorial ledge: two gestures of the evening concern. */
  const evening = concerns.find((c) => c.slug === "hydratation") ?? concerns[0];
  const nightPicks = evening
    ? (await listProducts({ universeId: u.id, concernSlugs: [evening.slug], perPage: 4 })).items
        .filter((p) => p.id !== lead?.id && !supports.some((s) => s.id === p.id))
        .slice(0, 2)
    : [];

  const index = all.findIndex((x) => x.id === u.id);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-cine-noir text-cine-ivory">
      {/* L'OUVERTURE — the frame of film, the credit, the table of contents. */}
      <VisageOpening
        video={cinema.video}
        poster={cinema.poster}
        alt={`Cléopâtre — univers ${u.name}`}
        note={atmo.promise}
        index={pad(index + 1)}
        total={pad(all.length)}
        breadcrumb={t.breadcrumb}
        universeName={u.name}
        chapters={VISAGE_EDITION.sommaire.chapters}
      />

      {/* 01 · LE GESTE PREMIER */}
      {lead && <FeaturedRitual lead={lead} supports={supports} wishedIds={wished} isAuthed={!!user} />}

      {/* 02 · PAR BESOIN — the words that filter the shelf. */}
      {concerns.length > 0 && <ConcernExplorer concerns={concerns} />}

      {/* LE CHOIX DE LA MAISON — the rest of the eight, gliding. */}
      {railItems.length > 0 && (
        <section className="border-t border-cine-line bg-cine-noir" aria-label={copy.merch.roomEyebrow}>
          <div className="container-wide py-16 lg:py-24">
            <Reveal amount={0.1}>
              <p className="mb-9 flex items-baseline gap-5">
                <span className={NOIR_EYEBROW}>{copy.merch.roomEyebrow}</span>
                <span className="font-display text-[13px] italic text-cine-faint">
                  {railItems.length} {railItems.length > 1 ? "références" : "référence"}
                </span>
                <span aria-hidden className="ml-1 hidden h-px flex-1 bg-cine-line sm:block" />
              </p>
            </Reveal>
            <VisageRail ariaLabel={copy.merch.roomEyebrow}>
              {railItems.map((p) => (
                <RailSlide key={p.id}>
                  <VisageCard p={p} wished={wished.includes(p.id)} isAuthed={!!user} />
                </RailSlide>
              ))}
            </VisageRail>
          </div>
        </section>
      )}

      {/* 03 · L'ÉDITORIAL — the room's own photograph. */}
      <EditorialMoment
        image={u.image ?? "/images/u-visage.jpg"}
        picks={nightPicks}
        concernSlug={evening?.slug ?? null}
        wishedIds={wished}
        isAuthed={!!user}
      />

      {/* 04 · LES COLLECTIONS */}
      {u.children.length > 0 && <CollectionIndex rooms={u.children} meta={collections} />}

      {/* 05 · TOUT LE RAYON — the door, or the shelf itself. */}
      {curated ? (
        <DiscoveryGateway total={room.total} label={copy.merch.roomAll} />
      ) : (
        <VisageListing
          base={{ universeId: u.id }}
          sp={sp}
          basePath={`/univers/${u.slug}`}
          wishedIds={wished}
          isAuthed={!!user}
        />
      )}

      {/* 06 · LE CONSEIL */}
      <ConseilNoir askAdvice={t.askAdvice} />

      {/* LA SUITE DU FILM */}
      <AutresChapitres others={all.filter((x) => x.id !== u.id)} />
    </div>
  );
}
