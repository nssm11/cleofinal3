import { Link } from "react-router-dom";
import { workById, type Work } from "../data";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useWatchlist, useProgress } from "../lib/library/useLibrary";
import { SectionHead } from "../components/primitives";
import { WorkIndexRow } from "../components/film/WorkIndex";
import { dateLabel } from "../lib/format";
import styles from "./LibraryPages.module.css";

function WatchlistRow({ work, addedAt }: { work: Work; addedAt: string }) {
  const progress = useProgress(work.id);
  return (
    <WorkIndexRow
      w={work}
      progress={progress}
      footer={
        <span className={`u-label ${styles.rowFoot}`}>
          حُفظ {dateLabel(addedAt)}
        </span>
      }
    />
  );
}

export default function WatchlistPage() {
  useDocumentTitle("قائمة المشاهدة");
  const { entries } = useWatchlist();

  const works = entries
    .map((e) => ({ work: workById(e.workId), addedAt: e.addedAt }))
    .filter((x): x is { work: Work; addedAt: string } => Boolean(x.work));

  return (
    <div className={`band ${styles.page}`}>
      <SectionHead
        code="الرف"
        label={`${works.length} محفوظًا`}
        title="قائمة المشاهدة"
      />

      {works.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>الصفحة ما زالت بيضاء.</p>
          <p className={styles.emptyBody}>
            لا شيء محفوظ بعد. تصفّح الفهرس واحفظ ما يستحق العودة إليه — القائمة
            تُحفظ محليًا في متصفحك، وتبقى جاهزة لربطها بحسابك مستقبلًا.
          </p>
          <Link
            to="/catalog"
            className={`link-rule u-mono ${styles.emptyLink}`}
          >
            اذهب إلى الفهرس ←
          </Link>
        </div>
      ) : (
        <>
          <p className={`u-label ${styles.note}`}>
            مرتّبة بحسب تاريخ الحفظ — الأحدث أولًا
          </p>
          <div className={styles.tableWrap}>
            <div className={styles.headRow} aria-hidden>
              <span className="u-label">الرمز</span>
              <span className="u-label">العنوان</span>
              <span className="u-label">—</span>
              <span className="u-label">—</span>
              <span className="u-label">—</span>
              <span className="u-label">—</span>
              <span className="u-label">—</span>
            </div>
            <ul>
              {works.map(({ work, addedAt }) => (
                <WatchlistRow key={work.id} work={work} addedAt={addedAt} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
