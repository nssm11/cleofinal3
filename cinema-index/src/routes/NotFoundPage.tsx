import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import styles from "./LibraryPages.module.css";

export default function NotFoundPage() {
  useDocumentTitle("خارج الفهرس");
  return (
    <div className={`band ${styles.page}`}>
      <p className="u-mono u-accent" style={{ marginBottom: "var(--sp-3)" }}>
        خطأ 404
      </p>
      <h1 className={styles.emptyTitle} style={{ fontSize: "var(--step-4)" }}>
        هذه الورقة ليست في الفهرس.
      </h1>
      <p className={styles.emptyBody}>
        العنوان الذي طلبته غير مسجَّل في العدد 01. يمكنك العودة إلى الفهرس الكامل،
        أو البدء من ملف العدد.
      </p>
      <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
        <Link to="/catalog" className={`link-rule u-mono ${styles.emptyLink}`}>
          الفهرس الكامل ←
        </Link>
        <Link to="/" className={`link-rule u-mono ${styles.emptyLink}`}>
          الصفحة الرئيسية ←
        </Link>
      </div>
    </div>
  );
}
