"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({ children, className }: { children: ReactNode; delay?: number; y?: number; className?: string; once?: boolean }) {
  return <div className={cn(className)}>{children}</div>;
}
export function Stagger({ children, className }: { children: ReactNode; className?: string; step?: number; as?: "div" | "ul" }) {
  return <div className={className}>{children}</div>;
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  return <div className={className}>{children}</div>;
}
export function Presence({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? <>{children}</> : null;
}
export function AnimatedNumber({ value, format, spec }: { value: number; format?: (v: number) => string; spec?: any }) {
  return <>{format ? format(value) : value}</>;
}
export function SpringCounter({ value }: { value: number }) {
  return <>{value}</>;
}
export function CountOnView({ value, format, className, fallback = "0" }: { value: number; format?: (v: number) => string; spec?: any; className?: string; fallback?: string }) {
  return <span className={className}>{format ? format(value) : value ?? fallback}</span>;
}
export function LiveValue({ value, className, format }: { value: number; className?: string; format?: (v: number) => string }) {
  return <span className={className}>{format ? format(value) : value}</span>;
}
export function AnimatedRows({ children, className }: { children: ReactNode; className?: string; as?: "div" | "ul" | "tbody" }) {
  return <div className={className}>{children}</div>;
}
