import Link from "next/link";

/**
 * 404 in house language: the reel snapped — but the projectionist hands you
 * a way back to the program, never a shrug.
 */
export default function NotFound() {
  return (
    <div className="light-cone grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-lg text-center">
        <svg viewBox="0 0 220 90" className="mx-auto w-64 text-ash" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {/* film strip torn in half */}
          <path d="M4 26h84M124 26h92M4 64h84M124 64h92" />
          <path d="M4 26v38M88 26v38M132 26v38M216 26v38" />
          <path d="M16 14h10v8H16zM16 68h10v8H16zM62 14h10v8H62zM62 68h10v8H62zM148 14h10v8h-10zM148 68h10v8h-10zM194 14h10v8h-10zM194 68h10v8h-10z" strokeOpacity="0.55" />
          <path d="M88 20 106 38 96 46 116 68" stroke="var(--color-cinnabar)" strokeWidth="2" strokeDasharray="1 4" />
          <path d="M124 68 106 50 118 42 100 22" stroke="var(--color-cinnabar)" strokeWidth="2" strokeDasharray="1 4" />
        </svg>
        <p className="label-mono mt-8 text-cinnabar">404 · SPLICE FAILED</p>
        <h1 className="display-tight mt-4 text-4xl font-bold text-bone">انقطعت البكرة</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-8 text-ash">
          هذه الصفحة ليست في الفهرس — لا نسخة، لا مسار، ولا وعد بأنها كانت يومًا هنا.
          يمكن العودة إلى البرنامج الحالي؛ هو دائمًا على الضوء.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-frame bg-tungsten px-6 text-sm font-semibold text-night transition-colors hover:bg-ember">
            برنامج الليلة
          </Link>
          <Link href="/films" className="inline-flex h-11 items-center rounded-frame border border-rule px-5 text-sm text-bone transition-colors hover:border-tungsten/50">
            تصفّح الأفلام
          </Link>
        </div>
      </div>
    </div>
  );
}
