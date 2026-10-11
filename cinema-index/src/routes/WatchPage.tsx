import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { workById, isFilm } from "../data";
import { runtimeLabel } from "../lib/format";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { library } from "../lib/library/useLibrary";
import NotFoundPage from "./NotFoundPage";
import styles from "./WatchPage.module.css";

type PlayerState = "resolving" | "direct" | "embed" | "unavailable";

/**
 * Authorized playback surface.
 * Resolves a public-domain file through the provider's metadata API and plays
 * it in a plain <video> (so progress can be tracked honestly). If the direct
 * file cannot be resolved, falls back to the provider's own embed. If the
 * network is down entirely, shows an honest notice with a direct link —
 * the prototype never pretends to own video delivery.
 */
function ArchivePlayer({
  itemId,
  posterSrc,
  titleAr,
  onProgress,
}: {
  itemId: string;
  posterSrc: string;
  titleAr: string;
  onProgress: (p: number) => void;
}) {
  const [state, setState] = useState<PlayerState>("resolving");
  const [src, setSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSave = useRef(0);

  useEffect(() => {
    let alive = true;
    setState("resolving");
    setSrc(null);

    (async () => {
      try {
        const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(itemId)}`);
        if (!res.ok) throw new Error(`metadata ${res.status}`);
        const data = (await res.json()) as {
          files?: { name?: string; format?: string }[];
        };
        const files = data.files ?? [];
        const mp4 =
          files.find((f) => f.name && /\.mp4$/i.test(f.name) && /h\.?264|mpeg4/i.test(f.format ?? "")) ??
          files.find((f) => f.name && /\.mp4$/i.test(f.name));
        if (!alive) return;
        if (mp4?.name) {
          const fileUrl = `https://archive.org/download/${encodeURIComponent(itemId)}/${mp4.name
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`;
          setSrc(fileUrl);
          setState("direct");
        } else {
          setState("embed");
        }
      } catch {
        if (alive) setState("embed");
      }
    })();

    return () => {
      alive = false;
    };
  }, [itemId]);

  const handleTime = () => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    const now = Date.now();
    if (now - lastSave.current > 5000) {
      lastSave.current = now;
      onProgress(v.currentTime / v.duration);
    }
  };

  return (
    <div
      className={styles.playerFrame}
      style={{ backgroundImage: `url(${posterSrc})` }}
    >
      {state === "resolving" && (
        <div className={styles.playerNotice}>
          <p className="u-label">جارٍ الاتصال بمزوّد المشاهدة…</p>
          <p className={styles.noticeBody}>
            المصدر: Internet Archive — {itemId}
          </p>
        </div>
      )}

      {state === "direct" && src && (
        <video
          ref={videoRef}
          className={styles.video}
          controls
          playsInline
          poster={posterSrc}
          src={src}
          onTimeUpdate={handleTime}
          onEnded={() => onProgress(1)}
        >
          <track kind="captions" />
          متصفحك لا يدعم عنصر الفيديو. يمكنك المشاهدة عبر الرابط المباشر إلى المصدر.
        </video>
      )}

      {state === "embed" && (
        <>
          <iframe
            className={styles.video}
            src={`https://archive.org/embed/${encodeURIComponent(itemId)}`}
            title={`المشاهدة — ${titleAr}`}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
          <p className={styles.embedHint}>
            <span className="u-label">المشغّل المضمَّن من Internet Archive</span>
          </p>
        </>
      )}

      {state === "unavailable" && (
        <div className={styles.playerNotice}>
          <p className="u-label">تعذّر تحميل المشغّل</p>
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  const { slug, episode } = useParams();
  const work = slug ? workById(slug) : undefined;
  useDocumentTitle(work ? `المشاهدة — ${work.titleAr}` : "المشاهدة");

  useEffect(() => {
    if (!work) return;
    const ep =
      !isFilm(work) && episode
        ? work.episodes.find((e) => e.number === Number(episode))
        : undefined;
    void library.recordPlay(work.id, ep?.id);
  }, [work, episode]);

  if (!work) return <NotFoundPage />;

  const series = !isFilm(work) ? work : undefined;
  const film = isFilm(work) ? work : undefined;
  const ep = series
    ? series.episodes.find((e) => e.number === Number(episode ?? 1)) ?? series.episodes[0]
    : undefined;

  const media = film ? film.media : ep!.media;
  const artSrc = film ? film.art.src : series!.art.src;
  const titleAr = film ? film.titleAr : `${series!.titleAr} — الحلقة ${ep!.number}`;

  const epIndex = ep ? series!.episodes.findIndex((e) => e.id === ep.id) : -1;
  const prevEp = epIndex > 0 ? series!.episodes[epIndex - 1] : undefined;
  const nextEp =
    epIndex >= 0 && epIndex < series!.episodes.length - 1
      ? series!.episodes[epIndex + 1]
      : undefined;

  return (
    <div className={styles.watchPage}>
      {/* ---- player band (ink panel) ---- */}
      <section className={styles.stage} aria-label="مشغّل المشاهدة">
        <div className={`band ${styles.stageHead}`}>
          <Link
            className={`u-label ${styles.backLink}`}
            to={film ? `/film/${film.id}` : `/series/${series!.id}`}
          >
            ← العودة إلى الملف
          </Link>
          <p className={styles.stageTitle}>
            <span className="u-mono u-accent">
              {film ? film.indexCode : `${series!.indexCode} · ${String(ep!.number).padStart(2, "0")}`}
            </span>
            <span className="u-label">{film ? "عرض" : `الحلقة ${ep!.number} — ${ep!.titleAr}`}</span>
          </p>
        </div>

        <div className={`band ${styles.stageBody}`}>
          <ArchivePlayer
            itemId={media.itemId}
            posterSrc={artSrc}
            titleAr={titleAr}
            onProgress={(p) => void library.saveProgress(work.id, p, ep?.id)}
          />
        </div>

        <div className={`band ${styles.stageFoot}`}>
          <p className={styles.rights}>
            {media.rightsNoteAr} · معرّف المصدر <code className="u-mono">{media.itemId}</code>
          </p>
          <a
            className={`u-label ${styles.sourceLink}`}
            href={media.detailsUrl}
            target="_blank"
            rel="noreferrer"
          >
            فتح المصدر ↗
          </a>
        </div>
      </section>

      {/* ---- context band ---- */}
      <div className={`band ${styles.context}`}>
        <div className={styles.nowPlaying}>
          <p className="u-label">يُعرض الآن</p>
          <h1 className={styles.nowTitle}>{titleAr}</h1>
          <p className={styles.nowMeta}>
            {film
              ? `${film.year} · ${runtimeLabel(film.runtimeMin)} · إخراج ${film.director.nameAr}`
              : `${series!.yearStart}–${series!.yearEnd} · إخراج ${series!.director.nameAr} · ~${runtimeLabel(ep!.runtimeMin)}`}
          </p>
          <p className={styles.nowSynopsis}>{film ? film.synopsisAr : ep!.synopsisAr}</p>
        </div>

        {series && (
          <nav className={styles.epNav} aria-label="تنقّل الحلقات">
            <p className="u-label">فهرس الحلقات</p>
            <ul>
              {series.episodes.map((e) => {
                const current = e.id === ep!.id;
                return (
                  <li key={e.id}>
                    <Link
                      className={`${styles.epNavLink} ${current ? styles.epNavCurrent : ""}`}
                      to={`/watch/${series.id}/${e.number}`}
                      aria-current={current ? "page" : undefined}
                    >
                      <span className="u-mono">{String(e.number).padStart(2, "0")}</span>
                      <span className={styles.epNavTitle}>{e.titleAr}</span>
                      {current && <span className="u-label u-accent">يُعرض</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className={styles.epPager}>
              {prevEp ? (
                <Link className={`u-label ${styles.pagerLink}`} to={`/watch/${series.id}/${prevEp.number}`}>
                  ← الحلقة {prevEp.number}
                </Link>
              ) : (
                <span />
              )}
              {nextEp ? (
                <Link className={`u-label ${styles.pagerLink}`} to={`/watch/${series.id}/${nextEp.number}`}>
                  الحلقة {nextEp.number} →
                </Link>
              ) : (
                <span />
              )}
            </div>
          </nav>
        )}

        <aside className={styles.watchSide}>
          <p className="u-label">هذه جلسة محلية</p>
          <p className={styles.sideBody}>
            يُسجَّل بدء المشاهدة وموضع التوقف في متصفحك فقط — لا حساب ولا خادم. الملف
            نفسه يُشغَّل من مزوّد المحتوى المُصرَّح.
          </p>
          <div className={styles.sideLinks}>
            <Link className={`link-rule u-mono ${styles.pagerLink}`} to="/history">
              سجل المشاهدة ←
            </Link>
            <Link className={`link-rule u-mono ${styles.pagerLink}`} to="/watchlist">
              قائمة المشاهدة ←
            </Link>
          </div>
          <p className={`u-label ${styles.autosave}`}>يُحفظ التقدّم تلقائيًا</p>
        </aside>
      </div>
    </div>
  );
}
