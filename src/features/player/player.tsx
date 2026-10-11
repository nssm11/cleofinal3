"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Slider from "@radix-ui/react-slider";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Check,
  Gauge,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Settings2,
  Subtitles,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import {
  fetchSources,
  presetSource,
  toVttBlobUrl,
  type ArchiveSource,
  type SubtitleSource,
} from "./resolve";
import { clearProgress, resumable, saveProgress, useProgress } from "./progress";

/**
 * The projection room's machine.
 *
 * · Resolves real H.264 MP4 derivatives from the Internet Archive at play
 *   time; a build-time file hint starts playback instantly when known.
 * · If resolution fails for any reason → the Archive's own embed player
 *   (labeled, never hidden), then an honest failure card with recovery.
 * · Resume, progress saving, subtitles when the item ships them, speed,
 *   quality switching without losing position, fullscreen, PiP.
 * · Controls are a bottom rail that yields to inactivity and returns to any
 *   pointer, key or focus — and never move under reduced motion.
 */

export interface PlayerProps {
  playKey: string;
  identifier: string;
  fileHint?: string;
  title: string;
  /** Overlay content shown when the work ends. */
  endOverlay?: ReactNode;
}

type Phase = "resolving" | "ready" | "embed" | "failed";

export function Player({ playKey, identifier, fileHint, title, endOverlay }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);

  const [phase, setPhase] = useState<Phase>("resolving");
  const [sources, setSources] = useState<ArchiveSource[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleSource[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<[number, number][]>([]);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFull, setIsFull] = useState(false);
  const [resumeToast, setResumeToast] = useState<number | null>(null);
  const [subUrl, setSubUrl] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [embedNonce, setEmbedNonce] = useState(0);
  const embedTried = useRef(false);

  const entryProgress = useProgress(playKey);
  const resumeAt = useMemo(() => resumable(entryProgress), [entryProgress]);

  /* ── resolution ─────────────────────────────────────────────────────── */

  useEffect(() => {
    let dead = false;
    const ctrl = new AbortController();

    async function run() {
      if (fileHint) {
        // Known file: play immediately, enrich the menu afterwards.
        if (!dead) setActiveUrl(presetSource(identifier, fileHint).url);
      }
      try {
        const { sources: list, subtitles: subs } = await fetchSources(identifier, ctrl.signal);
        if (dead) return;
        setSources(list);
        setSubtitles(subs);
        if (!fileHint) setActiveUrl(list[list.length - 1].url);
        setPhase("ready");
      } catch {
        if (dead) return;
        if (fileHint) {
          // Menu failed but the preset works — watch in degraded-features mode.
          setPhase("ready");
          return;
        }
        if (embedTried.current) setPhase("failed");
        else { embedTried.current = true; setPhase("embed"); }
      }
    }
    run();
    return () => {
      dead = true;
      ctrl.abort();
    };
  }, [identifier, fileHint]);

  /* ── playback plumbing ──────────────────────────────────────────────── */

  const showChrome = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (videoRef.current && !videoRef.current.paused) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2600);
    }
  }, []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setNeedTap(true));
    else v.pause();
  }, []);

  const seekBy = useCallback((d: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + d), v.duration || Infinity);
    showChrome();
  }, [showChrome]);

  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    if (resumeAt != null && v.duration > 0) {
      v.currentTime = resumeAt;
      setResumeToast(resumeAt);
      setTimeout(() => setResumeToast(null), 8000);
    }
    v.playbackRate = speed;
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const ranges: [number, number][] = [];
    for (let i = 0; i < v.buffered.length; i++) ranges.push([v.buffered.start(i), v.buffered.end(i)]);
    setBuffered(ranges);
    if (!v.paused && v.duration > 0 && Date.now() - lastSave.current > 5000) {
      lastSave.current = Date.now();
      saveProgress(playKey, v.currentTime, v.duration);
    }
  }

  function onEnded() {
    setEnded(true);
    clearProgress(playKey);
    setShowControls(true);
  }

  function onPlayPause() {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(!v.paused);
    if (v.paused && hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    if (!v.paused) hideTimer.current = setTimeout(() => setShowControls(false), 2600);
  }

  function switchSource(url: string) {
    const v = videoRef.current;
    const at = v?.currentTime ?? 0;
    setEnded(false);
    setActiveUrl(url);
    // restore position after load
    const onLoaded = () => {
      if (v && at > 1) v.currentTime = at;
      void v?.play();
    };
    v?.addEventListener("loadedmetadata", onLoaded, { once: true });
    showChrome();
  }

  /* ── keyboard + fullscreen ──────────────────────────────────────────── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.closest("[data-radix-menu-content], [data-radix-popper-content-wrapper]"))) return;
      const k = e.key;
      if ([" ", "k"].includes(k)) { e.preventDefault(); toggle(); showChrome(); }
      else if (k === "ArrowLeft") { e.preventDefault(); seekBy(-5); }
      else if (k === "ArrowRight") { e.preventDefault(); seekBy(5); }
      else if (k === "j") seekBy(-10);
      else if (k === "l") seekBy(10);
      else if (k === "m") { const v = videoRef.current; if (v) v.muted = !v.muted; }
      else if (k === "f") void toggleFull();
      else if (k === "Home" || k === "End") { /* browser scrolls; ignore */ }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seekBy, showChrome]);

  function toggleFull() {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }

  useEffect(() => {
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // save progress when leaving the room
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v && v.duration > 0 && v.currentTime > 5 && !v.ended) {
        saveProgress(playKey, v.currentTime, v.duration);
      }
    };
  }, [playKey]);

  /* ── subtitles ──────────────────────────────────────────────────────── */

  const subBlobRef = useRef<string | null>(null);
  async function enableSubs(s: SubtitleSource | null) {
    const v = videoRef.current;
    if (subBlobRef.current) {
      URL.revokeObjectURL(subBlobRef.current);
      subBlobRef.current = null;
    }
    if (!s) {
      setSubUrl(null);
      if (v?.textTracks[0]) v.textTracks[0].mode = "disabled";
      return;
    }
    try {
      const url = s.format === "srt" ? await toVttBlobUrl(s.url) : s.url;
      subBlobRef.current = s.format === "srt" ? url : null;
      setSubUrl(url);
    } catch {
      setSubUrl(null);
    }
  }

  /* ── render ─────────────────────────────────────────────────────────── */

  const activeSource = sources.find((s) => s.url === activeUrl);
  const canPip = typeof document !== "undefined" && "pictureInPictureEnabled" in document && document.pictureInPictureEnabled;

  return (
    <div
      ref={shellRef}
      dir="ltr"
      className={cn(
        "group/player relative aspect-video w-full select-none overflow-hidden bg-black",
        isFull && "h-dvh",
      )}
      onMouseMove={showChrome}
      onFocus={showChrome}
      onDoubleClick={toggleFull}
      tabIndex={-1}
    >
      {/* The screen */}
      {phase === "embed" ? (
        <iframe
          key={embedNonce}
          title={`مشغل الأرشيف — ${title}`}
          src={`https://archive.org/embed/${encodeURIComponent(identifier)}?autoplay=1`}
          className="h-full w-full border-0"
          allow="fullscreen; autoplay"
        />
      ) : phase === "failed" ? (
        <FailureScreen identifier={identifier} onRetry={() => { setActiveUrl(fileHint ? presetSource(identifier, fileHint).url : null); setEmbedNonce(n => n + 1); setPhase("embed"); }} />
      ) : (
        <video
          ref={videoRef}
          src={activeUrl ?? undefined}
          className="h-full w-full bg-black"
          playsInline
          preload="auto"
          onClick={toggle}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlayPause}
          onPause={() => { onPlayPause(); }}
          onEnded={onEnded}
          onError={() => {
            // try the next quality; then fall back to embed
            const next = sources.filter((s) => s.url !== activeUrl).pop();
            if (next) switchSource(next.url);
            else setPhase("embed");
          }}
        >
          {subUrl && <track kind="subtitles" src={subUrl} srcLang="en" label="English" default />}
        </video>
      )}

      {/* resolving overlay */}
      {phase === "resolving" && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/70">
          <div className="flex flex-col items-center gap-3 text-bone">
            <Loader2 className="size-8 animate-spin text-tungsten motion-reduce:animate-none" />
            <p className="label-ar text-sm">نُدير العدسة — جلب قائمة الملفات من الأرشيف…</p>
          </div>
        </div>
      )}

      {/* big play affordance while paused and not started */}
      {phase === "ready" && !playing && !ended && !needTap && (
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-0 z-10 grid place-items-center bg-night/30 transition-colors hover:bg-night/10 motion-reduce:transition-none"
          aria-label={`تشغيل ${title}`}
        >
          <span className="grid size-20 place-items-center rounded-lens bg-tungsten text-night shadow-[0_0_60px_-10px_rgba(232,163,61,0.65)] transition-transform duration-(--duration-slide) ease-(--ease-projector) hover:scale-105">
            <Play className="ms-1 size-8" strokeWidth={2} fill="currentColor" />
          </span>
        </button>
      )}
      {needTap && (
        <div className="absolute inset-x-0 top-16 z-20 mx-auto w-fit rounded-frame border border-rule bg-coal px-4 py-2 text-sm text-bone">
          المتصفح رفض التشغيل التلقائي — اضغط مرة أخرى.
        </div>
      )}

      {/* embed-mode caption */}
      {phase === "embed" && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 border-b border-rule bg-night/85 px-4 py-2">
          <p className="label-ar text-[12px] text-ash">
            وضع التوافق — مشغّل الأرشيف الأصلي. <a className="text-tungsten underline underline-offset-4" href={`https://archive.org/details/${encodeURIComponent(identifier)}`} target="_blank" rel="noreferrer">صفحة المصدر</a>
          </p>
          <button type="button" onClick={() => { setPhase("resolving"); setEmbedNonce(embedNonce); (async () => { try { const r = await fetchSources(identifier); setSources(r.sources); setSubtitles(r.subtitles); setActiveUrl(r.sources[r.sources.length - 1].url); setPhase("ready"); } catch { setPhase("embed"); } })(); }} className="label-ar text-bone hover:text-tungsten">
            <RotateCcw className="me-1 inline size-3.5" />
            محاولة المشغّل الخاص
          </button>
        </div>
      )}

      {/* resume toast */}
      {resumeToast != null && (
        <div className="absolute bottom-24 left-4 z-20 flex items-center gap-3 rounded-frame border border-rule bg-night/92 px-4 py-2.5 text-sm text-bone" dir="rtl">
          <span>نواصل من {formatClock(resumeToast)}</span>
          <button type="button" className="label-ar text-tungsten hover:underline" onClick={() => { const v = videoRef.current; if (v) v.currentTime = 0; setResumeToast(null); clearProgress(playKey); }}>
            من البداية
          </button>
        </div>
      )}

      {/* ended overlay */}
      {ended && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-night/88 p-6 text-center" dir="rtl">
          <div className="flex max-w-md flex-col items-center gap-4">
            <p className="display-tight text-2xl font-bold">انتهى العرض</p>
            {endOverlay ?? <p className="text-sm text-ash">حُفظ الأرشيف لأنك وصلت معه إلى هنا.</p>}
          </div>
        </div>
      )}

      {/* control rail */}
      {phase === "ready" && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-night/95 via-night/70 to-transparent px-3 pb-3 pt-10 transition-[opacity,transform] duration-(--duration-slide) ease-(--ease-shutter)",
            showControls || !playing ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 motion-reduce:transition-none",
          )}
        >
          <SeekBar
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            onSeek={(pct) => {
              const v = videoRef.current;
              if (v && duration > 0) v.currentTime = pct * duration;
              showChrome();
            }}
          />
          <div className="mt-1 flex items-center gap-1.5 text-bone">
            <IconBtn label={playing ? "إيقاف مؤقت" : "تشغيل"} onClick={toggle}>
              {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
            </IconBtn>
            <IconBtn label={muted ? "إلغاء الكتم" : "كتم"} onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }}>
              {muted || volume === 0 ? <VolumeX className="size-5" /> : volume < 0.6 ? <Volume1 className="size-5" /> : <Volume2 className="size-5" />}
            </IconBtn>
            <Volume value={muted ? 0 : volume} onChange={(x) => { const v = videoRef.current; if (!v) return; v.volume = x; v.muted = x === 0; setVolume(x); setMuted(x === 0); }} />
            <p className="nums mx-2 font-mono text-[13px] text-bone/90">
              {formatClock(currentTime)} <span className="text-faint">/ {formatClock(duration)}</span>
            </p>
            <div className="ms-auto flex items-center gap-1.5">
              {subtitles.length > 0 && (
                <MenuBtn label="الترجمة">
                  <MenuItem active={!subUrl} onClick={() => void enableSubs(null)}>بدون</MenuItem>
                  {subtitles.map((s) => (
                    <MenuItem key={s.url} active={Boolean(subUrl)} onClick={() => void enableSubs(s)}>
                      English · ترجمة آلية من الأرشيف
                    </MenuItem>
                  ))}
                </MenuBtn>
              )}
              <MenuBtn label="السرعة" icon={<Gauge className="size-5" />}>
                {[0.75, 1, 1.25, 1.5, 2].map((x) => (
                  <MenuItem key={x} active={speed === x} onClick={() => { const v = videoRef.current; setSpeed(x); if (v) v.playbackRate = x; }}>
                    {x}×
                  </MenuItem>
                ))}
              </MenuBtn>
              {sources.length > 1 && (
                <MenuBtn label="الجودة" icon={<Settings2 className="size-5" />}>
                  {[...sources].reverse().map((s) => (
                    <MenuItem key={s.url} active={s.url === activeUrl} onClick={() => switchSource(s.url)}>
                      {s.label}
                    </MenuItem>
                  ))}
                </MenuBtn>
              )}
              {activeSource?.preset && (
                <span className="label-mono hidden text-[10px] text-faint sm:block" title="الجودة محجوزة من بطاقة الأرشيف">
                  {activeSource.label}
                </span>
              )}
              {canPip && (
                <IconBtn label="صورة في صورة" onClick={async () => { const v = videoRef.current; if (!v) return; try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await v.requestPictureInPicture(); } catch { /* unsupported */ } }}>
                  <PictureInPicture2 className="size-5" />
                </IconBtn>
              )}
              <IconBtn label={isFull ? "إنهاء ملء الشاشة" : "ملء الشاشة"} onClick={toggleFull}>
                {isFull ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </IconBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── pieces ───────────────────────────────────────────────────────────── */

function IconBtn({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-frame text-bone/90 transition-colors duration-(--duration-flip) hover:bg-bone/10 hover:text-tungsten"
    >
      {children}
    </button>
  );
}

function SeekBar({ currentTime, duration, buffered, onSeek }: { currentTime: number; duration: number; buffered: [number, number][]; onSeek: (pct: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  function pos(e: React.PointerEvent | React.MouseEvent): number {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  }
  return (
    <div
      ref={ref}
      className="group/seek relative h-6 cursor-pointer touch-none"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onSeek(pos(e));
      }}
      onPointerMove={(e) => {
        setHover(pos(e));
        if (e.buttons === 1) onSeek(pos(e));
      }}
      onPointerLeave={() => setHover(null)}
      role="slider"
      aria-label="موضع التشغيل"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={formatClock(currentTime)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(1, (currentTime + 5) / (duration || 1)));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, (currentTime - 5) / (duration || 1)));
      }}
    >
      <div className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-[2px] bg-bone/15 transition-[height] group-hover/seek:h-[6px] motion-reduce:transition-none">
        {buffered.map(([a, b], i) => duration > 0 && (
          <div key={i} className="absolute top-0 h-full bg-bone/20" style={{ left: `${(a / duration) * 100}%`, width: `${((b - a) / duration) * 100}%` }} />
        ))}
        {hover != null && (
          <div className="absolute top-0 h-full bg-bone/10" style={{ width: `${hover * 100}%` }} />
        )}
        <div className="absolute top-0 h-full rounded-[2px] bg-tungsten" style={{ width: `${pct}%` }}>
          <span className="absolute -right-1.5 -top-0.5 size-2.5 rounded-full bg-tungsten opacity-0 transition-opacity group-hover/seek:opacity-100" />
        </div>
      </div>
      {hover != null && duration > 0 && (
        <span className="nums pointer-events-none absolute -top-7 -translate-x-1/2 rounded-[3px] border border-rule bg-night px-1.5 py-0.5 font-mono text-[10px]" style={{ left: `${hover * 100}%` }}>
          {formatClock(hover * duration)}
        </span>
      )}
    </div>
  );
}

