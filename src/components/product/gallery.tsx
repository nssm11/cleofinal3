"use client";
import { ProductImage } from "@/components/catalog/product-image";
import { MEDIA_SIZES } from "@/lib/media";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloseIcon, PlusIcon, MinusIcon } from "@/components/icons";
import { EASE_LUXE, D, leave } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

/**
 * LA VITRINE DU PRODUIT — the product theatre.
 *
 * The packaging is never distorted and never cropped by an overlay: the plate
 * stays whole, and interaction happens *around* it.
 *
 *   · approaching the plate  → the image enlarges gently, following the cursor
 *   · leaving                 → it returns to exactly 1:1
 *   · clicking                → a full-screen viewing, where the label is read
 *   · arrow keys              → move through the gallery
 *
 * Touch devices skip the hover magnification (it would fight the scroll) and go
 * straight to the full-screen view.
 */
export function ProductGallery({
  images,
  alts,
  name,
  badge,
  sku,
  volume,
  brandName,
  out,
}: {
  images: string[];
  alts?: string[];
  name: string;
  badge?: React.ReactNode;
  sku: string;
  volume: string | null;
  brandName: string | null;
  out: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [full, setFull] = useState(false);
  const plateRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const list = images.length > 0 ? images : [""];
  const many = list.length > 1;
  const current = list[Math.min(index, list.length - 1)];
  const altFor = (i: number) => {
    const a = alts?.[i]?.trim();
    return a ? a : `${name}${brandName ? ` — ${brandName}` : ""}`;
  };
  const canZoom = !out;

  useFocusTrap(lightboxRef, full);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduce || !canZoom) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
      setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
    },
    [reduce, canZoom],
  );

  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + list.length) % list.length),
    [list.length],
  );

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight" && many) step(1);
      if (e.key === "ArrowLeft" && many) step(-1);
    };
    const prev = document.body.style.overflow;
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [full, many, step]);

  return (
    <>
      <div className={cn("flex gap-4", many ? "flex-col sm:flex-row-reverse sm:gap-5" : "")}>
        {/* The plate */}
        <div className="relative flex-1">
          <div
            ref={plateRef}
            onPointerMove={onMove}
            onPointerEnter={() => canZoom && setZoom(true)}
            onPointerLeave={() => {
              setZoom(false);
              setOrigin("50% 50%");
            }}
            className={cn("relative aspect-square w-full overflow-hidden bg-bone-2", out && "saturate-[0.4]")}
          >
            <motion.button
              type="button"
              onClick={() => setFull(true)}
              aria-label={`Agrandir la photographie de ${name}`}
              className="absolute inset-0 z-10 h-full w-full cursor-zoom-in"
              tabIndex={-1}
            />
              <ProductImage
                src={current}
                alt={altFor(Math.min(index, list.length - 1))}
                priority
                sizes={MEDIA_SIZES.gallery}
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={
                  !reduce && zoom
                    ? { transform: "scale(1.14)", transformOrigin: origin, transitionDuration: "260ms" }
                    : { transform: "scale(1)", transformOrigin: origin }
                }
              />

            {/* Marks */}
            <div className="pointer-events-none absolute left-5 top-5 z-20 flex flex-col items-start gap-2">{badge}</div>

            {/* The frame note — reference and volume, set as a caption */}
            <p className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 bg-gradient-to-t from-porcelain/85 to-transparent px-5 pb-3 pt-8 text-[9.5px] font-bold uppercase tracking-[0.22em] text-graphite">
              <span>{brandName ?? "Cléopâtre"} · Réf. {sku}</span>
              <span>{volume}</span>
            </p>
          </div>

          {many && (
            <p className="mt-3 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-ash">
              <span>
                {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
              </span>
              <span className="hidden sm:inline">Cliquez pour agrandir</span>
            </p>
          )}
        </div>

        {/* The rail of plates */}
        {many && (
          <ul className="scrollbar-none flex gap-3 overflow-x-auto sm:w-[86px] sm:shrink-0 sm:flex-col sm:overflow-visible">
            {list.map((src, i) => (
              <li key={`${src}-${i}`} className="shrink-0">
                <button
                  onClick={() => setIndex(i)}
                  aria-label={`Photographie ${i + 1} sur ${list.length}`}
                  aria-current={i === index}
                  className={cn(
                    "relative block h-[78px] w-[68px] overflow-hidden bg-bone-2 transition-opacity duration-300 sm:h-[96px] sm:w-full",
                    i === index ? "opacity-100" : "opacity-45 hover:opacity-80",
                  )}
                >
                  <ProductImage src={src} alt="" sizes={MEDIA_SIZES.rail} className="object-cover" />
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-px bg-cinabre-2 transition-transform duration-500",
                      i === index ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── The full-screen viewing ─────────────────────────────────── */}
      <AnimatePresence>
        {full && (
          <motion.div
            key="lightbox"
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Photographie de ${name}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: leave }}
            transition={{ duration: D.base, ease: EASE_LUXE }}
            className="fixed inset-0 z-[90] flex flex-col bg-night/96 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 lg:px-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-porcelain/55">
                {brandName} — {name}
              </span>
              <button
                onClick={() => setFull(false)}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center text-porcelain/70 transition-colors hover:text-porcelain"
              >
                <CloseIcon size={22} />
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-16 lg:px-16">
              {current && (
                <motion.div
                  initial={reduce ? false : { scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: D.base, ease: EASE_LUXE }}
                  className="relative h-full w-full max-w-4xl"
                >
                  <ProductImage src={current} alt={altFor(Math.min(index, list.length - 1))} sizes={MEDIA_SIZES.lightbox} className="object-contain" priority />
                </motion.div>
              )}
            </div>
            {many && (
              <div className="flex items-center justify-center gap-8 pb-8">
                <button
                  onClick={() => step(-1)}
                  aria-label="Photographie précédente"
                  className="flex h-12 w-12 items-center justify-center border border-porcelain/25 text-porcelain/80 transition-colors hover:border-porcelain hover:text-porcelain"
                >
                  <MinusIcon size={16} />
                </button>
                <span className="text-[11px] tabular-nums text-porcelain/60">
                  {index + 1} / {list.length}
                </span>
                <button
                  onClick={() => step(1)}
                  aria-label="Photographie suivante"
                  className="flex h-12 w-12 items-center justify-center border border-porcelain/25 text-porcelain/80 transition-colors hover:border-porcelain hover:text-porcelain"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
