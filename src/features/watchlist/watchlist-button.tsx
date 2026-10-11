"use client";

import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { toggleWatchlist, useWatchlistHas, type WatchlistEntry } from "./store";

/**
 * Save-to-list control. Responds immediately (local write, no network),
 * flashes the tungsten confirmation for a beat, and stays honest: the icon
 * only flips to "saved" if the write actually happened.
 */
export function WatchlistButton({
  entry,
  labeled = false,
  className,
  onToggle,
  titleAr,
}: {
  entry: Omit<WatchlistEntry, "addedAt">;
  labeled?: boolean;
  className?: string;
  onToggle?: (saved: boolean) => void;
  /** Arabic title for screen readers — never a slug. */
  titleAr?: string;
}) {
  const saved = useWatchlistHas(entry.key);
  const [flash, setFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWatchlist(entry);
    setFlash(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(false), 700);
    onToggle?.(next);
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={saved ? `إزالة ${titleAr ?? "هذا العمل"} من قائمتي` : `حفظ ${titleAr ?? "هذا العمل"} في قائمتي`}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-frame border text-[13px] transition-all duration-(--duration-slide) ease-(--ease-projector)",
        labeled ? "px-4" : "w-9",
        saved
          ? "border-tungsten/70 bg-tungsten/10 text-tungsten"
          : "border-rule bg-night/60 text-ash hover:border-tungsten/60 hover:text-bone",
        flash && "scale-105 border-tungsten text-tungsten",
        className,
      )}
    >
      {saved ? <BookmarkCheck className="size-4" strokeWidth={1.8} /> : <BookmarkPlus className="size-4" strokeWidth={1.8} />}
      {labeled && <span>{saved ? "في قائمتي" : "قائمتي"}</span>}
    </button>
  );
}
