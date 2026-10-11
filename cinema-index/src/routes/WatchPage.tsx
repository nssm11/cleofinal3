import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collectionSeries,
  findCollection,
  findFilm,
  findSeries,
  type Collection,
  type Series,
} from "../data";
import { sourceFor } from "../data/sources";
import type { SubtitleRef } from "../data/types";
import {
  downloadRows,
  bytesLabel,
  defaultVariant,
} from "../lib/media/downloads";
import {
  verifySource,
  evidenceVerification,
  needsRecheck,
  verificationLabel,
  type Verification,
} from "../lib/media/verify";
import { srtObjectUrl } from "../lib/subtitles/srt";
import s from "./WatchPage.module.css";

interface Meta {
  kind: "film" | "episode";
  titleAr: string;
  code: string;
  year: number;
  durationAr: string;
  castAr: string[];
  series?: Series;
  epIndex: number;
  collection?: Collection;
  subtitles: SubtitleRef[];
  sourceId: string;
}

const durationLabel = (min: number): string => `${min} دقيقة`;

const metaFor = (slug?: string, episodeParam?: string): Meta | undefined => {
  const film = slug ? findFilm(slug) : undefined;
  if (film) {
    const f = film;
    if (!f) return undefined;
    return {
      kind: "film",
      titleAr: f.titleAr,
      code: f.indexCode,
      year: f.year,
      durationAr: durationLabel(f.runtimeMin),
      castAr: f.cast.map((c) => c.nameAr),
      epIndex: 0,
      collection: findCollection(f.collectionIds[0] ?? ""),
      subtitles: f.subtitles,
      sourceId: f.sourceId,
    };
  }
  if (!slug) return undefined;
  const s = findSeries(slug);
  if (!s) return undefined;
  const epNum = Number(episodeParam ?? "1") || 1;
  const i = Math.max(0, Math.min(epNum - 1, s.episodes.length - 1));
  const ep = s.episodes[i];
  if (!ep) return undefined;
  return {
    kind: "episode",
    titleAr: ep.titleAr,
    code: `${s.indexCode}-${String(ep.number).padStart(2, "0")}`,
    year: s.yearStart,
    durationAr: durationLabel(ep.runtimeMin),
    castAr: s.cast.map((c) => c.nameAr),
    series: s,
    epIndex: i,
    collection: findCollection(s.collectionIds[0] ?? ""),
    subtitles: ep.subtitles,
    sourceId: ep.sourceId,
  };
};

