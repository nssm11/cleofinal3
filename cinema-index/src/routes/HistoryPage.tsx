import { Link } from "react-router-dom";
import { workById, isFilm, type Work } from "../data";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useHistory } from "../lib/library/useLibrary";
import { SectionHead, ProgressTick } from "../components/primitives";
import { watchHref } from "../components/film/WorkIndex";
import { dateLabel, timeLabel } from "../lib/format";
import styles from "./LibraryPages.module.css";

interface Row {
  work: Work;
  episodeId?: string;
  watchedAt: string;
  progress: number;
  finished: boolean;
}

function HistoryRow({ row }: { row: Row }) {
  const ep =
    !isFilm(row.work) && row.episodeId
      ? row.work.episodes.find((e) => e.id === row.episodeId)
      : undefined;

  return (
    <li className={styles.historyRow}>
      <span className={`u-mono ${styles.historyCode}`}>
        {row.work.indexCode}
      </span>
      <span className={styles.historyTitles}>
        <Link
          className={`link-rule ${styles.historyTitle}`}
          to={watchHref(row.work, row.episodeId)}
        >
          {row.work.titleAr}
          {ep && (
            <span className={styles.epTag}>
              {" "}
              · الحلقة {ep.number} — {ep.titleAr}
            </span>
          )}
        </Link>
        <span className={styles.historyWhen}>
          {dateLabel(row.watchedAt)} · {timeLabel(row.watchedAt)}
        </span>
      </span>
      <span className={styles.historyState}>
        <ProgressTick
          value={row.progress}
          label={
            row.finished
              ? "مُشاهَد"
              : row.progress > 0
                ? `${Math.round(row.progress * 100)}٪`
                : "بدأ"
          }
        />
      </span>
      <Link
        className={`u-label ${styles.historyPlay}`}
        to={watchHref(row.work, row.episodeId)}
      >
        {row.finished ? "إعادة" : "متابعة"} ←
      </Link>
    </li>
  );
}

export default function HistoryPage() {
  useDocumentTitle("سجل المشاهدة");
  const { entries, clear } = useHistory();

  const rows: Row[] = entries
    .map((h): Row | null => {
      const work = workById(h.workId);
      return work
        ? {
            work,
            episodeId: h.episodeId,
            watchedAt: h.watchedAt,
            progress: h.progress,
            finished: h.finished,
          }
        : null;
    })
    .filter((x): x is Row => x !== null);

  return (
    <div className={`band ${styles.page}`}>
      <SectionHead
        code="السجل"
        label={`${rows.length} جلسة`}
        title="سجل المشاهدة"
      />

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>لا أثرٍ بعد.</p>
          <p className={styles.emptyBody}>
            كل ما تبدأ مشاهدته يُسجَّل هنا — بوقت الجلسة وموضع التوقف. السجل
            يعمل محليًا في متصفحك، ويمكنك مسحه في أي وقت.
          </p>
          <Link
            to="/catalog"
            className={`link-rule u-mono ${styles.emptyLink}`}
          >
            ابدأ من الفهرس ←
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.historyHead}>
            <p className={`u-label ${styles.note}`}>
              الأحدث أولًا — يُحفظ آخر 200 إدخال
            </p>
            <button
              type="button"
              className={`u-label ${styles.clearBtn}`}
              onClick={() => void clear()}
            >
              مسح السجل ✕
            </button>
          </div>
          <ul className={styles.historyList}>
            {rows.map((row, i) => (
              <HistoryRow
                key={`${row.work.id}-${row.episodeId ?? "film"}-${i}`}
                row={row}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
