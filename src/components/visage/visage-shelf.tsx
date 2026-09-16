import Link from "next/link";
import { ArrowRightIcon, ChatIcon, DropletIcon } from "@/components/icons";
import { ProductGrid } from "@/components/catalog/product-card";
import { EmptyState, ProductGridSkeleton } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import type { Facets } from "@/components/catalog/filters";
import type { ProductCard as PC } from "@/lib/catalog";
import { BASE, TOL_LABELS, type RawSP } from "./urls";
import { ShelfChips, ShelfPagination, type ListResult } from "./visage-workspace";

/**
 * VisageShelf — the plates themselves.
 *
 * The counter keeps two postures and never a third: the eight the officine
 * stands behind (selection), or the full rayon with everything that refines it
 * (shelf). The old page separated them into two different worlds — an
 * editorial plate section, then a URL parameter that swapped to another
 * template. Here they are the same workspace, one toggle apart.
 */

export function VisageShelf({
  mode,
  universeTotal,
  room,
  shelf,
  sp,
  facets,
  wished,
  isAuthed,
  fuzzyNote,
}: {
  mode: "selection" | "shelf";
  universeTotal: number;
  /** The curated counter eight (selection mode). */
  room: { items: PC[] } | null;
  /** The filtered shelf (shelf mode); null while Suspense is still fetching. */
  shelf: ListResult | null;
  sp: RawSP;
  facets: Facets;
  wished: number[];
  isAuthed: boolean;
  fuzzyNote?: string;
}) {
  if (mode === "selection") {
    const items = room?.items ?? [];
    if (items.length === 0) {
      return (
        <div className="py-12">
          <EmptyState
            icon={<DropletIcon size={22} />}
            title="Le comptoir se réapprovisionne"
            description="Aucune référence en rayon pour l’instant dans cet univers. Les laboratoires livrent vite — la boutique, elle, est pleine."
            action={{ href: "/boutique", label: "Voir toute la boutique" }}
          />
        </div>
      );
    }
    return (
      <div>
        <Reveal y={12}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pt-7 pb-6">
            <p className="max-w-[46ch] text-[13px] leading-[1.8] text-muted">
              <span className="font-display text-[19px] italic text-ink">Huit sur {universeTotal}.</span>{" "}
              Ce que notre équipe officinale met devant au comptoir — conseillés, demandés, ou tout juste arrivés.
            </p>
            <Link href={`${BASE}?all=1`} className="btn-secondary min-h-12 px-6 text-[10px]">
              Tout le rayon · {universeTotal}
              <ArrowRightIcon size={12} className="rtl-mirror" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <ProductGrid items={items} wishedIds={wished} isAuthed={isAuthed} rhythm="dense" priorityCount={4} />
      </div>
    );
  }

  if (!shelf) return <ProductGridSkeleton n={8} />;

  return (
    <div>
      <ShelfChips sp={sp} facets={facets} tolLabels={TOL_LABELS} />
      {shelf.fuzzy && (
        <p className="mt-5 flex items-baseline gap-2 border-b border-champagne/30 pb-3 text-[12.5px] italic text-muted" role="status">
          <span aria-hidden className="text-champagne-2">≈</span>
          {fuzzyNote ?? "Aucune correspondance exacte — voici ce qui y ressemble le plus."}
        </p>
      )}
      {shelf.items.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<ChatIcon size={22} />}
            title="Aucune référence ne répond à ces critères"
            description="Élargissez un besoin, retirez un laboratoire — ou laissez le pharmacien chercher à votre place."
            action={{ href: BASE, label: "Repartir du comptoir" }}
          />
        </div>
      ) : (
        <div className="pt-7">
          <ProductGrid items={shelf.items} wishedIds={wished} isAuthed={isAuthed} rhythm="dense" priorityCount={4} />
        </div>
      )}
      <ShelfPagination sp={sp} shelf={shelf} />
      <AdviceLine />
    </div>
  );
}

/** One quiet promise at the foot of every posture — the human at the counter. */
function AdviceLine() {
  return (
    <Reveal y={10}>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-stone/50 pt-6">
        <p className="min-w-0 max-w-[60ch] text-[12.5px] leading-relaxed text-muted">
          Un doute entre deux formules ? Le comptoir d’Ezzahra répond aussi en ligne —{" "}
          <Link href="/diagnostic" className="link-underline font-bold uppercase tracking-[0.14em] text-champagne-2">
            dix questions, une routine
          </Link>
          .
        </p>
        <Link href="/aide" className="btn-ghost min-h-10 shrink-0 text-[10px]">
          Écrire au pharmacien <ArrowRightIcon size={12} className="rtl-mirror" aria-hidden />
        </Link>
      </div>
    </Reveal>
  );
}
