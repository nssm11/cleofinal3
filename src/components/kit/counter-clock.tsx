"use client";

import { useEffect, useState } from "react";
import { formatSpans, formatTime, openState } from "@/lib/open-hours";
import { ClockIcon } from "@/components/icons";

/**
 * LE JOUR DU COMPTOIR — is the shop open, right now?
 *
 * The hours live in the database as the sentence a shopkeeper writes
 * ("Lun–Sam 8h30–20h30 · Dim 9h–14h"), and everything here is derived from
 * it, so the counter changes its hours in the back office and the site
 * follows without a deployment. Ramadan is a dated row in the same table.
 *
 * The clock is the one honest live thing on a mostly static site, so it is
 * also the one thing that must never lie: it is computed on the client, from
 * the visitor's own watch, and it re-reads that watch every minute. The
 * server renders the day's line only — never the verdict — because a cached
 * "ouvert" served at 21 h would be a promise the shop cannot keep.
 */

export type ClockTone = "day" | "night";

export function CounterClock({
  hours,
  tone = "day",
  compact = false,
  className,
}: {
  hours: string | null | undefined;
  tone?: ClockTone;
  compact?: boolean;
  className?: string;
}) {
  // Nothing that depends on "now" is rendered until the client has mounted.
  const [state, setState] = useState<ReturnType<typeof openState> | null>(null);

  useEffect(() => {
    if (!hours) return;
    const read = () => setState(openState(hours));
    read();
    const id = window.setInterval(read, 60_000);
    // A phone that wakes up has a watch that jumped: re-read immediately.
    const onWake = () => read();
    document.addEventListener("visibilitychange", onWake);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [hours]);

  const night = tone === "night";

  const shell = [
    "inline-flex items-center gap-2.5 border px-3 py-1.5",
    night ? "border-night-line text-chalk-muted" : "border-line/80 bg-canvas/60 text-muted",
    className ?? "",
  ].join(" ");

  // Before mount, and when the shop has written no hours, say only the day.
  if (!state) {
    return (
      <span className={shell} suppressHydrationWarning>
        <ClockIcon size={12} strokeWidth={1.5} className={night ? "text-chalk-faint" : "text-faint"} />
        <span className="kicker-xs">{hours ? "Horaires du comptoir" : "Horaires sur place"}</span>
      </span>
    );
  }

  const dot = state.open ? "bg-ok" : "bg-faint";
  const verdict = state.open
    ? `Ouvert · ferme à ${formatTime(state.nextChangeAt ?? 0)}`
    : state.nextChangeAt != null
      ? state.nextChangeLabel === "aujourd'hui"
        ? `Fermé · ouvre à ${formatTime(state.nextChangeAt)}`
        : `Fermé · ouvre ${state.nextChangeLabel} à ${formatTime(state.nextChangeAt)}`
      : "Fermé aujourd'hui";

  return (
    <span
      className={shell}
      title={`${formatSpans(state.today)}${state.label ? ` · ${state.label}` : ""}`}
      suppressHydrationWarning
    >
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <ClockIcon size={12} strokeWidth={1.5} className={night ? "text-chalk-faint" : "text-faint"} />
      <span className="kicker-xs">
        {state.open ? <span className="text-ok">{verdict}</span> : verdict}
      </span>
      {!compact && state.today.length > 0 && (
        <span className="kicker-xs hidden text-faint sm:inline">· {formatSpans(state.today)}</span>
      )}
      {state.label && !compact && (
        <span className="kicker-xs hidden text-iodine-deep md:inline">· {state.label}</span>
      )}
    </span>
  );
}
