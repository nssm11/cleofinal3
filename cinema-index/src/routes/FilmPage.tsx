import { Link, useParams } from "react-router-dom";
import { filmById, collectionById, genreById, relatedWorks } from "../data";
import { sourceFor } from "../data/sources";
import { runtimeLabel, originalLine } from "../lib/format";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useWatchlist, useProgress } from "../lib/library/useLibrary";
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

export default function FilmPage() {
  const { slug } = useParams();
  const film = slug ? filmById(slug) : undefined;
  const { has, toggle } = useWatchlist();
  const progress = useProgress(film?.id);
  useDocumentTitle(film?.titleAr);

  if (!film) return <NotFoundPage />;

  const saved = has(film.id);
  const related = relatedWorks(film.id);
  const collections = film.collectionIds
    .map((id) => collectionById(id))
    .filter(Boolean);

  return (
    <article className={styles.feature}>
      {/* ---- opening spread ---- */}
      <header className={`band ${styles.hero}`}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>
            <span className="u-mono u-accent">{film.indexCode}</span>
            <span className="u-label">ملف</span>
            <span className="u-label">العقد: {film.year}</span>
          </p>

          <h1 className={styles.title}>{film.titleAr}</h1>

          <p className={styles.original} dir="ltr">
            {originalLine([film.titleOriginal, film.titleLatin])}
          </p>

          <p className={styles.byline}>
            إخراج <strong>{film.director.nameAr}</strong>
            <span className={styles.bylineLatin}>
              {film.director.nameLatin}
            </span>
          </p>
        </div>

        <figure className={styles.heroFigure}>
          <div className={styles.heroImageWrap}>
            <img
              src={film.art.src}
              alt={film.art.altAr}
              className={styles.heroImage}
            />
          </div>
          <figcaption className={styles.heroCaption}>
            <span className="u-mono u-accent">الصورة</span>
            <span>{film.art.altAr}</span>
            <ArtNote compact />
          </figcaption>
        </figure>
      </header>

      {/* ---- body spread ---- */}
      <div className={`band ${styles.body}`}>
        <div className={styles.main}>
          <p className={styles.lead}>{film.synopsisAr}</p>

          <aside className={styles.editorNote}>
            <p className="u-label">من الفهرس</p>
            <p>{film.noteAr}</p>
          </aside>

          <section className={styles.cast} aria-labelledby="cast-title">
            <h2 id="cast-title" className={styles.subhead}>
              <span className="u-mono u-accent">طاقم</span> العمل
            </h2>
            <ul className={styles.castList}>
              {film.cast.map((c) => (
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

          <section className={styles.genres} aria-label="التصنيف">
            <GenreWords labels={film.genres.map((g) => genreById(g).labelAr)} />
          </section>
        </div>

        <aside className={styles.rail}>
          {/* watch panel — the publication's "ticket" */}
          <div className={styles.watchPanel}>
            <p className={`u-label ${styles.watchLabel}`}>المشاهدة</p>
            <p className={styles.watchTitle}>{film.titleAr}</p>
            <p className={styles.watchMeta}>
              {film.year} · {runtimeLabel(film.runtimeMin)} · {film.countryAr}
            </p>
            {progress > 0 && (
              <ProgressTick
                value={progress}
                label={progress >= 0.97 ? "مُشاهَد" : "متابعة"}
              />
            )}
            <ActionLink to={`/watch/${film.id}`}>
              {progress > 0 && progress < 0.97
                ? "تابع المشاهدة"
                : "ابدأ المشاهدة"}
            </ActionLink>
            <p className={styles.watchNote}>
              المصدر المُتحقَّق: ويكيميديا كومنز —{" "}
              {sourceFor(film.sourceId)?.license ?? "مرخّص"}
              {" · "}
              {sourceFor(film.sourceId)?.variants.length ?? 0} جودات للتشغيل
              والتنزيل.
            </p>
            <a
              className={`u-label ${styles.sourceLink}`}
              href={sourceFor(film.sourceId)?.evidence}
              target="_blank"
              rel="noreferrer"
            >
              صفحة المصدر: ويكيميديا كومنز ↗
            </a>
          </div>

          <MetaRail
            items={[
              ["السنة", String(film.year)],
              ["المدة", runtimeLabel(film.runtimeMin)],
              ["البلد", film.countryAr],
              ["الإخراج", film.director.nameAr],
              ["الرمز", film.indexCode],
            ]}
          />

          <button
            type="button"
            className={`${styles.saveBtn} ${saved ? styles.savedBtn : ""}`}
            aria-pressed={saved}
            onClick={() => void toggle(film.id)}
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
                      to={`/catalog?view=collections`}
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

      {/* ---- cross references ---- */}
      <div className={`band ${styles.refs}`}>
        <CrossRefs works={related} relationAr="من نفس الحركة والعقد" />
      </div>
    </article>
  );
}
