import type { ReactNode } from "react";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";

/**
 * Everything the archive shows (except the projection room) lives under this
 * shell: header, content, rights footer.
 */
export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
