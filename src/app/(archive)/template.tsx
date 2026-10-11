import type { ReactNode } from "react";

/**
 * Navigation transition: a single quiet rise on root change — context shift
 * is acknowledged, content is never gated behind theater. Reduced motion
 * flattens it (see the keyframe guards in globals.css).
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-[riseIn_320ms_var(--ease-projector)]">{children}</div>;
}
