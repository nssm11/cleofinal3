import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  films,
  series,
  collections,
  eras,
  genres,
  genreById,
  eraById,
  filmsInCollection,
  seriesInCollection,
  isFilm,
  type Work,
} from "../data";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { SectionHead, ArtNote } from "../components/primitives";
import { WorkIndexTable } from "../components/film/WorkIndex";
import { StillsRow } from "../components/film/ContactSheet";
import styles from "./CatalogPage.module.css";

const allWorks: Work[] = [...films, ...series];

export default function CatalogPage() {
  useDocumentTitle("الفهرس الكامل");
  const [params, setParams] = useSearchParams();

  const view = params.get("view") === "collections" ? "collections" : "index";
  const era = params.get("era") ?? "";
  const genre = params.get("genre") ?? "";

  const filtered = useMemo(() => {
    return allWorks.filter((w) => {
      if (era && w.eraId !== era) return false;
      if (genre && !w.genres.includes(genre)) return false;
      return true;
    });
  }, [era, genre]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className={`band ${styles.page}`}>
      <SectionHead
        code="الفهرس"
        label={`${allWorks.length} عملًا · ملكية عامة`}
        title="كل الأعمال"
      />

      <div
        className={styles.viewToggle}
        role="tablist"
        aria-label="طريقة العرض"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "index"}
          className={`${styles.viewBtn} ${view === "index" ? styles.viewActive : ""}`}
          onClick={() => setParam("view", "index")}
        >
          فهرس
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "collections"}
          className={`${styles.viewBtn} ${view === "collections" ? styles.viewActive : ""}`}
          onClick={() => setParam("view", "collections")}
        >
          مجموعات
        </button>
      </div>

      {view === "index" ? (
        <>
          <div className={styles.filters}>
            <fieldset className={styles.filterGroup}>
              <legend className="u-label">العقد</legend>
              <ul className={styles.filterList}>
                <li>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${!era ? styles.filterActive : ""}`}
                    onClick={() => setParam("era", "")}
                  >
                    الكل
                  </button>
                </li>
                {eras.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${era === e.id ? styles.filterActive : ""}`}
                      onClick={() => setParam("era", e.id)}
                    >
                      {e.labelAr}
                      <span className={styles.filterRange}>{e.rangeAr}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>

            <fieldset className={styles.filterGroup}>
              <legend className="u-label">النوع</legend>
              <ul className={styles.filterList}>
                <li>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${!genre ? styles.filterActive : ""}`}
                    onClick={() => setParam("genre", "")}
                  >
                    الكل
                  </button>
                </li>
                {genres.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className={`${styles.filterBtn} ${genre === g.id ? styles.filterActive : ""}`}
                      onClick={() => setParam("genre", g.id)}
                    >
                      {g.labelAr}
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
          </div>

          <p className={styles.resultLine}>
            <span className="u-mono u-accent">
              {String(filtered.length).padStart(2, "0")}
            </span>
            <span className="u-label">
              نتيجة
              {era && ` · ${eraById(era).labelAr}`}
              {genre && ` · ${genreById(genre).labelAr}`}
            </span>
            {(era || genre) && (
              <button
                type="button"
                className={`u-label ${styles.clearBtn}`}
                onClick={() =>
                  setParams(new URLSearchParams(), { replace: true })
                }
              >
                إعادة الضبط ✕
              </button>
            )}
          </p>

          <WorkIndexTable
            works={filtered}
            emptyNote="لا أعمال تحت هذا التركيب من المرشّحات. أعد الضبط أو جرّب عقدًا آخر."
          />
        </>
      ) : (
        <div className={styles.collections}>
          {collections.map((col) => {
            const works = [
              ...filmsInCollection(col.id),
              ...seriesInCollection(col.id),
            ];
            return (
              <section key={col.id} className={styles.collection}>
                <header className={styles.collectionHead}>
                  <span className="u-mono u-accent">{col.code}</span>
                  <h3 className={styles.collectionTitle}>{col.titleAr}</h3>
                  <p className={styles.collectionSub}>{col.subtitleAr}</p>
                  <p className={styles.collectionIntro}>{col.introAr}</p>
                  <p className={styles.collectionQuote}>«{col.pullQuoteAr}»</p>
                </header>
                <StillsRow works={works} />
                <p className={styles.collectionWorks}>
                  <span className="u-label">الترتيب المقترح: </span>
                  {col.filmIds.map((id, i) => {
                    const w = allWorks.find((x) => x.id === id);
                    return w ? (
                      <span key={id}>
                        {i > 0 && <span aria-hidden> ← </span>}
                        <Link
                          className={`link-rule ${styles.collectionLink}`}
                          to={isFilm(w) ? `/film/${w.id}` : `/series/${w.id}`}
                        >
                          {w.titleAr}
                        </Link>
                      </span>
                    ) : null;
                  })}
                </p>
              </section>
            );
          })}
          <ArtNote />
        </div>
      )}
    </div>
  );
}
