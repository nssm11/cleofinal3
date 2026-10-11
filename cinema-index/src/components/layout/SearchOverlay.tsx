import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "./SearchContext";
import { searchWorks, isFilm, workYearLabel } from "../../data";
import { useWatchlist } from "../../lib/library/useLibrary";
import styles from "./SearchOverlay.module.css";

const RECENT_KEY = "cinema-index:recent-searches:v1";

function readRecent(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export default function SearchOverlay() {
  const { open, closeSearch, openSearch } = useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { has } = useWatchlist();

  const results = useMemo(() => searchWorks(query).slice(0, 12), [query]);

  useEffect(() => {
    if (open) {
      setRecent(readRecent());
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // global shortcut: ⌘K / Ctrl+K opens the search sheet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) closeSearch();
        else {
          setRecent(readRecent());
          setQuery("");
          setCursor(0);
          // open through the context by focusing input after render
          openSearch();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openSearch, closeSearch]);

  if (!open) return null;

  const commit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...readRecent().filter((r) => r !== trimmed)].slice(0, 6);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setRecent(next);
  };

  const go = (workId: string) => {
    commit(query);
    closeSearch();
    navigate(workId === "les-vampires" ? `/series/${workId}` : `/film/${workId}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[cursor]) go(results[cursor].id);
      else commit(query);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="البحث في الفهرس">
      <div className={styles.sheet}>
        <div className={styles.head}>
          <label className="sr-only" htmlFor="search-input">
            عبارة البحث
          </label>
          <input
            id="search-input"
            ref={inputRef}
            className={styles.input}
            type="search"
            placeholder="ابحث في الفهرس — عنوان، مخرج، سنة، ممثّل…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          <button type="button" className={styles.close} onClick={closeSearch}>
            <span className="u-label">إغلاق</span>
            <span aria-hidden>✕</span>
          </button>
        </div>

        <div className={styles.metaRow}>
          <span className="u-label">
            {query.trim() ? `${results.length} نتيجة` : "اكتب للبحث — ↑ ↓ للتنقّل، Enter للفتح"}
          </span>
          {query.trim() && results.length > 0 && (
            <span className="u-label u-faint">بحث مباشر في العدد 01</span>
          )}
        </div>

        <div className={styles.body}>
          {query.trim() === "" && recent.length > 0 && (
            <section>
              <p className={`u-label ${styles.sectionLabel}`}>عمليات بحث سابقة</p>
              <ul className={styles.recent}>
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      className={styles.recentChip}
                      onClick={() => setQuery(r)}
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {query.trim() !== "" && results.length === 0 && (
            <p className={styles.empty}>
              لا نتائج تحت هذه العبارة. جرّب اسم مخرج («فيرتوف»، «هوكس») أو سنة («1922»)
              أو كلمة من العنوان.
            </p>
          )}

          <ul className={styles.results}>
            {results.map((w, i) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={`${styles.result} ${i === cursor ? styles.resultActive : ""}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(w.id)}
                >
                  <span className="u-mono">{w.indexCode}</span>
                  <span className={styles.resultTitle}>
                    {w.titleAr}
                    <span className={styles.resultLatin}>{w.titleLatin}</span>
                  </span>
                  <span className={styles.resultMeta}>
                    {workYearLabel(w)} · {w.director.nameAr}
                    {!isFilm(w) && " · مسلسل"}
                    {has(w.id) && <span className={styles.saved}>محفوظ</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
