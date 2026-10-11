import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./primitives.module.css";

/** Section opening: mono label + rule + display title + optional action link. */
export function SectionHead({
  code,
  label,
  title,
  more,
  moreLabel = "كل الأعمال",
}: {
  code: string;
  label: string;
  title: string;
  more?: string;
  moreLabel?: string;
}) {
  return (
    <header className={styles.sectionHead}>
      <div className={styles.sectionTop}>
        <span className="u-mono u-accent">{code}</span>
        <span className="u-label">{label}</span>
        <span className={styles.sectionRule} aria-hidden />
        {more && (
          <Link className={`link-rule ${styles.sectionMore}`} to={more}>
            {moreLabel} ←
          </Link>
        )}
      </div>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </header>
  );
}

/** Metadata rail — compact key/value pairs in mono. */
export function MetaRail({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className={styles.metaRail}>
      {items.map(([k, v]) => (
        <div key={k} className={styles.metaRow}>
          <dt className="u-label">{k}</dt>
          <dd className={styles.metaValue}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Genre words — typographic, not chips. */
export function GenreWords({ labels }: { labels: string[] }) {
  return (
    <ul className={styles.genreWords}>
      {labels.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

/** Art provenance note — required wherever editorial artwork appears. */
export function ArtNote({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? styles.artNoteCompact : styles.artNote}>
      <span className="u-label">تعبير تحريري</span>
      {!compact && " — صورة أُنتجت لهذه الدورية، وليست لقطة من الفيلم"}
    </p>
  );
}

/** Progress tick — 0..1 as a fine rule. */
export function ProgressTick({ value, label }: { value: number; label?: string }) {
  return (
    <div className={styles.progress} title={label}>
      <span className={styles.progressTrack}>
        <span
          className={styles.progressFill}
          style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
        />
      </span>
      {label && <span className="u-label">{label}</span>}
    </div>
  );
}

/** Primary action — flat accent block with ink border. */
export function ActionLink({
  to,
  href,
  children,
  variant = "solid",
  external = false,
}: {
  to?: string;
  href?: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  external?: boolean;
}) {
  const cls = variant === "solid" ? styles.actionSolid : styles.actionOutline;
  if (href) {
    return (
      <a
        className={cls}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link className={cls} to={to ?? "/"}>
      {children}
    </Link>
  );
}
