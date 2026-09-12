"use client";
import { useEffect, useId, useRef, useState, useTransition, useActionState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@/components/icons";
import { Field } from "@/components/ui/primitives";
import { EASE_LUXE } from "@/lib/motion";
import { saveBirthDateAction } from "@/actions/experience";
import { useCopy } from "@/lib/i18n/client";

/**
 * The progress ring — one hairline circle filled by champagne, animated once
 * on view. A ring, not a bar: the gesture reads as a seal, the house's mark.
 */
export function VipRing({ pct, label }: { pct: number; label: string }) {
  const id = useId();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(reduce);
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <div ref={ref} className="relative mx-auto h-[150px] w-[150px] lg:h-[168px] lg:w-[168px]">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`vip-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#cbb078" />
            <stop offset="100%" stopColor="#a3803f" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={R} fill="none" stroke="#ddd3bd" strokeOpacity="0.55" strokeWidth="2" />
        <motion.circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={`url(#vip-${id})`}
          strokeWidth="3.5"
          strokeLinecap="butt"
          strokeDasharray={C}
          initial={{ strokeDashoffset: seen ? undefined : C }}
          animate={{ strokeDashoffset: C * (1 - Math.min(1, Math.max(0, pct))) }}
          transition={reduce ? { duration: 0 } : { duration: 1.4, ease: EASE_LUXE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[clamp(1.7rem,3vw,2.1rem)] leading-none tabular-nums text-ink">{Math.round(pct * 100)}%</span>
        <span className="mt-2 max-w-[7rem] text-[9px] font-bold uppercase leading-[1.5] tracking-[0.18em] text-muted-2">{label}</span>
      </div>
    </div>
  );
}

export function BirthdayForm({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState(saveBirthDateAction, null);
  const copy = useCopy();
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <Field label={copy.vip.birthdayDate}>
        <input type="date" name="birthDate" defaultValue={initial} min="1900-01-01" max={new Date().toISOString().slice(0, 10)} className="field !min-h-11" />
      </Field>
      <button disabled={pending} className="btn-secondary !min-h-11 px-5">
        {pending ? "…" : copy.common.save}
      </button>
      {state?.ok && (
        <p className="text-[12px] text-success" role="status">
          {copy.vip.birthdaySaved}
        </p>
      )}
      {state && !state.ok && <p className="text-[12px] text-error" role="alert">{state.error}</p>}
    </form>
  );
}

export function PerkCheck() {
  return (
    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-start justify-center border border-champagne-2 bg-champagne-soft/70 text-champagne-2">
      <CheckIcon size={9} />
    </span>
  );
}
