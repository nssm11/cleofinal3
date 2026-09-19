"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookIcon, BoxesIcon, ChartIcon, ChatIcon, HomeIcon, ListIcon, PackageIcon, SearchIcon, StarIcon, StoreIcon, TagIcon, UsersIcon, ChevronRightIcon, SendIcon, SparkIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type Item = { href: string; l: string; i: typeof HomeIcon; admin?: boolean };
const groups: { label: string; items: Item[] }[] = [
  {
    label: "Pilotage",
    items: [
      { href: "/admin", l: "Vue d'ensemble", i: HomeIcon },
      { href: "/admin/commandes", l: "Commandes", i: PackageIcon },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/produits", l: "Produits", i: BoxesIcon },
      { href: "/admin/stock", l: "Stock & inventaire", i: ChartIcon },
      { href: "/admin/lots", l: "Lots & péremption", i: BoxesIcon },
      { href: "/admin/promotions", l: "Promotions", i: TagIcon, admin: true },
      { href: "/admin/avis", l: "Avis clients", i: StarIcon },
      { href: "/admin/mise-en-scene", l: "Mise en scène", i: SparkIcon },
    ],
  },
  {
    label: "Relation client",
    items: [
      { href: "/admin/clients", l: "Clientes & clients", i: UsersIcon },
      { href: "/admin/support", l: "Support & retours", i: ChatIcon },
      { href: "/admin/recherches", l: "Recherches", i: SearchIcon },
      { href: "/admin/emails", l: "E-mails", i: SendIcon, admin: true },
    ],
  },
  {
    label: "Contenu & maison",
    items: [
      { href: "/admin/journal", l: "Journal", i: BookIcon, admin: true },
      { href: "/admin/boutiques", l: "Boutiques", i: StoreIcon, admin: true },
    ],
  },
  {
    label: "Conformité",
    items: [{ href: "/admin/audit", l: "Journal d'audit", i: ListIcon, admin: true }],
  },
];

export function AdminNav({ role }: { role: string }) {
  const p = usePathname();
  const isActive = (href: string) => (href === "/admin" ? p === href : p.startsWith(href));
  return (
    <nav aria-label="Administration">
      {/* mobile horizontal */}
      <div className="lg:hidden">
        <ul className="no-scrollbar-x flex gap-1.5 overflow-x-auto pb-1">
          {groups.flatMap((g) => g.items).filter((i) => !i.admin || role === "admin").map((it) => {
            const active = isActive(it.href);
            return (
              <li key={it.href} className="shrink-0">
                <Link href={it.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-10 items-center gap-2 border px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                  active ? "border-iodine bg-iodine text-carbon" : "border-line text-muted hover:text-carbon")}>
                  <it.i size={13} />{it.l}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* desktop rail */}
      <div className="hidden space-y-7 lg:block">
        {groups.map((g) => {
          const items = g.items.filter((i) => !i.admin || role === "admin");
          if (!items.length) return null;
          return (
            <div key={g.label}>
              <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.26em] text-muted/70">{g.label}</p>
              <ul className="space-y-0.5">
                {items.map((it) => {
                  const active = isActive(it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        aria-current={active ? "page" : undefined}
                        className={cn("group relative flex min-h-11 items-center gap-3 px-3 text-[13px] transition-colors duration-200",
                          active ? "bg-iodine/10 text-carbon" : "text-muted hover:bg-porcelain hover:text-carbon")}
                      >
                        <span aria-hidden className={cn("absolute inset-y-2 left-0 w-0.5 transition-colors", active ? "bg-iodine" : "bg-transparent group-hover:bg-line")} />
                        <it.i size={15} className={cn(active ? "text-iodine" : "text-muted")} />
                        {it.l}
                        {active && <ChevronRightIcon size={12} className="ml-auto text-iodine" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
