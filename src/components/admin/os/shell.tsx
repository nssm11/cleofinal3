"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NAV, findNavItem, groupOf } from "./nav";
import { useOs } from "./os-context";
import { CommandPalette } from "./command-palette";
import { Menu, X } from "lucide-react";

export type ShellCounts = {
  attention: number;
  tasks: number;
  aprep: number;
  reviews: number;
  tickets: number;
  health: "ok" | "warn" | "bad";
  operator: { name: string; role: string; initials: string };
};

export function Shell({ children, counts }: { children: React.ReactNode; counts: ShellCounts }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = findNavItem(pathname);
  const group = groupOf(pathname);

  const badgeValue = (key?: string) => (key ? (counts as unknown as Record<string, number>)[key] ?? 0 : 0);

  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      {/* Sidebar — desktop */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-bg lg:flex", collapsed ? "w-[64px]" : "w-[260px]")}>
        <div className={cn("flex h-[48px] items-center border-b border-line px-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href="/admin" className="font-sans text-[13px] font-bold tracking-[0.18em]">
              CLÉOPÂTRE
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="flex h-7 w-7 items-center justify-center border border-line text-[11px] hover:border-ink">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {NAV.map((g) => (
            <div key={g.key} className="mb-6">
              {!collapsed && <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{g.label}</p>}
              <ul className="space-y-px">
                {g.items.map((item) => {
                  const isActive = active?.href === item.href;
                  const badge = badgeValue(item.badge);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex h-9 items-center gap-3 px-3 font-sans text-[13px] transition-colors",
                          isActive ? "bg-ink text-paper" : "text-text-secondary hover:bg-bg-2 hover:text-ink",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0", isActive ? "bg-paper" : "bg-line")} />
                        {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                        {!collapsed && badge > 0 && (
                          <span className={cn("font-mono text-[10px] px-1.5 py-0.5", isActive ? "bg-paper text-ink" : "bg-ink text-paper")}>
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

        <div className="border-t border-line p-3">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <span className="flex h-7 w-7 items-center justify-center bg-ink text-paper font-mono text-[10px]">{counts.operator.initials}</span>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-sans text-[12px] font-medium">{counts.operator.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">{counts.operator.role}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px]">
              <span className={cn("h-1.5 w-1.5", counts.health === "ok" ? "bg-success" : counts.health === "warn" ? "bg-warning" : "bg-error")} />
              <span className="uppercase tracking-[0.06em] text-text-muted">{counts.health === "ok" ? "Système OK" : "Attention"}</span>
              <span className="ml-auto">{counts.attention} alertes</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex min-h-screen flex-col", collapsed ? "lg:pl-[64px]" : "lg:pl-[260px]")}>
        <header className="sticky top-0 z-30 flex h-[48px] items-center gap-3 border-b border-line bg-bg px-4">
          <button onClick={() => setMobileOpen(true)} className="flex h-8 w-8 items-center justify-center border border-line lg:hidden">
            <Menu size={14} />
          </button>
          <div className="hidden items-baseline gap-2 lg:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{group?.label ?? "Admin"}</span>
            <span className="text-line">/</span>
            <span className="font-sans text-[13px] font-medium">{active?.label ?? "Poste"}</span>
          </div>
          <div className="flex-1">
            <CommandPalette />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/attention" className="flex items-center gap-2 border border-line px-3 py-1.5 font-mono text-[11px]">
              <span className={cn("h-1.5 w-1.5", counts.attention > 0 ? "bg-error" : "bg-success")} />
              {counts.attention}
            </Link>
            <Link href="/admin/taches" className="hidden border border-line px-3 py-1.5 font-mono text-[11px] md:flex">
              {counts.tasks} tâches
            </Link>
          </div>
        </header>

        <main className="flex-1 bg-bg-2 p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside className="relative flex h-full w-[300px] flex-col border-r border-line bg-bg">
            <div className="flex h-[48px] items-center justify-between border-b border-line px-4">
              <span className="font-sans text-[13px] font-bold tracking-[0.18em]">CLÉOPÂTRE</span>
              <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center border border-line">
                <X size={14} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              {NAV.map((g) => (
                <div key={g.key} className="mb-6">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">{g.label}</p>
                  <ul className="space-y-px">
                    {g.items.map((item) => {
                      const isActive = active?.href === item.href;
                      return (
                        <li key={item.href}>
                          <Link href={item.href} onClick={() => setMobileOpen(false)} className={cn("flex h-9 items-center px-3 font-sans text-[13px]", isActive ? "bg-ink text-paper" : "hover:bg-bg-2")}>
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
