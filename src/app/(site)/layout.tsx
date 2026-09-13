import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { RebuildFooter, RebuildHeader } from "@/components/rebuild/rebuild-ui";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return <div className="rb-site"><RebuildHeader user={user} /><main id="contenu" className="rb-main">{children}</main><RebuildFooter /></div>;
}
