"use client";
import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon, PlusIcon, TrashIcon, CheckIcon } from "@/components/icons";
import { routineSaveAction, routineStepAction } from "@/actions/routines";
import { formatDT } from "@/lib/money";
import { D, EASE_LUXE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/api";

/**
 * MON RITUEL — l'éditeur de routine.
 *
 * Le glisser-déposer est là, mais il n'est **jamais le seul chemin** : chaque
 * étape porte aussi deux flèches et un champ de position. Une interface qu'on
 * ne peut pas conduire au clavier n'est pas une interface, c'est une
 * démonstration — et réordonner sa routine est exactement le genre de geste
 * qu'on doit pouvoir faire sans souris.
 *
 * Le dépôt est borné côté serveur : l'indice envoyé n'est qu'une intention, la
 * position réelle est recalculée depuis la routine telle qu'elle est en base.
 */

export type RoutineStep = {
  id: number;
  position: number;
  note: string | null;
  productId: number;
  slug: string;
  name: string;
  brandName: string | null;
  image: string | null;
  volume: string | null;
  priceMillimes: number;
  stock: number;
};

export type Routine = {
  id: number;
  name: string;
  moment: string;
  steps: RoutineStep[];
};

const MOMENTS = [
  { value: "matin", label: "Le matin" },
  { value: "soir", label: "Le soir" },
  { value: "les-deux", label: "Matin et soir" },
] as const;

/** Ordre dans lequel un pharmacien pose les soins : du plus fluide au plus gras. */
export const STEP_ORDER_HINT =
  "Nettoyant, lotion, sérum, contour des yeux, crème, puis protection solaire le matin.";

export function RoutineEditor({ routines, candidates }: { routines: Routine[]; candidates: { id: number; name: string; brandName: string | null }[] }) {
  const [saveState, saveAction, saving] = useActionState<ActionResult | null, FormData>(routineSaveAction, null);
  const [stepState, stepAction, stepping] = useActionState<ActionResult | null, FormData>(routineStepAction, null);
  const [activeId, setActiveId] = useState<number | null>(routines[0]?.id ?? null);
  const [dragId, setDragId] = useState<number | null>(null);
  /**
   * Le choix de soins est ouvert d'emblée sur la routine active : c'est le
   * geste pour lequel on vient sur cette page, le cacher derrière un clic de
   * plus n'aiderait personne — et une routine vide sans moyen visible d'y
   * mettre quelque chose est une impasse.
   */
  const [picker, setPicker] = useState<number | null>(routines[0]?.id ?? null);
  const reduce = useReducedMotion();

  const active = routines.find((r) => r.id === activeId) ?? routines[0] ?? null;
  const notice = stepState ?? saveState;

  return (
    <div>
      {/* ── Les routines ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3 border-b border-stone pb-4">
        {routines.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveId(r.id)}
            aria-pressed={active?.id === r.id}
            className={cn(
              "border px-4 py-2 text-left transition-colors",
              active?.id === r.id ? "border-ink bg-cream" : "border-stone hover:border-champagne",
            )}
          >
            <span className="block text-[14px] text-ink">{r.name}</span>
            <span className="block text-[10.5px] uppercase tracking-[0.14em] text-muted-2">
              {MOMENTS.find((m) => m.value === r.moment)?.label ?? r.moment} · {r.steps.length} étape
              {r.steps.length > 1 ? "s" : ""}
            </span>
          </button>
        ))}
      </div>

      {/* ── Créer / renommer / supprimer ─────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <form action={saveAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="intent" value="create" />
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="routine-name" className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-2">
              Nouvelle routine
            </label>
            <input id="routine-name" name="name" required maxLength={80} placeholder="Hiver, peau sèche…" className="field" />
          </div>
          <div>
            <label htmlFor="routine-moment" className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-2">
              Moment
            </label>
            <select id="routine-moment" name="moment" className="field" defaultValue="matin">
              {MOMENTS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <button disabled={saving} className="btn-secondary whitespace-nowrap">
            <PlusIcon size={15} /> Créer
          </button>
        </form>

        {active && (
          <form action={saveAction}>
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="routineId" value={active.id} />
            <input type="hidden" name="name" value={active.name} />
            <button
              disabled={saving}
              onClick={() => {
                if (!confirm(`Supprimer la routine « ${active.name} » et ses ${active.steps.length} étape(s) ?`)) {
                  // Empêcher l'envoi : la confirmation n'est pas décorative.
                  throw new Error("annulé");
                }
              }}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[12px] text-muted transition-colors hover:text-error"
            >
              <TrashIcon size={14} /> Supprimer cette routine
            </button>
          </form>
        )}
      </div>

      {notice && (
        <p
          className={cn(
            "mt-4 border-l-2 px-4 py-2.5 text-[13px]",
            notice.ok ? "border-success bg-success-soft text-success" : "border-error bg-error-soft text-error",
          )}
          role={notice.ok ? "status" : "alert"}
        >
          {notice.ok ? notice.message : notice.error}
        </p>
      )}

      {!active ? (
        <p className="mt-10 text-sm text-muted">
          Créez une première routine ci-dessus. Une routine du matin et une routine du soir ne
          sont pas la même chose — vous pouvez en avoir autant que vous voulez.
        </p>
      ) : (
        <>
          <p className="mt-8 text-[12.5px] leading-relaxed text-muted">
            <span className="font-bold uppercase tracking-[0.14em] text-champagne-2">L&apos;ordre compte.</span>{" "}
            {STEP_ORDER_HINT}
          </p>

          {/* ── Les étapes ───────────────────────────────────────────────── */}
          <ol className="mt-5 space-y-2.5" aria-label={`Étapes de la routine ${active.name}`}>
            {active.steps.length === 0 && (
              <li className="border border-dashed border-stone-2 px-5 py-8 text-center text-[13.5px] text-muted">
                Cette routine est vide. Ajoutez un soin ci-dessous.
              </li>
            )}

            {active.steps.map((s, i) => (
              <motion.li
                key={s.id}
                layout={!reduce}
                transition={{ duration: D.base, ease: EASE_LUXE }}
                draggable
                onDragStart={() => setDragId(s.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId == null || dragId === s.id) return;
                  const form = new FormData();
                  form.set("intent", "move");
                  form.set("routineId", String(active.id));
                  form.set("stepId", String(dragId));
                  form.set("to", String(i));
                  stepAction(form);
                }}
                className={cn(
                  "flex items-center gap-3 border bg-paper px-3 py-3 transition-colors",
                  dragId === s.id ? "border-champagne opacity-60" : "border-stone",
                )}
              >
                <span
                  aria-hidden
                  className="cursor-grab text-[13px] tabular-nums text-muted-2 active:cursor-grabbing"
                  title="Glisser pour réordonner"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="relative h-14 w-11 shrink-0 bg-stone">
                  {s.image && <Image src={s.image} alt="" fill sizes="44px" className="object-cover" />}
                </div>

                <div className="min-w-0 flex-1">
                  {s.brandName && <p className="eyebrow text-muted">{s.brandName}</p>}
                  <Link href={`/produit/${s.slug}`} className="block truncate text-[14px] text-ink hover:text-champagne-2">
                    {s.name}
                  </Link>
                  <p className="text-[11.5px] text-muted-2">
                    {s.volume ? `${s.volume} · ` : ""}
                    {formatDT(s.priceMillimes)}
                    {s.stock <= 0 && <span className="ml-2 text-warning">épuisé</span>}
                  </p>
                  {s.note && <p className="mt-1 text-[12px] italic text-muted">« {s.note} »</p>}
                </div>

                {/* Le clavier d'abord : deux flèches valent mieux qu'un geste
                    que rien n'annonce. */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <form action={stepAction}>
                    <input type="hidden" name="intent" value="move" />
                    <input type="hidden" name="routineId" value={active.id} />
                    <input type="hidden" name="stepId" value={s.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      disabled={stepping || i === 0}
                      aria-label={`Monter « ${s.name} » d'un cran`}
                      className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-30"
                    >
                      <ArrowLeftIcon size={14} className="rotate-90" />
                    </button>
                  </form>
                  <form action={stepAction}>
                    <input type="hidden" name="intent" value="move" />
                    <input type="hidden" name="routineId" value={active.id} />
                    <input type="hidden" name="stepId" value={s.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      disabled={stepping || i === active.steps.length - 1}
                      aria-label={`Descendre « ${s.name} » d'un cran`}
                      className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-30"
                    >
                      <ArrowRightIcon size={14} className="rotate-90" />
                    </button>
                  </form>
                  <form action={stepAction}>
                    <input type="hidden" name="intent" value="remove" />
                    <input type="hidden" name="routineId" value={active.id} />
                    <input type="hidden" name="stepId" value={s.id} />
                    <button
                      disabled={stepping}
                      aria-label={`Retirer « ${s.name} » de la routine`}
                      className="flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-error"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </form>
                </div>
              </motion.li>
            ))}
          </ol>

          {/* ── Ajouter ──────────────────────────────────────────────────── */}
          <div className="mt-6 border border-stone bg-cream/40 p-4">
            <button
              onClick={() => setPicker((v) => (v === active.id ? null : active.id))}
              aria-expanded={picker === active.id}
              className="flex w-full items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
            >
              <PlusIcon size={15} className="text-champagne-2" /> Ajouter un soin à cette routine
              <ChevronDownIcon size={14} className={cn("ml-auto transition-transform", picker === active.id && "rotate-180")} />
            </button>

            {picker === active.id && (
              <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto border-t border-stone pt-3">
                {candidates.length === 0 && <p className="text-[13px] text-muted">Aucune référence disponible.</p>}
                {candidates.map((c) => (
                  <form key={c.id} action={stepAction} className="flex items-center gap-3">
                    <input type="hidden" name="intent" value="add" />
                    <input type="hidden" name="routineId" value={active.id} />
                    <input type="hidden" name="productId" value={c.id} />
                    <button
                      disabled={stepping}
                      className="flex w-full items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-paper"
                    >
                      <CheckIcon size={14} className="shrink-0 text-champagne-2" />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                        {c.brandName && <span className="text-muted">{c.brandName} · </span>}
                        {c.name}
                      </span>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-[11.5px] leading-relaxed text-muted-2">
            Une routine n&apos;est pas une ordonnance : si deux actifs irritent ensemble,
            n&apos;en gardez qu&apos;un. Un pharmacien tranche au 71 450 210.
          </p>
        </>
      )}
    </div>
  );
}
