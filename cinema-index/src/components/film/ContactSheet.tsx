import { Link } from "react-router-dom";
import type { Work, Film } from "../../data";
import { isFilm } from "../../data";
import { ArtNote } from "../primitives";
import { workHref } from "./WorkIndex";
import styles from "./ContactSheet.module.css";

interface Frame {
  /** Frame number shown under the image, e.g. ف-021 */
  frame: string;
  src: string;
  alt: string;
  captionAr: string;
  href: string;
}

export function framesFromFilms(films: Film[], startNumber = 21): Frame[] {
  return films.map((f, i) => ({
    frame: `ف-${String(startNumber + i).padStart(3, "0")}`,
    src: f.art.src,
    alt: f.art.altAr,
    captionAr: `${f.titleAr} (${f.year})`,
    href: `/film/${f.id}`,
  }));
}

/**
 * Contact sheet — a horizontal strip of numbered frames.
 * Snap-scrolls on small screens; a measured grid on wide ones.
 */
export default function ContactSheet({
  frames,
  title,
}: {
  frames: Frame[];
  title: string;
}) {
  return (
    <section className={styles.sheet} aria-label={title}>
      <ul className={styles.strip}>
        {frames.map((fr) => (
          <li key={fr.frame} className={styles.frame}>
            <Link to={fr.href} className={styles.frameLink}>
              <span className={styles.imageWrap}>
                <img src={fr.src} alt={fr.alt} loading="lazy" className={styles.image} />
              </span>
              <span className={styles.captionRow}>
                <span className={`u-mono ${styles.frameNo}`}>{fr.frame}</span>
                <span className={styles.caption}>{fr.captionAr}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <ArtNote compact />
    </section>
  );
}

/** Small still + label used in essays and feature pages. */
export function StillsRow({ works }: { works: Work[] }) {
  return (
    <ul className={styles.stillsRow}>
      {works.map((w) => (
        <li key={w.id} className={styles.stillItem}>
          <Link to={workHref(w)} className={styles.stillLink}>
            <span className={styles.imageWrap}>
              <img src={w.art.src} alt={w.art.altAr} loading="lazy" className={styles.image} />
            </span>
            <span className={styles.stillMeta}>
              <span className="u-mono u-accent">{w.indexCode}</span>
              <span className={styles.stillTitle}>
                {w.titleAr}
                {!isFilm(w) && <span className="u-label"> · مسلسل</span>}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
