"use client";
export function SectionOverlay({ children, deep, className }: { children?: React.ReactNode; deep?: boolean; className?: string }) {
  return (
    <div className={className ?? "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60"} aria-hidden>
      {children}
    </div>
  );
}
export default SectionOverlay;
