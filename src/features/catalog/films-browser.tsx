"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listFilms, repo } from "@/features/content/repository";
import { GENRES, genreIds, type GenreId } from "@/data/types";
import { Chip } from "@/components/ui/chip";
import { TitleGrid } from "./title-card";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The browser half of the catalog. The URL is the state; the index is local,
 * so filtering is a sub-millisecond repaint — and because the grid itself
 * renders server-side (the URL is folded in one frame after mount), a static
 * export still ships the whole shelf in HTML for no-JS visitors and crawlers.
 */

type SortKey = "year-desc" | "year-asc" | "title-ar" | "runtime";

interface Filters {
  genre: string[];
  decade: number[];
  license: string[];
  sort: SortKey;
}

const BASE: Filters = { genre: [], decade: [], license: [], sort: "year-asc" };

function parseFilters(search: string): Filters {
  const p = new URLSearchParams(search);
  const genre = p.get("genre")?.split(",").filter(Boolean) ?? [];
  const decade = p.get("decade")?.split(",").map(Number).filter((n) => !Number.isNaN(n)) ?? [];
  const license = p.get("license")?.split(",").filter(Boolean) ?? [];
  const rawSort = p.get("sort");
  const sort = (["year-desc", "year-asc", "title-ar", "runtime"] as const).includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : BASE.sort;
  return { genre, decade, license, sort };
}

function serialize(f: Filters): string {
  const p = new URLSearchParams();
  if (f.genre.length) p.set("genre", f.genre.join(","));
  if (f.decade.length) p.set("decade", f.decade.join(","));
  if (f.license.length) p.set("license", f.license.join(","));
  if (f.sort !== BASE.sort) p.set("sort", f.sort);
  return p.toString();
}

export function FilmsBrowser() {
  const [f, setF] = useState<Filters>(BASE);

  useEffect(() => {
    // fold the incoming URL (deep links, back/forward) — one frame after
    // mount, so hydration always matches the server's unfiltered grid
    const raf = requestAnimationFrame(() => {
      const qs = window.location.search;
      if (qs.length > 1) setF(parseFilters(qs));
    });
    const onPop = () => setF(parseFilters(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  function update(next: Filters) {
    setF(next);
    const qs = serialize(next);
    window.history.pushState(null, "", qs ? `/films?${qs}` : "/films");
  }

  function toggle(key: "genre" | "decade" | "license", val: string) {
    const current = key === "genre" ? f.genre : key === "decade" ? f.decade.map(String) : f.license;
    const arr = current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
    update({ ...f, [key]: key === "decade" ? arr.map(Number) : arr });
  }

  const items = listFilms({ genres: f.genre, decades: f.decade, licenses: f.license, sort: f.sort });
  const DECADES = Array.from(new Set(repo.films.map((x) => Math.floor(x.year / 10) * 10))).sort((a, b) => b - a);
  const activeCount = f.genre.length + f.decade.length + f.license.length;

  return (
    <>
      <header className="mb-8 border-b border-rule pb-6">
        <p className="label-ar text-tungsten">فهارس خيال</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display-tight text-4xl font-bold sm:text-5xl">كل الأفلام</h1>
          <p className="nums label-ar text-ash">
            {items.length} / {repo.films.length} فيلمًا{activeCount > 0 && ` · ${activeCount} مرشّحًا نشطًا`}
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ash">
          الفلترة تُكتب في العنوان — انسخ الرابط لتحفظ استعلامك.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 border-b border-rule bg-night/98 px-4 py-3 md:-mx-8 md:px-8">
        <FilterRow label="التصنيف">
          {genreIds.map((g) => (
            <Chip key={g} onClick={() => toggle("genre", g)} active={f.genre.includes(g)}>
              {GENRES[g as GenreId]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="العقد">
          {DECADES.map((d) => (
            <Chip key={d} onClick={() => toggle("decade", String(d))} active={f.decade.includes(d)} className="nums">
              {d}s
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="الترخيص">
          <Chip onClick={() => toggle("license", "pd")} active={f.license.includes("pd")}>ملكية عامة</Chip>
          <Chip onClick={() => toggle("license", "cc-by")} active={f.license.includes("cc-by")}>مشاع إبداعي CC BY</Chip>
        </FilterRow>
        <FilterRow label="الترتيب">
          {(
            [
              ["year-asc", "الأقدم أولًا"],
              ["year-desc", "الأحدث أولًا"],
              ["title-ar", "أبجدي عربي"],
              ["runtime", "الأقصر أولًا"],
            ] as const
          ).map(([key, label]) => (
            <Chip key={key} onClick={() => update({ ...f, sort: key })} active={f.sort === key}>
              {label}
            </Chip>
          ))}
          {activeCount > 0 && (
            <button type="button" onClick={() => update(BASE)} className="label-ar ms-2 text-cinnabar underline underline-offset-4 transition-colors hover:text-bone">
              مسح الكل
            </button>
          )}
        </FilterRow>
      </div>

      <section className="pt-8">
        {items.length > 0 ? (
          <TitleGrid items={items} cols={5} />
        ) : (
          <EmptyState
            title="صالة فارغة"
            body="لا عمل يجمع هذه المرشحات معًا — خفف قيدًا أو تصفح الفهرس كاملًا."
            action={
              <button type="button" onClick={() => update(BASE)} className="label-ar border-b border-tungsten/50 pb-1 text-tungsten">
                إعادة كل الأفلام
              </button>
            }
          />
        )}
      </section>

      <footer className="label-ar mt-14 border-t border-rule pt-4 text-faint">
        هل تبحث عن شيء لم يصل بعد؟{" "}
        <Link href="/about#arabic" className="text-ash underline underline-offset-4 transition-colors hover:text-tungsten">
          اقرأ عن الشاشة العربية قيد التجهيز
        </Link>
      </footer>
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <span className="label-ar me-1 w-16 shrink-0 text-faint">{label}</span>
      {children}
    </div>
  );
}
