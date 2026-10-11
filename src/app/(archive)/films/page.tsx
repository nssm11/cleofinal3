import type { Metadata } from "next";
import { FilmsBrowser } from "@/features/catalog/films-browser";

export const metadata: Metadata = {
  title: "الفهارس — أفلام",
  description: "كل أفلام الأرشيف: فلترة بالتصنيف والعقد والترخيص، بواجهة عربية.",
};

/**
 * The catalog: filters live in the URL (shareable, back-button friendly) and
 * the shelf itself is server-rendered; the client browser (films-browser)
 * folds the URL one frame after mount. Same code on the SSR build and on the
 * $0 static export — no compromise, no empty shells.
 */
export default function FilmsPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-10 md:px-8">
      <FilmsBrowser />
    </div>
  );
}
