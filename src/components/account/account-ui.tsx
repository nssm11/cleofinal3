import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AccountCard({ children, className, hover = true, accent = false, as: Tag = "div" }: { children: ReactNode; className?: string; hover?: boolean; accent?: boolean; as?: "div" | "section" | "article" | "li" | "aside" }) {
  return (
    <Tag className={cn("relative border border-line bg-bg p-6", hover && "hover:border-ink transition-colors", accent && "border-l-2 border-l-ink", className)}>
      {children}
    </Tag>
  );
}

export const cardPad = "p-6";

export function CardRowSkeleton({ n = 3 }: { n?: number; tall?: boolean }) {
  return (
    <div className="space-y-px bg-line border border-line">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-bg p-6"><div className="h-16 w-full bg-bg-2 animate-pulse" /></div>
      ))}
    </div>
  );
}

export function StatRowSkeleton({ n = 3 }: { n?: number }) {
  return (
    <div className="grid gap-px bg-line border border-line sm:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-bg p-6"><div className="h-20 w-full bg-bg-2 animate-pulse" /></div>
      ))}
    </div>
  );
}

export function FicheGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-line border border-line md:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-bg p-4"><div className="aspect-[4/5] w-full bg-bg-2 animate-pulse" /></div>
      ))}
    </div>
  );
}
