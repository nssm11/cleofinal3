"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   LA FICHE TECHNIQUE — the product's details as a ruled specification.

   Radix carries the behaviour (arrow keys, roving focus, ARIA wiring); the
   look is the house's: ruled tabs in mono caps with a signal marker on the
   active one, and the panel set in editorial measure.
   ══════════════════════════════════════════════════════════════════════════ */

export type DetailPanel = { id: string; label: string; body: string };

export function DetailsTabs({ panels }: { panels: DetailPanel[] }) {
  if (panels.length === 0) return null;
  return (
    <Tabs.Root defaultValue={panels[0].id} className="w-full">
      <Tabs.List className="scrollbar-none flex gap-6 overflow-x-auto border-b border-line" aria-label="Détails du produit">
        {panels.map((p, i) => (
          <Tabs.Trigger
            key={p.id}
            value={p.id}
            className={cn("group relative shrink-0 whitespace-nowrap py-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-colors", "data-[state=active]:text-carbon hover:text-carbon")}
          >
            <span className="me-2 text-[0.5625rem] opacity-60">{String(i + 1).padStart(2, "0")}</span>
            {p.label}
            <span className="absolute inset-x-0 -bottom-px hidden h-[2px] bg-iodine group-data-[state=active]:block" />
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {panels.map((p) => (
        <Tabs.Content
          key={p.id}
          value={p.id}
          className="prose-cleo max-w-[68ch] pt-7 focus:outline-none"
        >
          {p.body.split("\n").filter(Boolean).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
