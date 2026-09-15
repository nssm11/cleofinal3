"use client";
import { useState, useTransition } from "react";
import {deletePromotionAction, moderateReviewAction, saveCustomerNoteAction, updateUserRoleAction, verifyReviewAction, resendOutboxEmailAction} from "@/actions/admin";
import { useToast } from "@/components/ui/toaster";
import { abtn, abtnGhost, afield } from "./ui";

function useRun() {
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { const r = await fn(); toast({ kind: r.ok ? "success" : "error", title: r.ok ? r.message ?? "OK" : r.error ?? "Erreur" }); });
  return { pending, run };
}
export function ReviewActions({ id }: { id: number }) {
  const { pending, run } = useRun();
  const [reply, setReply] = useState("");
  return (<div className="space-y-2"><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Réponse publique (facultatif)" className={afield} /><div className="flex gap-2"><button disabled={pending} onClick={() => run(() => moderateReviewAction(id, "approved", reply))} className={abtn}>Publier</button><button disabled={pending} onClick={() => run(() => moderateReviewAction(id, "rejected"))} className={`${abtnGhost} text-error`}>Rejeter</button></div></div>);
}
export function VerifyReview({ id }: { id: number }) {
  const { pending, run } = useRun();
  return <button disabled={pending} onClick={() => run(() => verifyReviewAction(id))} className={abtnGhost}>Marquer vérifié</button>;
}
export function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return <button onClick={() => window.print()} className="min-h-9 border border-admin-border px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-admin-muted transition-colors hover:border-admin-gold hover:text-admin-gold no-print">{label}</button>;
}

export function EmailResend({ id, status }: { id: number; status: string }) {
  const { pending, run } = useRun();
  if (status === "pending") return <span className="text-[9px] uppercase tracking-[0.14em] text-admin-muted">en file</span>;
  return (
    <button disabled={pending} onClick={() => run(() => resendOutboxEmailAction(id))} className="text-[9px] font-bold uppercase tracking-[0.14em] text-admin-gold hover:underline disabled:opacity-40">
      {pending ? "…" : "Renvoyer"}
    </button>
  );
}

export function DeletePromo({ id }: { id: number }) {
  const { pending, run } = useRun();
  return <button disabled={pending} onClick={() => confirm("Supprimer cette promotion ?") && run(() => deletePromotionAction(id))} className="text-xs text-error hover:underline">Supprimer</button>;
}
export function RoleSelect({ userId, role }: { userId: number; role: string }) {
  const { pending, run } = useRun();
  return <select disabled={pending} defaultValue={role} onChange={(e) => run(() => updateUserRoleAction(userId, e.target.value as "customer" | "support" | "admin"))} className={`${afield} max-w-[140px]`}><option value="customer">Client</option><option value="support">Support</option><option value="admin">Admin</option></select>;
}
export function CustomerNote({ userId, notes }: { userId: number; notes: string }) {
  const { pending, run } = useRun();
  const [n, setN] = useState(notes);
  return (<div className="space-y-2"><textarea value={n} onChange={(e) => setN(e.target.value)} rows={3} className={afield} placeholder="Notes internes sur ce client" /><button disabled={pending} onClick={() => run(() => saveCustomerNoteAction(userId, n))} className={abtnGhost}>Enregistrer</button></div>);
}
