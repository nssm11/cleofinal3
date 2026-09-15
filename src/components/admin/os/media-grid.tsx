"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { assignMediaAction, detachMediaAction, lookupProductsAction } from "@/actions/admin-os";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Glyph } from "./icons";
import { OsButton, Tag } from "./primitives";

/* ══════════════════════════════════════════════════════════════════════════
   MÉDIATHÈQUE
   ──────────────────────────────────────────────────────────────────────────
   The house does not store files: it stores *references to images in use*.
   So this screen answers three questions honestly — which plate belongs to
   which reference, which plate is used by nobody, and where a plate may be
   attached next. Attaching writes onto the product's gallery and leaves an
   audit line; detaching only removes the link, never the file.
   ══════════════════════════════════════════════════════════════════════════ */

export type Asset = {
  url: string;
  source: string;
  role: string;
  ownerId: number | null;
  ownerName: string;
  href: string;
  alts: string[];
  usedByProductIds: number[];
};

const SOURCE_LABEL: Record<string, string> = { produit: "Fiche produit", rayon: "Rayon", journal: "Journal", boutique: "Boutique" };
const ROLE_LABEL: Record<string, string> = { principale: "principale", galerie: "galerie", illustration: "illustration" };

export function MediaGrid({ assets, sources }: { assets: Asset[]; sources: { key: string; label: string; count: number }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<string | null>(null);
  const [onlyOrphans, setOnlyOrphans] = useState(false);
  const [broken, setBroken] = useState<Record<string, true>>({});
  const [attaching, setAttaching] = useState<Asset | null>(null);
  const [term, setTerm] = useState("");
  const [candidates, setCandidates] = useState<{ id: number; name: string; sku: string; image: string | null }[]>([]);
  const [role, setRole] = useState<"principale" | "galerie">("galerie");

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      assets.filter((a) => {
        if (source && a.source !== source) return false;
        if (onlyOrphans && a.usedByProductIds.length > 0) return false;
        if (!q) return true;
        return a.url.toLowerCase().includes(q) || a.ownerName.toLowerCase().includes(q) || a.alts.join(" ").toLowerCase().includes(q);
      }),
    [assets, source, onlyOrphans, q],
  );

  const search = (value: string) => {
    setTerm(value);
    if (value.trim().length < 3) { setCandidates([]); return; }
    void lookupProductsAction(value).then((rows) => setCandidates(rows));
  };

  const attach = (productId: number) =>
    start(async () => {
      if (!attaching) return;
      const r = await assignMediaAction({ productId, url: attaching.url, role });
      if (r.ok) {
        toast({ kind: "success", title: r.message ?? "Image rattachée." });
        setAttaching(null);
        setTerm("");
        setCandidates([]);
        router.refresh();
      } else toast({ kind: "error", title: r.error });
    });

  const detach = (asset: Asset, productId: number) =>
    start(async () => {
      const r = await detachMediaAction({ productId, url: asset.url });
      if (r.ok) { toast({ kind: "success", title: r.message ?? "Image détachée." }); router.refresh(); }
      else toast({ kind: "error", title: r.error });
    });

  const orphans = assets.filter((a) => a.usedByProductIds.length === 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Glyph name="searchSpark" size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-os-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="URL, référence, texte alternatif…"
            className="h-9 w-full border border-os-line bg-os-surface pl-8 pr-3 text-[13px] focus:border-os-line-strong focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSource(null)}
          className={cn("border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors", source === null ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line text-os-muted hover:text-os-text")}
        >
          Tout · {assets.length}
        </button>
        {sources.map((s) => (
          <button
            key={s.key}
            onClick={() => setSource(source === s.key ? null : s.key)}
            className={cn("border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors", source === s.key ? "border-os-ink bg-os-ink text-os-onink" : "border-os-line text-os-muted hover:text-os-text")}
          >
            {s.label} · {s.count}
          </button>
        ))}
        <button
          onClick={() => setOnlyOrphans((v) => !v)}
          className={cn("border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors", onlyOrphans ? "border-os-warn text-os-warn" : "border-os-line text-os-muted hover:text-os-text")}
        >
          Orphelines · {orphans.length}
        </button>
        {pending && <span className="os-num text-[11.5px] text-os-faint">écriture…</span>}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visible.map((a) => (
          <li key={a.url} className="border border-os-line bg-os-surface">
            <div className="relative aspect-square bg-os-surface-2">
              {broken[a.url] ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <Glyph name="alert" size={16} className="text-os-crit" />
                  <p className="text-[10.5px] leading-tight text-os-crit">Fichier introuvable à cette URL</p>
                </div>
              ) : (
                <img src={a.url} alt={a.alts[0] ?? ""} loading="lazy" onError={() => setBroken((b) => ({ ...b, [a.url]: true }))} className="h-full w-full object-cover" />
              )}
              <span className="absolute left-0 top-0 bg-os-ink/80 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-os-onink">{ROLE_LABEL[a.role] ?? a.role}</span>
              {a.usedByProductIds.length === 0 && <span className="absolute right-0 top-0 bg-os-warn-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-os-warn">orpheline</span>}
            </div>
            <div className="p-2">
              <p className="truncate text-[11.5px] text-os-text" title={a.ownerName}>{a.ownerName}</p>
              <p className="truncate text-[10px] text-os-faint" title={a.url}>{SOURCE_LABEL[a.source] ?? a.source} · {a.url.replace(/^https?:\/\//, "")}</p>
              {a.alts[0] ? <p className="mt-1 line-clamp-2 text-[10.5px] leading-tight text-os-muted">{a.alts[0]}</p> : <p className="mt-1 text-[10.5px] text-os-warn">texte alternatif manquant</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Link href={a.href} className="text-[10px] uppercase tracking-[0.12em] text-os-gold hover:underline">Ouvrir</Link>
                {a.source === "produit" && a.ownerId != null && (
                  <>
                    <button onClick={() => { setAttaching(a); setRole("galerie"); }} className="text-[10px] uppercase tracking-[0.12em] text-os-muted hover:text-os-text">rattacher</button>
                    {a.role !== "principale" && (
                      <button disabled={pending} onClick={() => detach(a, a.ownerId!)} className="text-[10px] uppercase tracking-[0.12em] text-os-crit hover:underline">détacher</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="mt-3 border border-dashed border-os-line-strong/70 p-5 text-[12.5px] text-os-muted">
          {onlyOrphans ? "Aucune image orpheline : chaque fichier référencé est utilisé par au moins une référence." : "Aucune image ne correspond à ce filtre. La médiathèque ne montre que les images réellement référencées par le catalogue, les rayons, le journal ou les boutiques."}
        </p>
      )}

      {attaching && (
        <div className="mt-4 border border-os-gold bg-os-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <img src={attaching.url} alt="" className="h-16 w-16 object-cover" />
              <div>
                <p className="os-label text-os-faint">Rattacher cette image à une autre référence</p>
                <p className="mt-0.5 max-w-[52ch] truncate text-[12px] text-os-muted">{attaching.url}</p>
              </div>
            </div>
            <OsButton variant="quiet" size="sm" onClick={() => setAttaching(null)}>Annuler</OsButton>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
            <input
              autoFocus
              value={term}
              onChange={(e) => search(e.target.value)}
              placeholder="Chercher la référence de destination (nom ou SKU, 3 caractères)"
              className="h-9 w-full border border-os-line bg-os-surface px-2.5 text-[13px] focus:border-os-line-strong focus:outline-none"
            />
            <select value={role} onChange={(e) => setRole(e.target.value as "principale" | "galerie")} className="h-9 w-full border border-os-line bg-os-surface px-2 text-[13px] focus:border-os-line-strong focus:outline-none">
              <option value="galerie">Ajouter à la galerie</option>
              <option value="principale">Devenir le visuel principal</option>
            </select>
            <span className="os-num self-center text-[11.5px] text-os-faint">{candidates.length} piste(s)</span>
          </div>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {candidates.map((c) => (
              <li key={c.id}>
                <button disabled={pending} onClick={() => attach(c.id)} className="flex w-full items-center gap-2.5 border border-os-line px-2.5 py-2 text-left transition-colors hover:border-os-line-strong hover:bg-os-surface-2">
                  {c.image ? <img src={c.image} alt="" className="h-8 w-8 object-cover" /> : <span className="grid h-8 w-8 place-items-center bg-os-surface-2 text-[9px] text-os-faint">IMG</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-os-text">{c.name}</span>
                    <span className="block truncate text-[10.5px] text-os-faint">{c.sku}</span>
                  </span>
                  <Tag tone={role === "principale" ? "gold" : "neutral"}>{role === "principale" ? "principale" : "galerie"}</Tag>
                </button>
              </li>
            ))}
            {term.trim().length >= 3 && candidates.length === 0 && <li className="text-[12px] text-os-muted">Aucune référence trouvée pour « {term} ».</li>}
          </ul>
          <p className="mt-2 text-[11.5px] leading-relaxed text-os-faint">
            Le fichier n&apos;est pas copié : la même URL est référencée par une seconde fiche. Si le visuel principal change, l&apos;ancien reste dans la galerie plutôt que de disparaître — la maison ne perd jamais une planche par accident.
          </p>
        </div>
      )}
    </div>
  );
}
