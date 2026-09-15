"use client";
import { useEffect, useRef, useState, useActionState } from "react";
import { resendOtpAction, verifyEmailAction } from "@/actions/auth";
import { useToast } from "@/components/ui/toaster";

/**
 * Six cells, one key. Each box takes one digit and moves on; paste of a full
 * code fills them all at once; the countdown runs from the server's number.
 * The resend button respects the 60-second cooldown — and the server always
 * re-checks it, so a fast finger only ever gets an honest answer.
 */
export function VerifyKeyForm({
  email,
  initialRemainingMs,
  locale,
}: {
  email: string;
  initialRemainingMs: number;
  locale: "fr" | "tn";
}) {
  const tn = locale === "tn";
  const [state, action, pending] = useActionState(verifyEmailAction, null);
  const [resendState, resendAction, resendPending] = useActionState(resendOtpAction, null);
  const { toast } = useToast();

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const deadlineRef = useRef(0);
  const [remaining, setRemaining] = useState(initialRemainingMs);
  const [resendIn, setResendIn] = useState(0);

  // The key's remaining life, ticked locally from the server's anchor
  // (the first paint already carries the server's number).
  useEffect(() => {
    if (deadlineRef.current === 0) deadlineRef.current = Date.now() + initialRemainingMs;
    const tick = () => setRemaining(Math.max(0, deadlineRef.current - Date.now()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [initialRemainingMs]);

  // Surface action feedback once; on success the page re-renders away.
  useEffect(() => {
    if (state) toast({ kind: state.ok ? "success" : "error", title: state.ok ? state.message ?? "✓" : state.error });
  }, [state, toast]);
  useEffect(() => {
    if (!resendState) return;
    if (resendState.ok) deadlineRef.current = Date.now() + 10 * 60 * 1000;
    toast({ kind: resendState.ok ? "success" : "error", title: resendState.ok ? resendState.message ?? "Nouveau code envoyé." : resendState.error });
  }, [resendState, toast]);

  // The 60-second re-issue pace, ticked while running.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length !== 6) return;
    e.preventDefault();
    setDigits(text.split(""));
    refs.current[5]?.focus();
  };

  // Optimistic: the new code has its own ten minutes, the cells clear, and
  // the re-issue clock starts — the server confirms (or refuses) by toast.
  const onResendSubmit = () => {
    setDigits(Array(6).fill(""));
    setResendIn(60);
    refs.current[0]?.focus();
  };

  const full = digits.join("");
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  const expired = remaining <= 0 && full.length < 6;

  return (
    <div className="space-y-7">
      <p className="text-[13px] leading-relaxed text-muted">
        {tn ? (
          <>
            El adresse : <span className="font-semibold text-ink">{email}</span>
          </>
        ) : (
          <>
            L&apos;adresse : <span className="font-semibold text-ink">{email}</span>
          </>
        )}
      </p>

      <form action={action} onPaste={onPaste} className="space-y-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`${tn ? "Chiffre" : "Chiffre"} ${i + 1}`}
              className="h-16 w-12 sm:h-[4.5rem] sm:w-14 rounded-[3px] border border-stone/70 bg-cream/50 text-center font-serif text-3xl sm:text-4xl text-ink caret-champagne-2 outline-none transition-[border-color,box-shadow] duration-300 focus:border-champagne-2 focus:shadow-[0_0_0_3px_rgba(196,168,124,0.15)]"
            />
          ))}
        </div>

        <div className="text-center">
          <button type="submit" disabled={pending || full.length < 6} className="btn-primary">
            {tn ? "Verifiha" : "Vérifier mon adresse"}
          </button>
        </div>
      </form>

      <div className="flex flex-col items-center gap-2">
        {expired ? (
          <p className="text-[12px] text-amber-700/80">
            {tn ? "El kod azyan." : "Ce code a expiré — demandez-en un nouveau."}
          </p>
        ) : (
          <p className="text-[12px] tabular-nums text-muted2">
            {tn ? "El kod valide fha" : "Code valable encore"} {mm}:{ss}
          </p>
        )}
        <form action={resendAction} onSubmit={onResendSubmit} className="inline">
          <button
            type="submit"
            disabled={resendPending || resendIn > 0}
            className="text-[12px] font-semibold uppercase tracking-[0.18em] text-champagne-2 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resendIn > 0
              ? tn
                ? `Be3tho merra f ${resendIn}s`
                : `Renvoyer dans ${resendIn}s`
              : tn
                ? "Be3thou el kod merra"
                : "Renvoyer le code"}
          </button>
        </form>
      </div>
    </div>
  );
}
