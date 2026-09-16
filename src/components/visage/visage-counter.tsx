import { listProducts, type ListFilters } from "@/lib/catalog";
import type { Facets } from "@/components/catalog/filters";
import { ProductGridSkeleton } from "@/components/ui/primitives";
import type { RawSP } from "./urls";
import { NeedRow, RayonStrip, WorkspaceToolbar, type ListResult } from "./visage-workspace";
import { VisageShelf } from "./visage-shelf";

/**
 * VisageCounter — the async heart of the page.
 *
 * One component that knows the shelf is the work: it reads the same query
 * parameters the house listing has always spoken (parseFilters lives behind
 * `filters`), asks the catalogue once, and hands the result to a workspace
 * that composes differently per posture. It sits behind a Suspense boundary
 * keyed by the query, so the cinematic band never waits for the plates.
 */

export async function VisageCounter({
  universeId,
  sp,
  filters,
  mode,
  facets,
  wished,
  isAuthed,
  universeTotal,
  room,
  categories,
  fuzzyNote,
}: {
  universeId: number;
  sp: RawSP;
  /** The filters already parsed from the query (universe scope applied). */
  filters: ListFilters;
  mode: "selection" | "shelf";
  facets: Facets;
  wished: number[];
  isAuthed: boolean;
  universeTotal: number;
  /** The curated counter eight, already fetched for the scene — selection mode
   *  borrows it instead of asking the catalogue twice. */
  room: ListResult | null;
  categories: { slug: string; name: string }[];
  fuzzyNote: string;
}) {
  // The shelf query does the work; in selection mode the counter simply
  // keeps the eight the page already gathered for the band — one query, ever.
  const shelf: ListResult = room ?? (await listProducts(mode === "shelf" ? filters : { ...filters, sort: "featured", perPage: 8 }));

  return (
    <section aria-label={`Le comptoir Visage — ${mode === "shelf" ? "rayon complet" : "sélection du moment"}`}>
      <WorkspaceToolbar mode={mode} universeTotal={universeTotal} shelf={mode === "shelf" ? shelf : null} facets={facets} sp={sp} />
      <div className="py-1">
        <NeedRow sp={sp} concerns={[...facets.concerns].sort((a, b) => b.n - a.n).slice(0, 8)} />
        <RayonStrip items={categories} />
      </div>
      <VisageShelf
        mode={mode}
        universeTotal={universeTotal}
        room={mode === "selection" ? shelf : null}
        shelf={mode === "shelf" ? shelf : null}
        sp={sp}
        facets={facets}
        wished={wished}
        isAuthed={isAuthed}
        fuzzyNote={fuzzyNote}
      />
    </section>
  );
}

export function VisageCounterSkeleton() {
  return (
    <div className="py-6" aria-busy="true" aria-label="Le rayon se compose">
      <div className="flex items-center justify-between gap-4 border-b border-stone/60 pb-4">
        <span className="skeleton block h-6 w-40" />
        <span className="skeleton block h-6 w-28" />
      </div>
      <div className="mt-6">
        <ProductGridSkeleton n={8} />
      </div>
    </div>
  );
}
