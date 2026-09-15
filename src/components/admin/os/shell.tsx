"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { osFast } from "@/lib/admin/motion";
import { MOBILE_TABS, NAV, findNavItem, groupOf } from "./nav";
import { Glyph, LogoMark, CloseIcon, DensityIcon, FocusIcon } from "./icons";
import { useOs } from "./os-context";
import { CommandPalette } from "./command-palette";

export type ShellCounts = {
  attention: number;
  tasks: number;
  aprep: number;
  reviews: number;
  tickets: number;
  health: "ok" | "warn" | "bad";
  operator: { name: string; role: string; initials: string };
};

/* ══════════════════════════════════════════════════════════════════════════
   L'INSTRUMENT — coque d'administration
   ──────────────────────────────────────────────────────────────────────────
   A spine on the left, one command line on top, five doors at the bottom on a
   telephone. Nothing else is furniture: every pixel that is not the operator's
   work has to earn its place.
   ══════════════════════════════════════════════════════════════════════════ */

export function Shell({ children, counts }: { children: React.ReactNode; counts: ShellCounts }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [openRail, setOpenRail] = useState(false);
  const [pinned, setPinned] = useState(false);
  const { focus, setFocus, density, setDensity } = useOs();
  const active = findNavItem(pathname);
  const group = groupOf(pathname);

  useEffect(() => { setOpenRail(false); }, [pathname]);

  const badgeValue = (key?: ShellCounts extends never ? never : string) => {
    if (!key) return 0;
    return (counts as unknown as Record<string, number>)[key] ?? 0;
  };

  const expanded = pinned || openRail;

  return (
    <div className="min-h-screen bg-os-canvas text-os-text">
      {/* ── Spine ─────────────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setOpenRail(true)}
        onMouseLeave={() => setOpenRail(false)}
        className={cn(
          "os-chrome fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-os-line bg-os-canvas/95 backdrop-blur lg:flex",
          expanded ? "w-[15.5rem]" : "w-[4.25rem]",
        )}
        style={{ transition: reduce ? undefined : "width 240ms cubic-bezier(0.16,1,0.3,1)" }}
        aria-label="Navigation principale"
      >
        <div className="flex h-[3.5rem] items-center gap-2.5 border-b border-os-line px-4">
          <Link href="/admin" className="flex items-center gap-2.5 text-os-text" title="Cléopâtre — poste de commande">
            <LogoMark size={20} className="shrink-0 text-os-gold-2" />
            <span className={cn("font-display text-[15px] tracking-[0.16em] whitespace-nowrap", expanded ? "opacity-100" : "pointer-events-none opacity-0")}>
              CLÉOPÂTRE
            </span>
          </Link>
        </div>

        <nav className="os-scroll min-h-0 flex-1 overflow-y-auto py-2">
          {NAV.map((g) => (
            <div key={g.key} className="mb-1">
              <p className={cn("os-label px-4 pb-1 pt-2 text-os-faint", expanded ? "opacity-100" : "opacity-0")}>{g.label}</p>
              <ul>
                {g.items.map((item) => {
                  const isActive = active?.href === item.href;
                  const badge = badgeValue(item.badge);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={expanded ? undefined : `${item.label} — ${item.hint}`}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex h-9 items-center gap-3 pl-4 pr-3 text-[13px] transition-colors",
                          isActive ? "bg-os-ink text-os-onink" : "text-os-text hover:bg-os-surface-2",
                        )}
                      >
                        <span className={cn("absolute left-0 top-0 h-full w-[2px]", isActive ? "bg-os-gold" : "bg-transparent")} aria-hidden />
                        <Glyph name={item.icon} size={17} className={cn("shrink-0", isActive ? "text-os-gold" : "text-os-muted group-hover:text-os-text")} />
                        <span className={cn("min-w-0 flex-1 truncate whitespace-nowrap", expanded ? "opacity-100" : "pointer-events-none opacity-0")}>{item.label}</span>
                        {badge > 0 && (
                          <span className={cn("os-num shrink-0 px-1.5 py-0.5 text-[10px] font-semibold", isActive ? "bg-os-gold text-os-ink" : "bg-os-crit-soft text-os-crit", !expanded && "absolute right-1.5 top-1.5 px-1")}>
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-os-line p-2.5">
          <div className={cn("flex items-center gap-1.5", expanded ? "justify-between" : "flex-col")}>
            <Link href="/admin/systeme" className="flex items-center gap-2 px-1.5 py-1 text-[11px] text-os-muted hover:text-os-text" title="Santé du système">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", counts.health === "ok" ? "bg-os-ok" : counts.health === "warn" ? "bg-os-warn" : "bg-os-crit")} aria-hidden />
              <span className={cn("whitespace-nowrap", expanded ? "inline" : "hidden")}>
                {counts.health === "ok" ? "Système nominal" : counts.health === "warn" ? "À surveiller" : "Incident"}
              </span>
            </Link>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setPinned((p) => !p)} className="p-1.5 text-os-muted transition-colors hover:text-os-text" title={pinned ? "Détacher la colonne" : "Épingler la colonne"} aria-label="Épingler la colonne">
                <Glyph name={pinned ? "pin" : "chevronRight"} size={15} />
              </button>
              <button onClick={() => setFocus(true)} className="p-1.5 text-os-muted transition-colors hover:text-os-text" title="Mode concentration" aria-label="Mode concentration">
                <FocusIcon size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Workspace ─────────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-col lg:pl-[4.25rem]">
        <header className="os-chrome sticky top-0 z-40 flex h-[3.5rem] items-center gap-2 border-b border-os-line bg-os-canvas/92 px-3 backdrop-blur sm:gap-3 sm:px-4">
          <Link href="/admin" className="flex items-center gap-2 lg:hidden" aria-label="Cléopâtre">
            <LogoMark size={19} className="text-os-gold-2" />
          </Link>
          <div className="hidden min-w-0 items-center gap-2.5 xl:flex">
            <span className="os-label text-os-faint">{group?.label ?? "Commandement"}</span>
            <span className="text-os-line-strong" aria-hidden>/</span>
            <span className="truncate font-display text-[15px] text-os-text">{active?.label ?? "Poste de commande"}</span>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center xl:justify-start xl:pl-4">
            <CommandPalette />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDensity(density === "compact" ? "comfortable" : density === "comfortable" ? "spacious" : "compact")}
              className="hidden p-2 text-os-muted transition-colors hover:text-os-text sm:block"
              title={`Densité : ${density} — cliquer pour changer`}
              aria-label={`Densité ${density}`}
            >
              <DensityIcon size={16} />
            </button>
            <Link href="/admin/attention" className="relative flex items-center gap-1.5 border border-os-line px-2 py-1.5 text-[11px] text-os-text transition-colors hover:border-os-line-strong" title="Centre d'attention">
              <span className={cn("h-1.5 w-1.5 rounded-full", counts.attention > 0 ? "bg-os-crit os-live" : "bg-os-ok")} aria-hidden />
              <span className="os-num">{counts.attention}</span>
              <span className="hidden sm:inline">alertes</span>
            </Link>
            <Link href="/admin/taches" className="hidden items-center gap-1.5 border border-os-line px-2 py-1.5 text-[11px] text-os-text transition-colors hover:border-os-line-strong sm:flex" title="Tâches ouvertes">
              <Glyph name="check" size={13} className="text-os-muted" />
              <span className="os-num">{counts.tasks}</span>
            </Link>
            <span className="ml-1 flex items-center gap-2 border border-os-line px-2 py-1" title={`${counts.operator.name} — ${counts.operator.role}`}>
              <span className="grid h-6 w-6 place-items-center bg-os-ink text-[10px] font-bold text-os-onink">{counts.operator.initials}</span>
              <span className="hidden text-[11px] text-os-muted xl:inline">{counts.operator.role}</span>
            </span>
          </div>
        </header>

        <main className={cn("min-w-0 flex-1 pb-20 lg:pb-8", focus && "os-focus-boundary")}>{children}</main>
      </div>

      {/* ── Telephone doors ───────────────────────────────────────────── */}
      <nav className="os-chrome fixed inset-x-0 bottom-0 z-40 flex border-t border-os-line bg-os-canvas/96 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigation mobile">
        {MOBILE_TABS.map((item) => {
          const isActive = active?.href === item.href;
          const badge = badgeValue(item.badge);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2", isActive ? "text-os-text" : "text-os-muted")}
            >
              <span className="relative">
                <Glyph name={item.icon} size={19} />
                {badge > 0 && <span className="absolute -right-2 -top-1.5 h-3.5 min-w-3.5 rounded-full bg-os-crit px-0.5 text-[9px] font-bold leading-[0.9rem] text-white">{badge > 9 ? "9+" : badge}</span>}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em]">{item.label.split(" ")[0]}</span>
              {isActive && <motion.span layoutId="tab-underline" className="absolute inset-x-3 top-0 h-[2px] bg-os-gold" transition={reduce ? { duration: 0 } : osFast} />}
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>
        {focus && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFocus(false)}
            className="fixed bottom-20 right-3 z-[60] border border-os-ink bg-os-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-os-onink lg:bottom-4"
          >
            <CloseIcon size={13} className="mr-1.5 inline align-[-2px]" /> Quitter le focus
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
