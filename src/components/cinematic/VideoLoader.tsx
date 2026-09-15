"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * VideoLoader — the loading machinery of the film.
 *
 * A scene is a full-viewport poster first. The <video> element is not even in
 * the DOM until the scene approaches the viewport (IntersectionObserver with a
 * generous margin), so the six chapters of the homepage never compete for
 * bandwidth on first paint. Once armed, the video streams with
 * `preload="metadata"`, the first frame crossfades over the poster, and a hair
 * of light reports the buffered progress while the scene is still silent.
 */

export type VideoSources = {
  /** 1920×1080 web export — desktop and up. */
  desktop: string;
  /** 1080×1920 web export — handsets. */
  mobile: string;
};

type Loaded = { ready: boolean; progress: number };

/**
 * Arms a video when its `target` comes within `rootMargin` of the viewport.
 * Arming is one-way: a chapter, once shown, stays playable.
 */
export function useCinematicVideo(target: React.RefObject<HTMLElement | null>, { rootMargin = "125% 0px" }: { rootMargin?: string } = {}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (armed || !target.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(target.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, rootMargin]);

  return armed;
}

export function CinematicVideo({
  sources,
  poster,
  alt,
  eager = false,
  className,
  videoClassName,
}: {
  sources: VideoSources;
  poster: string;
  alt: string;
  /** The opening frame arms immediately instead of waiting for the observer. */
  eager?: boolean;
  className?: string;
  videoClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState<Loaded>({ ready: false, progress: 0 });
  const [failed, setFailed] = useState(false);
  const armed = useCinematicVideo(ref, {});
  const active = armed || eager;
  // Reduced motion: the film becomes a gallery — the still IS the frame,
  // no looping video is mounted at all.
  const moving = active && !reduce;

  const onProgress = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    try {
      if (v.buffered.length > 0) {
        const end = v.buffered.end(v.buffered.length - 1);
        setLoaded((s) => ({ ...s, progress: Math.min(1, end / v.duration) }));
      }
    } catch {
      /* buffer ranges can shift mid-read — ignore */
    }
  }, []);

  // Either signal that a first frame is available is enough to crossfade in;
  // both are idempotent so we listen to both for robustness across browsers.
  const markReady = useCallback(() => setLoaded((s) => (s.ready ? s : { ...s, ready: true })), []);

  // The film rests when the scene is out of frame: once the video is live,
  // a second observer pauses it below the fold and resumes it on return, so
  // six chapters never compete for the phone's battery.
  useEffect(() => {
    if (!loaded.ready || !moving) return;
    const el = ref.current;
    const v = videoRef.current;
    if (!el || !v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loaded.ready, moving]);

  return (
    <div ref={ref} className={cn("absolute inset-0", className)} aria-hidden={active ? undefined : true}>
      {/* The still — always present, the fallback, and the first paint.
          Only the opening frame is a priority (LCP); the later chapters'
          stills defer to native lazy loading. */}
      <div className={cn("absolute inset-0", moving && !loaded.ready ? "cine-shimmer" : undefined)}>
        <Image src={poster} alt={alt} fill priority={eager} sizes="100vw" className="h-full w-full object-cover" />
      </div>

      {/* The moving image — mounted once the scene approaches, but kept
          transparent until its first frame is ready: the still underneath
          covers the gap, then the film fades in over it. */}
      {moving && (
        <motion.div
          initial={false}
          animate={{ opacity: loaded.ready ? 1 : 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <video
            ref={videoRef}
            className={cn("h-full w-full object-cover", videoClassName)}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            onProgress={onProgress}
            onLoadedData={markReady}
            onCanPlay={markReady}
            onError={() => setFailed(true)}
          >
            <source src={sources.mobile} media="(max-width: 768px)" />
            <source src={sources.desktop} />
          </video>
        </motion.div>
      )}

      {/* The hair of light — buffered progress while the scene is still silent. */}
      {moving && !loaded.ready && !failed && (
        <div className="absolute inset-x-0 bottom-0 z-10 h-px bg-cine-line/60" aria-hidden>
          <div
            className="h-full bg-cine-gold transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(loaded.progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
