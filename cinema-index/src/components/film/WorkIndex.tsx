import { Link } from "react-router-dom";
import type { Work } from "../../data";
import { isFilm, workYearLabel, genreById } from "../../data";
import { runtimeLabel } from "../../lib/format";
import { ProgressTick } from "../primitives";
import { useWatchlist } from "../../lib/library/useLibrary";
import styles from "./WorkIndex.module.css";

export const workHref = (w: Work): string =>
  isFilm(w) ? `/film/${w.id}` : `/series/${w.id}`;

export const watchHref = (w: Work, episodeId?: string): string => {
  if (isFilm(w)) return `/watch/${w.id}`;
  return episodeId ? `/watch/${w.id}/${episodeId.replace(`${w.id}-`, "")}` : `/watch/${w.id}/1`;
};

/** One indexed work — the publication's core list unit (festival-program row). */
export function WorkIndexRow({
  w,
  progress,
  footer,
  compact = false,
}: {
  w: Work;
  progress?: number;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  const { has, toggle } = useWatchlist();
  const saved = has(w.id);
  const totalRuntime = isFilm(w)
    ? runtimeLabel(w.runtimeMin)
    : `${w.episodes.length} حلقات`;

  return (
    <li className={`${styles.row} ${compact ? styles.rowCompact : ""}`}>
      <span className={`u-mono ${styles.code}`}>{w.indexCode}</span>

      <span className={styles.titles}>
        <Link className={`link-rule ${styles.titleAr}`} to={workHref(w)}>
          {w.titleAr}
        </Link>
        <span className={styles.titleLatin}>{w.titleLatin}</span>
      </span>

      <span className={styles.meta}>
        <span className={`u-mono ${styles.year}`}>{workYearLabel(w)}</span>
        <span className={styles.director}>{w.director.nameAr}</span>
        <span className={styles.genres}>
          {w.genres.slice(0, compact ? 1 : 2).map((g) => (
            <span key={g}>{genreById(g).labelAr}</span>
          ))}
        </span>
      </span>

      <span className={`u-mono ${styles.runtime}`}>{totalRuntime}</span>

      <span className={styles.actions}>
        {typeof progress === "number" && progress > 0 && (
          <ProgressTick value={progress} label={progress >= 0.97 ? "مُشاهَد" : "متابعة"} />
        )}
        <Link className={`u-label ${styles.play}`} to={watchHref(w)}>
          مشاهدة
        </Link>
        <button
          type="button"
          className={`u-label ${styles.save} ${saved ? styles.saved : ""}`}
          aria-pressed={saved}
          onClick={() => void toggle(w.id)}
        >
          {saved ? "محفوظ ✓" : "حفظ"}
        </button>
      </span>

      {footer}
    </li>
  );
}

/** The compact film index — header + rows. */
export function WorkIndexTable({
  works,
  progressFor,
  footerFor,
  emptyNote,
}: {
  works: Work[];
  progressFor?: (w: Work) => number | undefined;
  footerFor?: (w: Work) => React.ReactNode;
  emptyNote?: string;
}) {
  if (works.length === 0 && emptyNote) {
    return <p className={styles.empty}>{emptyNote}</p>;
  }
  return (
    <div className={styles.tableWrap}>
      <div className={`${styles.row} ${styles.headRow}`} aria-hidden>
        <span className={`u-label ${styles.code}`}>الرمز</span>
        <span className="u-label">العنوان</span>
        <span className={`u-label ${styles.year}`}>السنة</span>
        <span className="u-label">الإخراج</span>
        <span className="u-label">النوع</span>
        <span className={`u-label ${styles.runtime}`}>المدة</span>
        <span className="u-label">—</span>
      </div>
      <ul>
        {works.map((w) => (
          <WorkIndexRow
            key={w.id}
            w={w}
            progress={progressFor?.(w)}
            footer={footerFor?.(w)}
          />
        ))}
      </ul>
    </div>
  );
}