export default function WatchPage() {
  const { slug, episode } = useParams();
  const meta = metaFor(slug, episode);
  const source = meta ? sourceFor(meta.sourceId) : undefined;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "playing" | "error"
  >("loading");
  const [variantKey, setVariantKey] = useState<string>("");
  const [subChoice, setSubChoice] = useState<string>("off");
  const [subUrl, setSubUrl] = useState<string>("");
  const [verification, setVerification] = useState<Verification | undefined>(
    undefined,
  );
  const [retryToken, setRetryToken] = useState(0);

  const variants = source?.variants ?? [];
  const chosen = useMemo(
    () =>
      variants.find((v) => v.transcodeKey === variantKey) ??
      defaultVariant(meta?.sourceId ?? ""),
    [variants, variantKey, meta?.sourceId],
  );

  // Live source verification (cached per source; evidence fallback shown).
  useEffect(() => {
    if (!source) return;
    setVerification(undefined);
    verifySource(source)
      .then((v) => {
        setVerification(v);
      })
      .catch(() => setVerification(evidenceVerification(source)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id, retryToken]);

  // Subtitle track: load real SRT file and convert to VTT blob (RTL track).
  useEffect(() => {
    let revoked = "";
    let cancelled = false;
    if (subUrl) URL.revokeObjectURL(subUrl);
    setSubUrl("");
    const track = meta?.subtitles.find((t) => t.id === subChoice);
    if (!track || !track.src) return;
    fetch(track.src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((srt) => {
        if (cancelled) return;
        const url = srtObjectUrl(srt, true);
        revoked = url;
        setSubUrl(url);
      })
      .catch(() => {
        if (!cancelled) setSubUrl("");
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subChoice, meta?.sourceId]);

  if (!meta || !source || !chosen) {
    return (
      <article className={s.screen}>
        <p className={s.kicker}>سينما/مشاهدة</p>
        <h1 className={s.title}>العنوان غير موجود</h1>
        <p className={s.lead}>
          لا يوجد عمل بهذا المعرّف في الفهرس. العودة إلى{" "}
          <Link to="/films">الأرشيف</Link>.
        </p>
      </article>
    );
  }

  const isEp = meta.kind === "episode";
  const collectionSeriesList = meta.collection
    ? collectionSeries(meta.collection.id)
    : [];
  const playbackBlocked = status === "error";
  const recheck = verification ? needsRecheck(verification) : false;

  return (
    <article className={s.screen}>
      <header className={s.head}>
        <p className={s.kicker}>
          {meta.collection
            ? `${meta.collection.code} · ${meta.collection.titleAr} / `
            : ""}
          {meta.code}
        </p>
        <h1 className={s.title}>
          {meta.titleAr}
          {isEp && meta.series ? ` — ${meta.series.titleAr}` : ""}
        </h1>
        <p
          className={s.lead}
        >{`الفصل ${isEp ? `${meta.epIndex + 1} من ${meta.series?.episodes.length}` : "الوحيد"} · ${meta.year} · ${meta.durationAr}`}</p>
      </header>

      <div className={s.stage} dir="ltr">
        <video
          key={`${chosen.url}-${retryToken}`}
          ref={videoRef}
          className={s.video}
          controls
          playsInline
          preload="metadata"
          poster={meta.collection?.art.src ?? "/art/vertov.png"}
          crossOrigin="anonymous"
          src={chosen.url}
          onLoadStart={() => setStatus("loading")}
          onPlaying={() => setStatus("playing")}
          onError={() => setStatus("error")}
        >
          {subUrl ? (
            <track
              kind="subtitles"
              src={subUrl}
              srcLang="ar"
              label="العربية"
              default
            />
          ) : null}
        </video>
        {playbackBlocked ? (
          <div
            className={s.stageError}
            role="alert"
            data-testid="playback-error"
          >
            <p className={s.errorTitle}>تعذّر تشغيل المصدر</p>
            <p className={s.errorText}>
              لم يتمكّن المتصفح من تشغيل الملف المُتحقَّق منه (
              {source.commonsFile}). قد يكون حجبًا في الشبكة أو انتهاء صلاحية
              النسخة. لا نعرض زر تشغيل وهميًا — جرّب جودة أخرى أو صفحة المصدر.
            </p>
            <div className={s.errorActions}>
              <button
                type="button"
                className="btn-pill btn-pill-light"
                onClick={() => {
                  setStatus("loading");
                  setRetryToken((t) => t + 1);
                }}
              >
                إعادة المحاولة
              </button>
              <a
                className="btn-pill btn-pill-light"
                href={source.evidence}
                target="_blank"
                rel="noreferrer"
              >
                صفحة المصدر
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <div className={s.ctrlGrid}>
        <div className={s.ctrlCol}>
          <h2 className={s.h2}>الجودة</h2>
          <div className={s.pickRow} role="group" aria-label="اختيار الجودة">
            {variants.map((v) => (
              <button
                key={v.transcodeKey}
                type="button"
                className={`btn-pill ${chosen.transcodeKey === v.transcodeKey ? "btn-pill-dark" : "btn-pill-light"}`}
                onClick={() => {
                  setVariantKey(v.transcodeKey);
                  setStatus("loading");
                  setRetryToken((t) => t + 1);
                }}
              >
                {v.label} · {v.width}×{v.height}
              </button>
            ))}
          </div>
          <p className={s.ctrlNote}>
            الجودة الظاهرة مأخوذة من سُلّم النسخ الحقيقي للمزوّد (ويبم/إم-بيغ4).
            إن كان هناك نطاق لتحسين مقدّر من عرض × ارتفاع، فالتقدير مُعلَّم وليس
            رقمًا مُقاسًا.
          </p>

          <h2 className={s.h2}>الترجمة</h2>
          {meta.subtitles.length === 0 ? (
            <p className={s.subNone} data-testid="subs-none">
              لا توجد ترجمة عربية لهذا العمل بعد — ولا نخترع واحدة. صفحة المزوّد
              أدناه إن أردت المتابعة.
            </p>
          ) : (
            <div className={s.pickRow} role="group" aria-label="اختيار الترجمة">
              <button
                type="button"
                className={`btn-pill ${subChoice === "off" ? "btn-pill-dark" : "btn-pill-light"}`}
                onClick={() => setSubChoice("off")}
              >
                إيقاف الترجمة
              </button>
              {meta.subtitles.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn-pill ${subChoice === t.id ? "btn-pill-dark" : "btn-pill-light"}`}
                  onClick={() => setSubChoice(t.id)}
                  disabled={!t.src}
                >
                  {t.labelAr}
                  {!t.src ? " (صفحة المزوّد فقط)" : ""}
                </button>
              ))}
            </div>
          )}
          {meta.subtitles.map((t) =>
            subChoice === t.id ? (
              <p key={t.id} className={s.ctrlNote} data-testid="sub-origin">
                {t.originAr}
              </p>
            ) : null,
          )}
        </div>

        <div className={s.ctrlCol}>
          <h2 className={s.h2}>التنزيل</h2>
          <ul className={s.dlList}>
            {downloadRows(source).map((row) => (
              <li key={row.url} className={s.dlRow}>
                <span className={s.dlLabel}>
                  {row.label} — {bytesLabel(row.sizeBytes)}
                  {row.sizeIsEstimate ? " (تقدير)" : " (الحجم الحقيقي)"}
                </span>
                <a
                  className="btn-pill btn-pill-light"
                  href={row.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  تنزيل
                </a>
              </li>
            ))}
          </ul>
          <p className={s.ctrlNote}>
            التنزيل من ملفات المزوّد مباشرة — مسموح صراحةً بترخيص العمل (
            {source.license}). لا يوجد تجاوز لأي حماية تقنية.
          </p>

          <h2 className={s.h2}>حالة المصدر</h2>
          <dl className={s.verifyBox} data-testid="verify-box">
            <div className={s.verifyRow}>
              <dt>الملف</dt>
              <dd>{source.commonsFile}</dd>
            </div>
            <div className={s.verifyRow}>
              <dt>المزوّد</dt>
              <dd>
                <a href={source.evidence} target="_blank" rel="noreferrer">
                  ويكيميديا كومنز (صفحة الأدلة)
                </a>
              </dd>
            </div>
            <div className={s.verifyRow}>
              <dt>التحقق</dt>
              <dd data-testid="verify-state">
                {verification
                  ? verificationLabel(verification)
                  : "جارٍ الفحص المباشر…"}
                {verification?.at ? ` · ${verification.at.slice(0, 10)}` : ""}
                {recheck ? " · يحتاج إعادة فحص" : ""}
              </dd>
            </div>
            <div className={s.verifyRow}>
              <dt>الترخيص</dt>
              <dd>{source.license}</dd>
            </div>
            <div className={s.verifyRow}>
              <dt>الحالة</dt>
              <dd data-testid="playback-status">
                {status === "loading" ? "جارٍ التحميل…" : null}
                {status === "playing" ? "قيد التشغيل" : null}
                {status === "error"
                  ? "تعذّر التشغيل — المصدر أو الملف لا يقبل المعاينة هنا"
                  : null}
                {status === "idle" ? "جاهز" : null}
              </dd>
            </div>
          </dl>
          <p className={s.ctrlNote}>
            التحقق ليس حالة «متوفر» ثابتة: كل مصدر يُفحص مباشرةً في متصفحك (نطاق
            بايتات فعلي)، وتُخزَّن النتيجة 24 ساعة، وتُعاد مراجعتها كل 7 أيام.
            صفحة المزوّد هي الدليل النهائي.
          </p>
        </div>
      </div>

      {isEp && meta.series ? (
        <section className={s.serial}>
          <h2 className={s.h2}>الترتيب الأصلي</h2>
          <div className={s.epGrid}>
            {meta.series.episodes.map((e, i) => (
              <Link
                key={e.id}
                className={
                  i === meta.epIndex ? `${s.epCard} ${s.epActive}` : s.epCard
                }
                to={`/watch/${meta.series?.id}/${e.number}`}
              >
                <span className={s.epNum}>
                  {String(e.number).padStart(2, "0")}
                </span>
                <span className={s.epTitle}>{e.titleAr}</span>
                <span className={s.epMeta}>{durationLabel(e.runtimeMin)}</span>
              </Link>
            ))}
          </div>
          {collectionSeriesList.length > 1 ? (
            <p className={s.serialNote}>
              من الرف نفسه:{" "}
              {collectionSeriesList.map((s2) => (
                <Link key={s2.id} to={`/series/${s2.id}`}>
                  {s2.titleAr}
                </Link>
              ))}
            </p>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
