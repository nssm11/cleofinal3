"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Clapperboard, Radio, Rows3, Search as SearchIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { search, suggestedQueries } from "@/features/content/repository";
import type { SearchHit } from "@/features/content/repository";
import type { Title } from "@/data/types";
import { createStore } from "@/lib/store";
import { archiveIndexOf } from "@/features/content/repository";
import { plateForTitle, TitleArt } from "@/features/posters/title-art";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

/**
 * Search as a lens, not a form: it filters the whole local index on every
 * keystroke, keeps the query in the URL for sharing, remembers the last few
 * queries on the device, and is fully arrow-key navigable.
 */
const KIND_LABEL: Record<SearchHit["kind"], string> = {
  film: "فيلم",
  series: "مسلسل",
  episode: "حلقة",
  collection: "مجموعة",
};

const KIND_ICON = { film: Clapperboard, series: Radio, episode: Rows3, collection: Archive };

/* recent queries live in a store, not in an effect — hydration-safe */
const recentStore = createStore<string[]>("khayal:recent-queries", (raw) => {
  try {
    const d = JSON.parse(raw);
    return Array.isArray(d) ? d.filter((x): x is string => typeof x === "string").slice(0, 6) : null;
  } catch {
    return null;
  }
}, []);
const NO_RECENT: string[] = [];
function useRecentQueries() {
  return useSyncExternalStore(recentStore.subscribe, recentStore.get, () => NO_RECENT);
}

export function SearchPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recent = useRecentQueries();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hits = useMemo(() => (q.trim().length >= 1 ? search(q) : []), [q]);

  function setQuery(term: string) {
    setQ(term);
    setActive(0);
  }

  // keep the URL in step with the query (debounced so history stays clean)
  useEffect(() => {
    const t = setTimeout(() => {
      const url = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search";
      router.replace(url, { scroll: false });
    }, 220);
    return () => clearTimeout(t);
  }, [q, router]);

  function commit(term: string) {
    setQuery(term);
    recentStore.set((prev) => [term, ...prev.filter((r) => r !== term)].slice(0, 6));
  }

  function onKeyDownList(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && hits[active]) {
      commit(q);
      const href = hitHref(hits[active]);
      router.push(href);
    }
  }

  return (
    <div onKeyDown={onKeyDownList}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-faint" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في الأرشيف: عنوانًا، مخرجًا، سنة، حالة مزاجية…"
          aria-label="بحث في الأرشيف"
          className="w-full rounded-frame border border-rule bg-coal px-4 py-4 pe-12 text-lg text-bone outline-none transition-colors placeholder:text-faint focus:border-tungsten/60"
        />
      </div>

      {q.trim() === "" && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="label-ar text-faint">جرّب:</span>
          {suggestedQueries().map((s) => (
            <button key={s} type="button" onClick={() => commit(s)} className="label-ar rounded-frame border border-rule px-3 py-1.5 text-ash transition-colors hover:border-tungsten/50 hover:text-bone">
              {s}
            </button>
          ))}
        </div>
      )}

      {q.trim() === "" && recent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="label-ar text-faint">بحثك الأخير:</span>
          {recent.map((r) => (
            <button key={r} type="button" onClick={() => commit(r)} className="label-ar rounded-frame bg-soot px-3 py-1.5 text-ash transition-colors hover:text-bone">
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8" role="listbox" aria-label="نتائج البحث">
        {q.trim() !== "" && hits.length === 0 && (
          <EmptyState
            title="الفهرس لا يعرف هذا بعد"
            body={`لا شيء يطابق «${q.trim()}» في فهرسنا. جرّب اسم مخرج (مثل: كيتون) أو مفردة مزاج مثل «نوار»، أو تصفّح الأفلام كاملة.`}
            action={<Link href="/films" className="label-ar border-b border-tungsten/50 pb-1 text-tungsten">كل الأفلام ←</Link>}
          />
        )}
        <ul className="list-none divide-y divide-rule-soft border-y border-rule">
          {hits.map((h, i) => {
            const href = hitHref(h);
            const Icon = KIND_ICON[h.kind];
            return (
              <li key={`${h.kind}:${h.episodeRef?.episode.slug ?? h.title.slug}:${i}`}>
                <Link
                  href={href}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "group/hit flex items-center gap-4 px-2 py-3 transition-colors",
                    active === i && "bg-coal",
                  )}
                >
                  <div className="w-16 shrink-0 overflow-hidden rounded-[2px] border border-rule">
                    {h.kind === "collection" ? (
                      <div className="grid aspect-[4/3] w-full place-items-center bg-soot text-faint">
                        <Icon className="size-5" />
                      </div>
                    ) : (
                      <TitleArt plate={plateForTitle(h.title as Title, archiveIndexOf(h.title.slug))} variant="wide" className="block w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="display-tight truncate text-base font-bold transition-colors group-hover/hit:text-tungsten">
                      {h.labelAr}
                      <span className="font-latin ms-2 text-[13px] font-normal italic text-ash">{h.labelLat}</span>
                    </p>
                    <p className="label-ar mt-0.5 text-faint">
                      <Icon className="me-1 inline size-3 align-[-2px]" />
                      {KIND_LABEL[h.kind]} · {h.yearLabel}
                    </p>
                  </div>
                  <span className="label-ar hidden shrink-0 text-ash opacity-0 transition-opacity group-hover/hit:opacity-100 sm:block">←</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {q.trim() !== "" && hits.length > 0 && (
          <p className="label-ar mt-3 text-faint">{hits.length} نتيجة · ↑↓ للتنقل، Enter للفتح</p>
        )}
      </div>
    </div>
  );
}

function hitHref(h: SearchHit): string {
  if (h.kind === "episode" && h.episodeRef) return `/watch/series/${h.episodeRef.series.slug}/${h.episodeRef.episode.slug}`;
  if (h.kind === "collection") return `/collections/${h.title.slug}`;
  if (h.kind === "series") return `/series/${h.title.slug}`;
  return `/films/${h.title.slug}`;
}
