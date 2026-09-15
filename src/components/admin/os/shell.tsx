"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { drawerLeft, osFast } from "@/lib/admin/motion";
import { MOBILE_TABS, NAV, findNavItem, groupOf } from "./nav";
import { Glyph, LogoMark, CloseIcon, DensityIcon, FocusIcon, MenuIcon } from "./icons";
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
   LA COQUE DE LA MAISON — back-office
   ──────────────────────────────────────────────────────────────────────────
   A bright side wall in ivory with the maison's own letterforms, a champagne
   thread marking where the operator stands, a command line on top, and five
   doors at the bottom on a telephone. The interface is a room in the same
   house as the shop — never a template, never a dark cave.
   ══════════════════════════════════════════════════════════════════════════ */

const RAIL_W = "w-[4.75rem]";
const WALL_W = "w-[17rem]";

export function Shell({ children, counts }: { children: React.ReactNode; counts: ShellCounts }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const { focus, setFocus, density, setDensity } = useOs();
  const active = findNavItem(pathname);
  const group = groupOf(pathname);

  /* The drawer is bound to the pathname it was opened on: navigating — by
     any means, including the browser's own back — closes it, no effect
     required. */
  const [drawerFor, setDrawerFor] = useState<string | null>(null);
  const mobileOpen = drawerFor !== null && drawerFor === pathname;
  const openDrawer = () => setDrawerFor(pathname);
  const closeDrawer = () => setDrawerFor(null);

  const badgeValue = (key?: string) => (key ? (counts as unknown as Record<string, number>)[key] ?? 0 : 0);

  /* ── A single row of the side wall, reused by the wall and the drawer ── */
  const role = counts.operator.role as "admin" | "support" | string;
  const allowed = (item: { roles?: readonly ("admin" | "support")[] }) => (item.roles ? item.roles.includes(role as "admin" | "support") : true);

  const navList = (opts: { rail?: boolean; onNavigate?: () => void }) => (
    <nav className="os-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="Navigation principale">
      {NAV.map((g) => {
        const items = g.items.filter(allowed);
        if (items.length === 0) return null;
        return (
        <div key={g.key} className="mb-1.5">
          <p className={cn("flex items-center gap-1.5 px-2.5 pb-1 pt-3 os-label text-os-faint", opts.rail && "justify-center px-0 pt-4")}>
            <span aria-hidden className={cn("h-[3px] w-[3px] rotate-45 bg-os-gold/70", opts.rail && "hidden")} />
            <span className={cn(opts.rail && "sr-only")}>{g.label}</span>
          </p>
          <ul>
            {items.map((item) => {
              const isActive = active?.href === item.href;
              const badge = badgeValue(item.badge);
              const isAlert = item.badge === "attention" && badge > 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={opts.onNavigate}
                    title={opts.rail ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 py-0 pr-2.5 text-[13px] transition-colors",
                      opts.rail ? "justify-center px-0" : "pl-3.5",
                      isActive
                        ? "bg-os-gold-soft/80 text-os-text"
                        : "text-os-muted hover:bg-os-surface-2 hover:text-os-text",
                    )}
                  >
                    <span aria-hidden className={cn("absolute inset-y-1.5 start-0 w-[3px] bg-os-gold transition-opacity", isActive ? "opacity-100" : "opacity-0")} />
                    <Glyph name={item.icon} size={17} className={cn("shrink-0 transition-colors", isActive ? "text-os-gold-2" : "text-os-faint group-hover:text-os-text")} />
                    <span className={cn("min-w-0 flex-1 truncate", opts.rail && "sr-only", isActive && "font-medium")}>{item.label}</span>
                    {badge > 0 && !opts.rail && (
                      <span className={cn("os-num shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold", isAlert ? "bg-os-crit-soft text-os-crit" : "bg-os-gold-soft text-os-gold-2")}>
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                    {badge > 0 && opts.rail && (
                      <span aria-hidden className={cn("absolute end-2.5 top-1.5 h-1.5 w-1.5 rounded-full", isAlert ? "bg-os-crit" : "bg-os-gold")} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-os-canvas font-body text-os-text">
      {/* ── The side wall ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "os-chrome fixed inset-y-0 left-0 z-50 hidden flex-col border-e border-os-line bg-os-surface lg:flex",
          collapsed ? RAIL_W : WALL_W,
        )}
        style={{ transition: reduce ? undefined : "width 220ms cubic-bezier(0.16,1,0.3,1)" }}
        aria-label="Navigation principale"
      >
        {/* Brand */}
        <div className={cn("flex h-16 shrink-0 items-center border-b border-os-line", collapsed ? "justify-center px-0" : "gap-3 px-5")}>
          <Link href="/admin" className="flex items-center gap-3 text-os-text" title="Cléopâtre — back-office de la maison" aria-label="Cléopâtre — retour au poste de commande">
            <LogoMark size={21} className="shrink-0 text-os-gold-2" />
            {!collapsed && (
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-[14.5px] leading-none tracking-[0.22em]">CLÉOPÂTRE</span>
                <span className="mt-1.5 block text-[8.5px] font-semibold uppercase tracking-[0.3em] text-os-faint">Back-office</span>
              </span>
            )}
          </Link>
        </div>

        {navList({ rail: collapsed })}

        {/* Foot of the wall */}
        <div className={cn("shrink-0 border-t border-os-line", collapsed ? "px-2 py-2.5" : "px-3 py-3")}>
          <div className={cn("flex items-center gap-1", collapsed ? "flex-col" : "justify-between")}>
            {role === "admin" && (
              <Link href="/admin/systeme" title="Santé du système" className={cn("flex items-center gap-2 rounded-sm p-1.5 text-[11px] text-os-muted transition-colors hover:bg-os-surface-2 hover:text-os-text", collapsed && "justify-center")}>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", counts.health === "ok" ? "bg-os-ok" : counts.health === "warn" ? "bg-os-warn" : "bg-os-crit os-live")} aria-hidden />
                {!collapsed && <span className="whitespace-nowrap">{counts.health === "ok" ? "Système nominal" : counts.health === "warn" ? "À surveiller" : "Incident"}</span>}
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-sm p-1.5 text-os-muted transition-colors hover:bg-os-surface-2 hover:text-os-text"
              title={collapsed ? "Déplier la colonne" : "Replier la colonne"}
              aria-label={collapsed ? "Déplier la colonne" : "Replier la colonne"}
            >
              <Glyph name={collapsed ? "chevronRight" : "chevronLeft"} size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── The room ──────────────────────────────────────────────────── */}
      <div className={cn("flex min-h-screen flex-col transition-[padding]", collapsed ? "lg:pl-[4.75rem]" : "lg:pl-[17rem]")}>
        <header className="os-chrome sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-os-line bg-os-surface/90 px-3 backdrop-blur sm:gap-3 sm:px-5">
          {/* Mobile door */}
          <button
            onClick={() => openDrawer()}
            className="rounded-sm p-2 text-os-muted transition-colors hover:bg-os-surface-2 hover:text-os-text lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <MenuIcon size={18} />
          </button>

          {/* Brand on the telephone, position in the middle, instruments on the right */}
          <Link href="/admin" className="flex items-center lg:hidden" aria-label="Cléopâtre — retour au poste de commande">
            <LogoMark size={19} className="text-os-gold-2" />
          </Link>
          <div className="hidden min-w-0 items-baseline gap-2.5 xl:flex">
            <span className="os-label whitespace-nowrap text-os-faint">{group?.label ?? "Pilotage"}</span>
            <span className="text-os-line-strong" aria-hidden>/</span>
            <span className="truncate font-display text-[15.5px] text-os-text">{active?.label ?? "Poste de commande"}</span>
          </div>

          {/* The command line */}
          <div className="flex min-w-0 flex-1 items-center justify-end xl:justify-start xl:pl-3">
            <CommandPalette />
          </div>

          {/* Right instruments */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setDensity(density === "compact" ? "comfortable" : density === "comfortable" ? "spacious" : "compact")}
              className="hidden rounded-sm p-2 text-os-muted transition-colors hover:bg-os-surface-2 hover:text-os-text sm:block"
              title={`Densité : ${density} — cliquer pour changer`}
              aria-label={`Densité ${density}`}
            >
              <DensityIcon size={16} />
            </button>
            <button
              onClick={() => setFocus(!focus)}
              className={cn("hidden rounded-sm p-2 transition-colors sm:block", focus ? "bg-os-gold-soft text-os-gold-2" : "text-os-muted hover:bg-os-surface-2 hover:text-os-text")}
              title={focus ? "Quitter le mode concentration" : "Mode concentration"}
              aria-label="Mode concentration"
            >
              <FocusIcon size={16} />
            </button>
            <Link href="/admin/attention" className="flex items-center gap-1.5 rounded-sm border border-os-line bg-os-surface px-2 py-1.5 text-[11px] text-os-text transition-colors hover:border-os-line-strong" title="Centre d'attention">
              <span className={cn("h-1.5 w-1.5 rounded-full", counts.attention > 0 ? "bg-os-crit os-live" : "bg-os-ok")} aria-hidden />
              <span className="os-num">{counts.attention}</span>
              <span className="hidden md:inline">alertes</span>
            </Link>
            <Link href="/admin/taches" className="hidden items-center gap-1.5 rounded-sm border border-os-line bg-os-surface px-2 py-1.5 text-[11px] text-os-text transition-colors hover:border-os-line-strong md:flex" title="Tâches ouvertes">
              <Glyph name="check" size={13} className="text-os-muted" />
              <span className="os-num">{counts.tasks}</span>
            </Link>
            <span className="ml-0.5 flex items-center gap-2 rounded-sm border border-os-line bg-os-surface px-2 py-1" title={`${counts.operator.name} — ${counts.operator.role}`}>
              <span className="grid h-6.5 w-6.5 place-items-center bg-champagne-soft text-[10px] font-bold text-os-gold-2 ring-1 ring-champagne-3/50">{counts.operator.initials}</span>
              <span className="hidden text-[11px] text-os-muted 2xl:inline">{counts.operator.name}</span>
            </span>
          </div>
        </header>

        <main className={cn("min-w-0 flex-1 pb-24 lg:pb-10", focus && "os-focus-boundary")}>{children}</main>
      </div>

      {/* ── Telephone: drawer + five doors ────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="scrim"
              initial={reduce ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeDrawer()}
              className="fixed inset-0 z-[70] bg-os-ink/25 backdrop-blur-[1.5px] lg:hidden"
            />
            <motion.aside
              key="drawer"
              variants={reduce ? undefined : drawerLeft}
              initial={reduce ? { opacity: 0 } : "initial"}
              animate={reduce ? { opacity: 1 } : "animate"}
              exit={reduce ? { opacity: 0 } : "exit"}
              className="fixed inset-y-0 left-0 z-[71] flex w-[19rem] max-w-[85vw] flex-col border-e border-os-line bg-os-surface shadow-os-lift lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation principale"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-os-line px-5">
                <span className="flex items-center gap-3">
                  <LogoMark size={20} className="text-os-gold-2" />
                  <span className="flex flex-col">
                    <span className="font-display text-[14px] leading-none tracking-[0.22em] text-os-text">CLÉOPÂTRE</span>
                    <span className="mt-1.5 block text-[8.5px] font-semibold uppercase tracking-[0.3em] text-os-faint">Back-office</span>
                  </span>
                </span>
                <button onClick={() => closeDrawer()} aria-label="Fermer le menu" className="rounded-sm p-2 text-os-muted transition-colors hover:bg-os-surface-2 hover:text-os-text">
                  <CloseIcon size={17} />
                </button>
              </div>
              {navList({ onNavigate: () => closeDrawer() })}
              <div className="shrink-0 border-t border-os-line px-5 py-3.5">
                <p className="flex items-center gap-2 text-[11px] text-os-muted">
                  <span className={cn("h-2 w-2 rounded-full", counts.health === "ok" ? "bg-os-ok" : counts.health === "warn" ? "bg-os-warn" : "bg-os-crit")} aria-hidden />
                  {counts.health === "ok" ? "Système nominal" : counts.health === "warn" ? "À surveiller" : "Incident"}
                  <span className="ml-auto text-os-faint">·</span>
                  <span>{counts.operator.name}</span>
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav className="os-chrome fixed inset-x-0 bottom-0 z-40 flex border-t border-os-line bg-os-surface/96 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navigation mobile">
        {MOBILE_TABS.map((item) => {
          const isActive = active?.href === item.href;
          const badge = badgeValue(item.badge);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors", isActive ? "text-os-text" : "text-os-faint")}
            >
              <span className="relative">
                <Glyph name={item.icon} size={19} className={cn(isActive && "text-os-gold-2")} />
                {badge > 0 && <span className="absolute -right-2 -top-1.5 h-3.5 min-w-3.5 rounded-full bg-os-crit px-0.5 text-[9px] font-bold leading-[0.9rem] text-white">{badge > 9 ? "9+" : badge}</span>}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em]">{item.short ?? item.label.split(" ")[0]}</span>
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
            className="fixed bottom-24 right-3 z-[60] rounded-sm border border-os-ink bg-os-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-os-onink lg:bottom-5"
          >
            <CloseIcon size={13} className="mr-1.5 inline align-[-2px]" /> Quitter le focus
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
