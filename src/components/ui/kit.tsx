"use client";

import { forwardRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ChevronDownIcon, CloseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   THE INSTRUMENT KIT
   ──────────────────────────────────────────────────────────────────────────
   Every overlay, popover, tab set and disclosure in the house is built on
   Radix, then dressed by this file. Radix owns the hard parts — focus traps,
   scroll locks, roving tabindex, aria wiring, escape handling, collision
   detection — and the house owns the surface: porcelain sheets, obsidian
   scrims, sharp geometry, one accent.

   Nothing here re-implements accessibility. If a behaviour matters (a dialog
   that returns focus to its trigger, a menu that follows the keyboard, a tab
   set that survives RTL), it is delegated to the primitive that already got
   it right.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── THE SURFACE — a modal, centred on the desk ───────────────────────────── */
export const Modal = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    /** Hide the visible title (it remains for screen readers). */
    bare?: boolean;
  }
>(function Modal({ open, onOpenChange, title, description, children, footer, className, bare }, ref) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="scrim data-[state=open]:animate-[overlay-in_260ms_var(--ease-veil)] data-[state=closed]:animate-[overlay-out_200ms_var(--ease-veil)]" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "dialog fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "data-[state=open]:animate-[dialog-in_320ms_var(--ease-luxe)] data-[state=closed]:animate-[dialog-out_200ms_var(--ease-exit)]",
            className,
          )}
        >
          <div className="dialog-head">
            {bare ? (
              <VisuallyHidden.Root>
                <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              </VisuallyHidden.Root>
            ) : (
              <div>
                <DialogPrimitive.Title className="font-display text-[1.3rem] leading-tight text-ink">{title}</DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="mt-1.5 text-[0.8125rem] text-graphite">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
            )}
            <DialogPrimitive.Close
              className="-me-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center text-graphite transition-colors hover:text-ink"
              aria-label="Fermer"
            >
              <CloseIcon size={16} />
            </DialogPrimitive.Close>
          </div>
          <div className="dialog-body">{children}</div>
          {footer ? <div className="dialog-foot">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

/* ── THE DRAWER — a panel that comes in from an edge ──────────────────────── */
export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  children,
  className,
  bare,
  labelledBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left" | "bottom";
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bare?: boolean;
  labelledBy?: string;
}) {
  const motion =
    side === "bottom"
      ? "data-[state=open]:animate-[sheet-up_420ms_var(--ease-luxe)] data-[state=closed]:animate-[sheet-down_260ms_var(--ease-exit)]"
      : side === "left"
        ? "data-[state=open]:animate-[panel-left_420ms_var(--ease-luxe)] data-[state=closed]:animate-[panel-left-out_260ms_var(--ease-exit)]"
        : "data-[state=open]:animate-[panel-right_420ms_var(--ease-luxe)] data-[state=closed]:animate-[panel-right-out_260ms_var(--ease-exit)]";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="scrim data-[state=open]:animate-[overlay-in_260ms_var(--ease-veil)] data-[state=closed]:animate-[overlay-out_200ms_var(--ease-veil)]" />
        <DialogPrimitive.Content
          aria-labelledby={labelledBy}
          className={cn(
            "drawer",
            side === "right" && "drawer-right",
            side === "left" && "drawer-left",
            side === "bottom" && "drawer-bottom",
            motion,
            className,
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            {bare ? (
              <VisuallyHidden.Root>
                <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              </VisuallyHidden.Root>
            ) : (
              <div>
                <DialogPrimitive.Title className="micro text-ink">{title}</DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="mt-1.5 text-[0.8125rem] text-graphite">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
            )}
            <DialogPrimitive.Close
              className="-me-1 flex h-9 w-9 items-center justify-center text-graphite transition-colors hover:text-ink"
              aria-label="Fermer"
            >
              <CloseIcon size={16} />
            </DialogPrimitive.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ── THE TIP — a label that appears when asked ────────────────────────────── */
export function Tip({
  label,
  children,
  side = "top",
  asChild = true,
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  asChild?: boolean;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={220} skipDelayDuration={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className="tooltip z-[70] data-[state=delayed-open]:animate-[tip-in_180ms_var(--ease-luxe)]"
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/* ── THE MENU — a list of doors under a trigger ───────────────────────────── */
export function Menu({
  trigger,
  children,
  align = "end",
  sideOffset = 8,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "popover z-[70] min-w-52 data-[state=open]:animate-[dialog-in_200ms_var(--ease-luxe)]",
            className,
          )}
        >
          {children}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export const MenuItem = forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { icon?: ReactNode; danger?: boolean }
>(function MenuItem({ icon, danger, className, children, ...props }, ref) {
  return (
    <DropdownPrimitive.Item
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 px-2.5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] outline-none transition-colors",
        "data-[highlighted]:bg-ink data-[highlighted]:text-alabaster",
        danger && "text-error data-[highlighted]:bg-error data-[highlighted]:text-white",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </DropdownPrimitive.Item>
  );
});

export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <DropdownPrimitive.Label className="micro px-2.5 py-2 text-ash">{children}</DropdownPrimitive.Label>
);
export const MenuSeparator = () => <DropdownPrimitive.Separator className="my-1 h-px bg-rule" />;

/* ── THE TABS — two registers, one anatomy ────────────────────────────────── */
export function Tabs({
  tabs,
  value,
  onValueChange,
  children,
  variant = "line",
  className,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
  variant?: "line" | "segments";
  className?: string;
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List className={variant === "segments" ? "segs" : "tabs-line"}>
        {tabs.map((t) => (
          <TabsPrimitive.Trigger key={t.value} value={t.value} className="group">
            {t.label}
            {t.count !== undefined && <span className="num ms-2 text-[0.625rem] opacity-60">{t.count}</span>}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}
export const TabPanel = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => (
  <TabsPrimitive.Content value={value} className={cn("outline-none", className)}>
    {children}
  </TabsPrimitive.Content>
);

/* ── THE DISCLOSURE — sections that open ──────────────────────────────────── */
export function Disclosure({
  items,
  className,
  defaultValue,
}: {
  items: { value: string; title: ReactNode; meta?: ReactNode; content: ReactNode }[];
  className?: string;
  defaultValue?: string;
}) {
  return (
    <AccordionPrimitive.Root type="single" collapsible defaultValue={defaultValue} className={cn("border-t border-rule", className)}>
      {items.map((item) => (
        <AccordionPrimitive.Item key={item.value} value={item.value} className="border-b border-rule">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-start">
              <span className="font-display text-[1.05rem] text-ink">{item.title}</span>
              <span className="flex items-center gap-4">
                {item.meta ? <span className="micro text-ash">{item.meta}</span> : null}
                <PlusIcon
                  size={15}
                  className="shrink-0 text-graphite transition-transform duration-300 group-data-[state=open]:rotate-45"
                />
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-[disclose_320ms_var(--ease-luxe)] data-[state=closed]:animate-[disclose-out_220ms_var(--ease-exit)]">
            <div className="pb-6 text-[0.9375rem] leading-[1.75] text-graphite">{item.content}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

/* ── THE SWITCH — a state you set ─────────────────────────────────────────── */
export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-graphite">
        {label}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "relative h-5 w-9 shrink-0 border transition-colors duration-300",
          "border-rule-strong data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=unchecked]:bg-bone",
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block h-3.5 w-3.5 bg-alabaster transition-transform duration-300 ease-[var(--ease-luxe)]",
            "translate-x-0.5 data-[state=checked]:translate-x-[1.15rem] rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[1.15rem]",
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}

/* ── THE MEASURE — a quantity, drawn ──────────────────────────────────────── */
export function Meter({ value, max = 100, accent, label }: { value: number; max?: number; accent?: boolean; label?: string }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <ProgressPrimitive.Root value={pct} max={100} aria-label={label} className={cn("meter", accent && "meter-accent")}>
      <ProgressPrimitive.Indicator
        className={cn("block h-full transition-[width] duration-700 ease-[var(--ease-luxe)]", accent ? "bg-cinabre" : "bg-ink")}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

/* ── THE SCROLL AREA — a long list, kept tidy ─────────────────────────────── */
export function LongList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative overflow-hidden", className)} type="hover">
      <ScrollAreaPrimitive.Viewport className="h-full w-full">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex w-2 touch-none select-none py-0.5">
        <ScrollAreaPrimitive.Thumb className="flex-1 bg-mineral" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

/** Compact stepper used inside drawers and order lines. */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-center border border-rule-strong bg-alabaster" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuer"
        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-cinabre disabled:opacity-25"
      >
        <MinusIcon size={12} />
      </button>
      <span className="num flex h-9 min-w-8 items-center justify-center border-x border-rule text-[0.8125rem]" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Augmenter"
        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-cinabre disabled:opacity-25"
      >
        <PlusIcon size={12} />
      </button>
    </div>
  );
}

/** A select that looks like the rest of the instrument. */
export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <select
        {...props}
        className="field appearance-none pe-9 font-mono text-[0.6875rem] uppercase tracking-[0.12em]"
      >
        {children}
      </select>
      <ChevronDownIcon size={14} className="pointer-events-none absolute end-2 text-graphite" />
    </span>
  );
}
