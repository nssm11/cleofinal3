import { ProductGridSkeleton } from "@/components/ui/primitives";

/**
 * The breath between scenes — the name, resting, then the shelf skeleton.
 */
export default function Loading() {
  return (
    <div className="container-lux py-10 lg:py-14">
      <div className="flex items-center gap-6">
        <span className="h-px w-10 animate-pulse bg-champagne-2/60" />
        <span className="font-display text-[13px] font-light tracking-[0.34em] text-muted-2">CLÉOPÂTRE</span>
      </div>
      <div className="skeleton mt-8 h-12 w-72" />
      <div className="skeleton mt-4 h-4 w-96 max-w-full" />
      <div className="mt-12">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
