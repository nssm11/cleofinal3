import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchPanel } from "@/features/search/search-panel";

export const metadata: Metadata = {
  title: "بحث",
  description: "ابحث في أرشيف خيال: عناوين، مخرجين، سنوات، أمزجة.",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[860px] px-4 pt-10 md:px-8">
      <header className="mb-8">
        <p className="label-ar text-tungsten">عدسة الأرشيف</p>
        <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">بحث</h1>
      </header>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-frame border border-rule bg-coal/40 motion-reduce:animate-none" />}>
        <SearchPanel />
      </Suspense>
    </div>
  );
}
