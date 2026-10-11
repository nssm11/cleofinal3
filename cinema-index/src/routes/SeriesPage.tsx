import { Link, useParams } from "react-router-dom";
import { seriesById, collectionById, genreById, relatedWorks } from "../data";
import { sourceFor } from "../data/sources";
import { runtimeLabelLong, runtimeLabel, originalLine } from "../lib/format";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useWatchlist, useEpisodeProgressMap } from "../lib/library/useLibrary";
import {
  MetaRail,
  GenreWords,
  ArtNote,
  ActionLink,
  ProgressTick,
} from "../components/primitives";
import CrossRefs from "../components/film/CrossRefs";
import NotFoundPage from "./NotFoundPage";
import styles from "./FeaturePage.module.css";
import seriesStyles from "./SeriesPage.module.css";

export default function SeriesPage() {
  const { slug } = useParams();
  const s = slug ? seriesById(slug) : undefined;
  const { has, toggle } = useWatchlist();
  const progressMap = useEpisodeProgressMap(s?.id);
  useDocumentTitle(s?.titleAr);

  if (!s) return <NotFoundPage />;

  const saved = has(s.id);
  const related = relatedWorks(s.id);
  const collections = s.collectionIds
    .map((id) => collectionById(id))
    .filter(Boolean);

  const totalMin = s.episodes.reduce((acc, e) => acc + e.runtimeMin, 0);
  const watchedCount = s.episodes.filter(
    (e) => (progressMap[e.id] ?? 0) >= 0.97,
  ).length;
  const startedCount = s.episodes.filter(
    (e) => (progressMap[e.id] ?? 0) > 0,
  ).length;

  return (
    <article className={styles.feature}>
      <header className={`band ${styles.hero}`}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>
            <span className="u-mono u-accent">{s.indexCode}</span>
            <span className="u-label">مسلسل</span>
            <span className={`u-label u-ltr`}>
              {s.yearStart} – {s.yearEnd}
            </span>
          </p>

          <h1 className={styles.title}>{s.titleAr}</h1>

          <p className={styles.original} dir="ltr">
            {originalLine([s.titleOriginal, s.titleLatin])} ·{" "}
            {s.episodes.length} episodes
          </p>

          <p className={styles.byline}>
            إخراج <strong>{s.director.nameAr}</strong>
            <span className={styles.bylineLatin}>{s.director.nameLatin}</span>
          </p>
        </div>

        <figure className={styles.heroFigure}>
          <div className={styles.heroImageWrap}>
            <img
              src={s.art.src}
              alt={s.art.altAr}
              className={styles.heroImage}
            />
          </div>
          <figcaption className={styles.heroCaption}>
            <span className="u-mono u-accent">الصورة</span>
            <span>{s.art.altAr}</span>
            <ArtNote compact />
          </figcaption>
        </figure>
      </header>

      <div className={`band ${styles.body}`}>
        <div className={styles.main}>
          <p className={styles.lead}>{s.synopsisAr}</p>

          <aside className={styles.editorNote}>
            <p className="u-label">من الفهرس</p>
            <p>{s.noteAr}</p>
          </aside>

          {/* ---- episode index ---- */}
          <section aria-labelledby="episodes-title">
            <h2 id="episodes-title" className={styles.subhead}>
              <span className="u-mono u-accent">فهرس</span> الحلقات
            </h2>

            <p className={seriesStyles.episodeStatus}>
              <span className={`u-mono u-accent u-ltr`}>
                {String(watchedCount).padStart(2, "0")} /{" "}
                {String(s.episodes.length).padStart(2, "0")}
              </span>
              <span className="u-label">
                {watchedCount === 0 && startedCount === 0
                  ? "لم تبدأ بعد"
                  : watchedCount === s.episodes.length
                    ? "المسلسل مُكتمل"
                    : "قيد المشاهدة"}
              </span>
              <span className="u-label u-faint">
                المجموع التقريبي {runtimeLabelLong(totalMin)}
              </span>
            </p>

            <ol className={seriesStyles.ledger}>
              {s.episodes.map((ep) => {
                const p = progressMap[ep.id] ?? 0;
                return (
                  <li key={ep.id} className={seriesStyles.epRow}>
                    <span className={`u-mono ${seriesStyles.epNo}`}>
                      {String(ep.number).padStart(2, "0")}
                    </span>

                    <span className={seriesStyles.epTitles}>
                      <Link
                        className={`link-rule ${seriesStyles.epTitle}`}
                        to={`/watch/${s.id}/${ep.number}`}
                      >
                        {ep.titleAr}
                      </Link>
                      <span className={seriesStyles.epLatin}>
                        {ep.titleOriginal}
                      </span>
                    </span>

                    <span className={seriesStyles.epSynopsis}>
                      {ep.synopsisAr}
                    </span>

                    <span className={`u-mono ${seriesStyles.epMeta}`}>
                      ~{runtimeLabel(ep.runtimeMin)}
                    </span>

                    <span className={seriesStyles.epState}>
                      {p > 0 ? (
                        <ProgressTick
                          value={p}
                          label={p >= 0.97 ? "" : `${Math.round(p * 100)}٪`}
                        />
                      ) : (
                        <Link
                          className={`u-label ${seriesStyles.epPlay}`}
                          to={`/watch/${s.id}/${ep.number}`}
                        >
                          تشغيل ←
                        </Link>
                      )}
                      {p > 0 && p < 0.97 && (
                        <Link
                          className={`u-label ${seriesStyles.epPlay}`}
                          to={`/watch/${s.id}/${ep.number}`}
                        >
                          متابعة ←
                        </Link>
                      )}
                      {p >= 0.97 && (
                        <Link
                          className={`u-label ${seriesStyles.epPlay}`}
                          to={`/watch/${s.id}/${ep.number}`}
                        >
                          إعادة ←
                        </Link>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={styles.cast} aria-labelledby="cast-title">
            <h2 id="cast-title" className={styles.subhead}>
              <span className="u-mono u-accent">طاقم</span> العمل
            </h2>
            <ul className={styles.castList}>
              {s.cast.map((c) => (
                <li key={c.nameLatin}>
                  <span className={styles.castName}>{c.nameAr}</span>
                  <span className={styles.castLatin}>{c.nameLatin}</span>
                  {c.roleAr && (
                    <span className={styles.castRole}>{c.roleAr}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="التصنيف">
            <GenreWords labels={s.genres.map((g) => genreById(g).labelAr)} />
          </section>
        </div>

        <aside className={styles.rail}>
          <div className={styles.watchPanel}>
            <p className={`u-label ${styles.watchLabel}`}>المشاهدة</p>
            <p className={styles.watchTitle}>{s.titleAr}</p>
            <p className={styles.watchMeta}>
              {s.episodes.length} حلقات · {runtimeLabelLong(totalMin)} ·{" "}
              {s.countryAr}
            </p>
            <ActionLink to={`/watch/${s.id}/1`}>ابدأ الحلقة 1</ActionLink>
            <p className={styles.watchNote}>
              كل حلقة لها مصدر مُتحقَّق مستقل على ويكيميديا كومنز —{" "}
              {sourceFor(s.episodes[0]?.sourceId ?? "")?.license ?? "مرخّص"}. لا
              روابط ميتة ولا مصادر معلّقة.
            </p>
            <a
              className={`u-label ${styles.sourceLink}`}
              href={sourceFor(s.episodes[0]?.sourceId ?? "")?.evidence}
              target="_blank"
              rel="noreferrer"
            >
              صفحة مصدر الحلقة 1: ويكيميديا كومنز ↗
            </a>
          </div>

          <MetaRail
            items={[
              ["السنوات", `${s.yearStart} – ${s.yearEnd}`],
              ["الحلقات", String(s.episodes.length)],
              ["المدة", `~${runtimeLabel(totalMin)}`],
              ["البلد", s.countryAr],
              ["الإخراج", s.director.nameAr],
              ["الرمز", s.indexCode],
            ]}
          />

          <button
            type="button"
            className={`${styles.saveBtn} ${saved ? styles.savedBtn : ""}`}
            aria-pressed={saved}
            onClick={() => void toggle(s.id)}
          >
            {saved ? "محفوظ في قائمة المشاهدة ✓" : "احفظ في قائمة المشاهدة"}
          </button>

          {collections.length > 0 && (
            <section className={styles.inCollections}>
              <p className="u-label">يظهر في</p>
              <ul>
                {collections.map((c) => (
                  <li key={c!.id}>
                    <Link
                      className={`link-rule ${styles.colLink}`}
                      to="/catalog?view=collections"
                    >
                      <span className="u-mono u-accent">{c!.code}</span>{" "}
                      {c!.titleAr}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <div className={`band ${styles.refs}`}>
        <CrossRefs works={related} relationAr="أعمال مُحال عليها" />
      </div>
    </article>
  );
}
