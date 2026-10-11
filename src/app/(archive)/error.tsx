"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * The honest breaker: what happened, a retry that actually remounts the
 * route, and the two doors out.
 */
export default function ArchiveError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("khayal:route-error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="label-mono text-cinnabar">PROJECTOR FAULT</p>
      <h1 className="display-tight mt-4 text-3xl font-bold">تعطل شيء في غرفة العرض</h1>
      <p className="mt-4 text-sm leading-7 text-ash">
        الخطأ مسجّل داخليًا (digest: <span dir="ltr" className="font-mono text-xs">{error.digest ?? "—"}</span>).
        أعد التشغيل أولًا — غالبًا تكفي لمسة.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-frame bg-tungsten px-6 text-sm font-semibold text-night hover:bg-ember">
          إعادة المحاولة
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-frame border border-rule px-5 text-sm text-bone hover:border-tungsten/50">
          العودة للبرنامج
        </Link>
      </div>
    </div>
  );
}
