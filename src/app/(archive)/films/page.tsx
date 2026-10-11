import Link from "next/link";
import type { Metadata } from "next";
import { listFilms, repo } from "@/features/content/repository";
import { GENRES, genreIds, type GenreId } from "@/data/types";
import { Chip } from "@/components/ui/chip";
import { TitleGrid } from "@/features/catalog/title-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "الفهارس — أفلام",
  description: "كل أفلام الأرشيف: فلترة بالتصنيف والعقد والترخيص، بواجهة عربية.",
};

/**
 * The catalog is built for work: filters in the URL (shareable, back-button
 * friendly), instant client-side feel because the whole index is local, and
 * honest empties when a filter box runs dry.
 */
export default async function FilmsPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; decade?: string; license?: string; sort?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const genres = sp.genre ? sp.genre.split(",").filter(Boolean) : [];
  const decades = sp.decade ? sp.decade.split(",").map(Number).filter((n) => !Number.isNaN(n)) : [];
  const licenses = sp.license ? sp.license.split(",").filter(Boolean) : [];
  const sort = (sp.sort as "year-desc" | "year-asc" | "title-ar" | "runtime") ?? "year-asc";
  const q = sp.q ?? "";

  const items = listFilms({ genres, decades, licenses, sort, q });

  const link = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const merged = { genre: genres.join(","), decade: decades.join(","), license: licenses.join(","), sort, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/films?${s}` : "/films";
  };

  const toggle = (key: "genre" | "decade" | "license", val: string) => {
    const current = key === "genre" ? genres : key === "decade" ? decades.map(String) : licenses;
    const next = current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
    return link({ [key]: next.join(",") || null });
  };

  const DECADES = Array.from(new Set([...listAllDecades()])).sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 md:px-8">
      <header className="mb-8 border-b border-rule pb-6">
        <p className="label-ar text-tungsten">فهارس خيال</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="display-tight text-4xl font-bold sm:text-5xl">كل الأفلام</h1>
          <p className="nums label-ar text-ash">
            {items.length} / {listAllCount()} فيلمًا
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ash">
          الفلترة تُكتب في العنوان — انسخ الرابط لتحفظ استعلامك.
        </p>
      </header>

      <div className="sticky top-16 z-30 -mx-4 border-b border-rule bg-night/98 px-4 py-3 md:-mx-8 md:px-8">
        <FilterRow label="التصنيف">
          {genreIds.map((g) => (
            <Chip key={g} href={toggle("genre", g)} active={genres.includes(g)}>{GENRES[g as GenreId]}</Chip>
          ))}
        </FilterRow>
        <FilterRow label="العقد">
          {DECADES.map((d) => (
            <Chip key={d} href={toggle("decade", String(d))} active={decades.includes(d)} className="nums">
              {d}s
            </Chip>
          ))}
          <Chip href={toggle("decade", "")} active={false}>مسح العقود</Chip>
        </FilterRow>
        <FilterRow label="الترتيب">
          {[
            ["year-asc", "الأقدم أولًا"],
            ["year-desc", "الأحدث أولًا"],
            ["title-ar", "أبجدي عربي"],
            ["runtime", "الأقصر أولًا"],
          ].map(([key, label]) => (
            <Chip key={key} href={link({ sort: key })} active={sort === key}>{label}</Chip>
          ))}
        </FilterRow>
      </div>

      <section className="pt-8">
        {items.length > 0 ? (
          <TitleGrid items={items} cols={5} />
        ) : (
          <EmptyState
            title="صالة فارغة"
            body="لا عمل يجمع هذه المرشحات معًا — خفف قيدًا أو تصفح الفهرس كاملًا."
            action={<Link href="/films" className="label-ar border-b border-tungsten/50 pb-1 text-tungsten">إعادة كل الأفلام</Link>}
          />
        )}
      </section>

      <footer className="label-ar mt-14 border-t border-rule pt-4 text-faint">
        هل تبحث عن شيء لم يصل بعد؟{" "}
        <Link href="/about#arabic" className="text-ash underline underline-offset-4 hover:text-tungsten">اقرأ عن الشاشة العربية قيد التجهيز</Link>
      </footer>
    </div>
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

function listAllDecades() { return repo.films.map((f) => Math.floor(f.year / 10) * 10); }
function listAllCount() { return repo.films.length; }
