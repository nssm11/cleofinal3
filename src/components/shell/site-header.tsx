"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/data/site";
import { useWatchlist } from "@/features/watchlist/store";
import { Wordmark } from "@/components/ui/button";

/**
 * The program guide bar: fixed, opaque (no blur tricks), hairline under.
 * On mobile the nav folds into a full-screen "program" dialog — a printed
 * guide you open, not a floating glass thing.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const watchlist = useWatchlist();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-night/98 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-6 px-4 md:px-8">
        <Link href="/" className="group shrink-0" aria-label="خيال — الصفحة الرئيسية">
          <Wordmark className="transition-opacity group-hover:opacity-90" />
        </Link>

        <nav aria-label="أقسام الأرشيف" className="hidden items-center gap-1 md:flex">
          {site.nav.map((l: { href: string; labelAr: string }) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative rounded-frame px-3 py-2 text-sm transition-colors duration-(--duration-flip)",
                isActive(l.href) ? "text-bone" : "text-ash hover:text-bone",
              )}
            >
              {l.labelAr}
              {isActive(l.href) && (
                <span aria-hidden className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-tungsten" />
              )}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/بحث"
            className="inline-flex h-9 items-center gap-2 rounded-frame border border-rule px-3 text-sm text-ash transition-colors hover:border-tungsten/50 hover:text-bone"
            aria-label="بحث في الأرشيف"
          >
            <Search className="size-4" strokeWidth={1.8} />
            <span className="hidden lg:inline">بحث</span>
          </Link>
          <Link
            href="/قائمتي"
            className={cn(
              "relative inline-flex h-9 items-center gap-2 rounded-frame border px-3 text-sm transition-colors",
              isActive("/قائمتي")
                ? "border-tungsten/60 text-tungsten"
                : "border-rule text-ash hover:border-tungsten/50 hover:text-bone",
            )}
            aria-label={`قائمتي (${watchlist.length})`}
          >
            قائمتي
            {watchlist.length > 0 && (
              <span className="nums grid size-5 place-items-center rounded-lens bg-tungsten text-[11px] font-bold text-night">
                {watchlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-frame border border-rule text-ash md:hidden"
            onClick={() => setOpen(true)}
            aria-label="فتح قائمة البرنامج"
          >
            <Menu className="size-5" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-night/90 data-[state=open]:animate-[fadeIn_200ms_ease-out]" />
          <Dialog.Content className="fixed inset-0 z-[61] flex flex-col bg-night p-6 data-[state=open]:animate-[riseIn_260ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:hidden">
            <div className="flex items-center justify-between">
              <Dialog.Title className="display-tight text-2xl font-bold">برنامج اليوم</Dialog.Title>
              <Dialog.Close className="grid size-10 place-items-center rounded-frame border border-rule text-ash" aria-label="إغلاق">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <nav className="mt-10 flex flex-col gap-1" aria-label="أقسام الأرشيف (الجوال)">
              {site.nav.map((l) => (
                <Dialog.Close asChild key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "flex items-baseline justify-between border-b border-rule-soft py-4",
                      isActive(l.href) ? "text-tungsten" : "text-bone",
                    )}
                  >
                    <span className="display-tight text-3xl font-bold">{l.labelAr}</span>
                    <span className="label-mono text-faint">←</span>
                  </Link>
                </Dialog.Close>
              ))}
            </nav>
            <p className="mt-auto pt-8 text-sm leading-7 text-ash">
              أرشيف مفتوح: كل ما يُعرض هنا ملكية عامة أو مرخّص بمشاع إبداعي — مجانًا وبلا حساب.
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </header>
  );
}
