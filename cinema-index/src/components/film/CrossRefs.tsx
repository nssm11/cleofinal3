import { Link } from "react-router-dom";
import type { Work } from "../../data";
import { isFilm, workYearLabel } from "../../data";
import { workHref } from "./WorkIndex";
import styles from "./CrossRefs.module.css";

/**
 * Cross-references — «انظر أيضًا»: the index's own citation system.
 * Links follow the references recorded on each work (director / movement / era).
 */
export default function CrossRefs({
  works,
  relationAr = "مرتبط في الفهرس",
}: {
  works: Work[];
  relationAr?: string;
}) {
  if (works.length === 0) return null;
  return (
    <section className={styles.refs} aria-label="إحالات مترابطة">
      <p className={`u-label ${styles.head}`}>
        <span className="u-accent">↔</span> {relationAr}
      </p>
      <ul>
        {works.map((w) => (
          <li key={w.id}>
            <Link className={styles.ref} to={workHref(w)}>
              <span className={`u-mono ${styles.code}`}>{w.indexCode}</span>
              <span className={styles.title}>{w.titleAr}</span>
              <span className={`u-mono ${styles.meta}`}>
                {workYearLabel(w)} ·{" "}
                {isFilm(w) ? `${w.runtimeMin} د` : `${w.episodes.length} حلقات`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