function Volume({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="hidden w-16 items-center sm:flex">
      <Slider.Root
        value={[value]}
        min={0}
        max={1}
        step={0.05}
        onValueChange={([v]) => onChange(v)}
        className="relative h-6 w-full cursor-pointer touch-none"
        aria-label="مستوى الصوت"
      >
        <Slider.Track className="top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-bone/15">
          <Slider.Range className="absolute h-full rounded-full bg-bone/70" />
        </Slider.Track>
        <Slider.Thumb className="block size-3 rounded-full bg-bone outline-none focus-visible:ring-2 focus-visible:ring-tungsten" />
      </Slider.Root>
    </div>
  );
}

function MenuBtn({ children, label, icon }: { children: ReactNode; label: string; icon?: ReactNode }) {
  return (
    <Dropdown.Root dir="rtl">
      <Dropdown.Trigger
        aria-label={label}
        className="grid size-9 place-items-center rounded-frame text-bone/90 transition-colors duration-(--duration-flip) hover:bg-bone/10 hover:text-tungsten data-[state=open]:text-tungsten"
      >
        {icon ?? <Subtitles className="size-5" />}
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-36 rounded-frame border border-rule bg-coal p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] data-[state=open]:animate-[riseIn_160ms_ease-out]"
        >
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

function MenuItem({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <Dropdown.Item
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-[3px] px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-bone/10",
        active ? "text-tungsten" : "text-bone",
      )}
    >
      {children}
      {active && <Check className="size-3.5" />}
    </Dropdown.Item>
  );
}

function FailureScreen({ identifier, onRetry }: { identifier: string; onRetry: () => void }) {
  return (
    <div className="grid h-full place-items-center bg-night p-8 text-center" dir="rtl">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <p className="display-tight text-2xl font-bold">تعذّر تشغيل البكرة</p>
        <p className="text-sm leading-7 text-ash">
          الأرشيف يستجيب ببطء الآن أو الحظر عندك يمنع الاتصال. لا تنتظر — تابع من المصدر مباشرة أو أعد المحاولة بعد قليل.
        </p>
        <div className="flex gap-3">
          <button onClick={onRetry} className="inline-flex h-10 items-center gap-2 rounded-frame bg-tungsten px-5 text-sm font-semibold text-night hover:bg-ember">
            <RotateCcw className="size-4" /> إعادة المحاولة
          </button>
          <Link href={`https://archive.org/details/${encodeURIComponent(identifier)}`} className="inline-flex h-10 items-center rounded-frame border border-rule px-5 text-sm text-bone hover:border-tungsten/60">
            فتح على الأرشيف
          </Link>
        </div>
      </div>
    </div>
  );
}
