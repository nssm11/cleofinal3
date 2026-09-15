import { ChartSkeleton, MetricSkeleton, Skeleton } from "@/components/admin/os/primitives";

/**
 * SQUELETTE DU POSTE
 *
 * Pendant que la base de données répond, la page garde sa forme : le grand
 * chiffre, la rangée des mesures, puis les feuilles. On ne laisse jamais
 * l'écran blanc — l'attente a la même géométrie que le travail.
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-[112rem] px-3 sm:px-5 lg:px-7">
      <div className="pb-4 pt-5">
        <Skeleton className="h-2.5 w-52" />
        <Skeleton className="mt-2.5 h-8 w-[26rem] max-w-full" />
      </div>

      <div className="border border-os-line bg-os-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="hidden h-8 w-28 sm:block" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="mt-2 h-10 w-56" />
          </div>
          <Skeleton className="h-24 w-[42rem] max-w-full" />
        </div>
      </div>

      <div className="mt-3">
        <MetricSkeleton count={4} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-2 border border-os-line bg-os-surface p-4">
          <Skeleton className="h-4 w-56" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <ChartSkeleton height={220} />
      </div>
    </div>
  );
}
