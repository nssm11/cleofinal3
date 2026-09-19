import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addonImplementations, findAddon } from "@/lib/addon-implementation";
import { PageIntro } from "@/components/shell/page-intro";
import { Chapter } from "@/components/kit/surfaces";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return addonImplementations.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const addon = findAddon((await params).id);
  if (!addon) return {};
  return {
    title: `${addon.id} — ${addon.title}`,
    description: addon.summary,
    alternates: { canonical: `/addons/${addon.id}` },
  };
}

export default async function AddonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const addon = findAddon((await params).id);
  if (!addon) notFound();

  return (
    <div>
      <PageIntro
        kicker={addon.area}
        index={addon.id}
        rail="Add-on"
        title={
          <>
            {addon.title}
          </>
        }
        intro={addon.summary}
        breadcrumbs={[{ href: "/", label: "Accueil" }, { href: "/addons", label: "240 add-ons" }, { label: addon.id }]}
        right={
          <>
            <Link href={addon.href} className="btn-solid">
              {addon.primaryAction}
            </Link>
            <Link href={addon.jsonHref} className="btn-ghost">
              JSON
            </Link>
          </>
        }
      >
        <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Mode" value={addon.mode} />
          <Fact label="Kind" value={addon.kind} />
          <Fact label="Owner" value={addon.owner} />
          <Fact label="Installed" value={addon.installed ? "yes" : "no"} />
        </div>
      </PageIntro>

      <section className="shell-wide py-block lg:py-block-lg">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_1fr]">
          <Chapter
            index="01"
            label="Acceptance"
            title="How this add-on is verified"
            lede="Every add-on has a route, exportable metadata and a local operating state in the add-ons workspace."
          />
          <div className="grid gap-px bg-line md:grid-cols-2">
            {addon.acceptance.map((line, index) => (
              <article key={line} className="bg-canvas p-5">
                <p className="tick text-iodine">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-4 text-[14px] leading-relaxed text-muted">{line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-porcelain py-block">
        <div className="shell-wide grid gap-10 lg:grid-cols-[0.42fr_1fr]">
          <Chapter index="02" label="Routes" title="Open, inspect, export" />
          <div className="grid gap-px bg-line md:grid-cols-3">
            {addon.relatedRoutes.map((route) => (
              <Link key={route.href} href={route.href} className="group bg-canvas p-5 transition-colors hover:bg-iodine/5">
                <p className="kicker-xs text-faint">{route.label}</p>
                <p className="mt-4 break-all text-[13px] leading-relaxed text-carbon group-hover:text-iodine-deep">{route.href}</p>
              </Link>
            ))}
            <Link href={addon.csvHref} className="group bg-canvas p-5 transition-colors hover:bg-iodine/5">
              <p className="kicker-xs text-faint">CSV export</p>
              <p className="mt-4 break-all text-[13px] leading-relaxed text-carbon group-hover:text-iodine-deep">{addon.csvHref}</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas p-6">
      <p className="kicker-xs text-muted">{label}</p>
      <p className="mt-3 font-ant text-[1.9rem] uppercase leading-none text-carbon">{value}</p>
    </div>
  );
}
