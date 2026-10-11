import type { ReactNode } from "react";

/**
 * The projection room — an immersive route group with no site chrome:
 * just a hairline top rail and the screen. Back is a real action, never
 * an orphaned tab.
 */
export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-bone">
      {children}
    </div>
  );
}
