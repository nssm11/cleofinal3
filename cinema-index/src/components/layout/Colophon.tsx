import { Link } from "react-router-dom";
import { ISSUE } from "../../lib/format";
import styles from "./Colophon.module.css";

export default function Colophon() {
  return (
    <footer className={styles.colophon}>
      <div className={`band ${styles.grid}`}>
        <section className={styles.brand}>
          <p className={styles.wordmark}>الفِهرِس</p>
          <p className={styles.statement}>
            دورية سينمائية مستقلة تُصدر كواجهة اكتشاف ومشاهدة. نقرأ الأفلام
            كأعمال مفهرسة — بأرقامها ومجموعاتها وإحالاتها — لا كصفحات منتجات.
            العدد الأول مبنيّ بالكامل على سينما ملكية عامة، ويُشاهَد عبر مزوّد
            مُصرَّح.
          </p>
          <p className={`u-label ${styles.issue}`}>
            العدد {ISSUE.number} — {ISSUE.seasonAr}
          </p>
        </section>

        <nav className={styles.links} aria-label="فهرس الروابط">
          <p className={`u-label ${styles.head}`}>الفهرس</p>
          <ul>
            <li>
              <Link className="link-rule" to="/catalog">
                كل الأعمال
              </Link>
            </li>
            <li>
              <Link className="link-rule" to="/catalog?view=collections">
                المجموعات المُنتقاة
              </Link>
            </li>
            <li>
              <Link className="link-rule" to="/series/les-vampires">
                المسلسلات والحلقات
              </Link>
            </li>
            <li>
              <Link className="link-rule" to="/watchlist">
                قائمة المشاهدة
              </Link>
            </li>
            <li>
              <Link className="link-rule" to="/history">
                سجل المشاهدة
              </Link>
            </li>
          </ul>
        </nav>

        <section className={styles.sources}>
          <p className={`u-label ${styles.head}`}>المصادر والحقوق</p>
          <p className={styles.note}>
            جميع الأفلام والحلقات <strong>ملكية عامة أو مرخّصة بحرية</strong>،
            تُقدَّم عبر ملفات ويكيميديا كومنز المُتحقَّق منها — المشغّل يعرض
            الجودات الحقيقية والتنزيلات من ملفات المزوّد نفسه. لا ندّعي تقديم
            توزيع تجاري غير محدود.
          </p>
          <p className={styles.note}>
            الصور واللقطات المنشورة <strong>تعبيرات تحريرية أصلية</strong>{" "}
            أُنتجت لهذه الدورية — وليست لقطات رسمية من الأفلام. كل سطح يُشير إلى
            ذلك.
          </p>
          <p className={styles.note}>
            قائمة المشاهدة والسجل يعملان محليًا في متصفحك: لا حساب، ولا خادم —
            ومُجهَّزان لربطها بواجهة خلفية آمنة لاحقًا.
          </p>
        </section>
      </div>

      <div className={styles.signoff}>
        <span className="u-label u-label-latin">© 2026 THE CINEMA INDEX</span>
        <span className="u-label">تجربة تحريرية رقمية مستقلة</span>
        <span className="u-label">صُمِّم للقراءة RTL أولًا</span>
      </div>
    </footer>
  );
}
