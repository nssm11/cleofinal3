import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useSearch } from "./SearchContext";
import { useWatchlist } from "../../lib/library/useLibrary";
import { ISSUE } from "../../lib/format";
import styles from "./Masthead.module.css";

const navItems = [
  { to: "/catalog", label: "الفهرس" },
  { to: "/catalog?view=collections", label: "المجموعات" },
  { to: "/series/les-vampires", label: "المسلسلات" },
  { to: "/watchlist", label: "قائمة المشاهدة" },
  { to: "/history", label: "السجل" },
];

export default function Masthead() {
  const { openSearch } = useSearch();
  const { ids } = useWatchlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const { search } = useLocation();

  /** Query-aware active state: /catalog and /catalog?view=collections are siblings. */
  const isItemActive = (to: string) => {
    if (!to.startsWith("/catalog")) return true;
    const isCollections =
      new URLSearchParams(search).get("view") === "collections";
    return to.includes("view=collections") ? isCollections : !isCollections;
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={styles.masthead}>
      <div className={styles.folioRail}>
        <span className="u-label">العدد {ISSUE.number}</span>
        <span className={`u-label u-label-latin ${styles.folioCenter}`}>
          {ISSUE.strapline}
        </span>
        <span className="u-label">{ISSUE.seasonAr}</span>
      </div>

      <div className={styles.mainRow}>
        <Link
          to="/"
          className={styles.wordmark}
          aria-label="الفِهرِس — الصفحة الرئيسية"
        >
          الفِهرِس
        </Link>

        <nav className={styles.nav} aria-label="التنقّل الرئيسي">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive && isItemActive(item.to) ? styles.navActive : ""}`
              }
            >
              {item.label}
              {item.to === "/watchlist" && ids.size > 0 && (
                <sup className={styles.count}>{ids.size}</sup>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={openSearch}>
            <span className="u-label">بحث</span>
            <span aria-hidden className={styles.searchGlyph}>
              ⌕
            </span>
          </button>
          <button
            type="button"
            className={`${styles.action} ${styles.menuButton}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span className="u-label">قائمة</span>
            <span aria-hidden className={styles.menuGlyph}>
              ≡
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className={styles.menuSheet}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="قائمة التنقّل"
        >
          <div className={styles.menuHead}>
            <span className="u-label">التنقّل</span>
            <button
              type="button"
              className={styles.action}
              onClick={() => setMenuOpen(false)}
            >
              <span className="u-label">إغلاق</span>
              <span aria-hidden>✕</span>
            </button>
          </div>
          <ul className={styles.menuList}>
            {navItems.map((item, i) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={styles.menuLink}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="u-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.menuLabel}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <p className={styles.menuColophon}>
            <span className="u-label u-label-latin">THE CINEMA INDEX</span>
            <br />
            دورية سينمائية مستقلة — العدد {ISSUE.number}، {ISSUE.seasonAr}
          </p>
        </div>
      )}
    </header>
  );
}
