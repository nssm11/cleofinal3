import type { Metadata } from "next";
import { SectionHead, Sheet, Tag } from "@/components/admin/os/primitives";

export const metadata: Metadata = { title: "Smoke tests" };
const checks = ["/", "/boutique", "/besoins", "/scanner", "/stock-live", "/quiz", "/api/health", "/api/search?q=spf", "/api/feeds/google"];
export default async function SmokeTestsPage() {
  return <div className="space-y-5"><SectionHead eyebrow="Quality" title="Automated smoke test dashboard" sub="New technical quality module listing critical routes and APIs to verify after each release." /><Sheet><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-os-line text-left os-label text-os-faint"><th className="py-2">Route</th><th>Expected</th><th>Status</th><th>Owner</th></tr></thead><tbody>{checks.map((route) => <tr key={route} className="border-b border-os-line"><td className="py-3 font-mono text-os-text">{route}</td><td>200 OK</td><td><Tag tone="good">configured</Tag></td><td className="text-os-muted">Release checklist</td></tr>)}</tbody></table></div></Sheet></div>;
}
