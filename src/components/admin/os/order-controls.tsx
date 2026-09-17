"use client";
import type { OrderStatus } from "@/db/schema";
import { OsButton } from "./primitives";

export function OrderWorkflow({ orderId, status, nextStates }: { orderId: number; status: OrderStatus; nextStates?: OrderStatus[] }) {
  return (
    <div className="border border-line bg-bg p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Flux — {status}</p>
      <div className="mt-3 flex gap-2">
        {(nextStates ?? []).map((s) => <OsButton key={s} size="sm" variant="ghost">{s}</OsButton>)}
      </div>
    </div>
  );
}

export function PaymentControlOs({ orderId, method, status, total }: { orderId: number; method: string; status: string; total: number }) {
  return <div className="border border-line bg-bg p-4 font-mono text-[12px]"><p>{method} — {status} — {total / 1000} DT</p></div>;
}

export function OrderNotesOs({ orderId, internalNote, trackingCode }: { orderId: number; internalNote: string | null; trackingCode: string | null }) {
  return <div className="border border-line bg-bg p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">Notes</p><p className="mt-2 font-sans text-[13px]">{internalNote ?? "—"}</p><p className="mt-2 font-mono text-[11px]">{trackingCode ?? "Pas de tracking"}</p></div>;
}

export function OrderAge({ createdAt }: { createdAt: string }) {
  return <span className="font-mono text-[11px] text-text-muted">{new Date(createdAt).toLocaleDateString("fr-TN")}</span>;
}

export function OrderEventsLive({ orderId, initialCount }: { orderId: number; initialCount: number }) {
  return <span className="font-mono text-[11px]">{initialCount} événements</span>;
}

export function ResendLetter({ id, kind, status, subject, to, at, error }: { id: number; kind: string; status: string; subject: string; to: string; at: string | null; error: string | null }) {
  return <div className="border border-line p-3 font-mono text-[11px]"><p>{subject} → {to}</p><p className="text-text-muted">{status} {at}</p>{error && <p className="text-error">{error}</p>}</div>;
}
