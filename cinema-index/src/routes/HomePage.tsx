import { Link } from "react-router-dom";
import {
  films,
  filmById,
  seriesById,
  collectionById,
  filmsInCollection,
  type Work,
} from "../data";
import { runtimeLabel, ISSUE } from "../lib/format";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { useEpisodeProgressMap } from "../lib/library/useLibrary";
import { SectionHead, MetaRail, ArtNote, ActionLink, ProgressTick } from "../components/primitives";
import ContactSheet, { framesFromFilms, StillsRow } from "../components/film/ContactSheet";
import { WorkIndexTable } from "../components/film/WorkIndex";
import styles from "./HomePage.module.css";

/* ---------- shared editorial furniture ---------- */

function SpreadMark({ n, label }: { n: string; label: string }) {
  return (
    <div className={styles.spreadMark} aria-hidden>
      <span className={styles.spreadLine} />
      <span className="u-label">
        {label} — {n}
      </span>
      <span className={styles.spreadLine} />
    </div>
  );
}

/* ---------- 1. cover story ---------- */

function CoverStory() {
  const lead = filmById("man-with-a-movie-camera")!;
  return (
    <section className={styles.cover} aria-labelledby="cover-title">
      <div className={`band ${styles.coverGrid}`}>
        <div className={styles.coverText}>
          <p className={styles.coverKicker}>
            <span className="u-mono u-accent">ملف العدد {ISSUE.number}</span>
            <span className="u-label">{lead.indexCode}</span>
          </p>

          <h1 id="cover-title" className={styles.coverTitle}>
            <span className={styles.coverLine}>رجلٌ</span>{" "}
            <span className={styles.coverLine}>بآلة</span>{" "}
            <span className={styles.coverLine}>تصوير</span>
          </h1>

          <p className={styles.coverDek}>
            في عام 1929 خرج دزغا فيرتوف إلى شوارع موسكو بكاميرته ليثبت أن السينما
            لغةٌ بصرية خالصة — بلا ممثلين، وبلا قصة، وبلا استوديو. يومٌ كامل في حياة
            مدينة يُركَّب أمامنا كسيمفونية، وفي كل لقطة منه يخبرنا المونتاج: كل ما
            تراه مُركَّب.
          </p>

          <MetaRail
            items={[
              ["الإخراج", "دزغا فيرتوف"],
              ["السنة", "1929"],
              ["المدة", runtimeLabel(lead.runtimeMin)],
              ["البلد", lead.countryAr],
              ["النوع", "وثائقي · طليعة"],
            ]}
          />

          <div className={styles.coverActions}>
            <ActionLink to={`/watch/${lead.id}`}>شاهد الآن</ActionLink>
            <ActionLink to={`/film/${lead.id}`} variant="outline">
              افتح الملف
            </ActionLink>
          </div>
        </div>

        <figure className={styles.coverFigure}>
          <div className={styles.coverImageWrap}>
            <img src="/art/cover-story.jpg" alt={lead.art.altAr} className={styles.coverImage} />
          </div>
          <figcaption className={styles.coverCaption}>
            <span className="u-mono u-accent">الغلاف</span>
            <span>{lead.titleAr} — {lead.titleLatin}</span>
            <ArtNote compact />
          </figcaption>
        </figure>
      </div>

      <div className={`band ${styles.coverTicker}`}>
        <span className="u-label">في هذا العدد</span>
        <ul>
          <li>المجموعة 01 — الضوء والمدينة</li>
          <li>ورقة تماس — لقطات من الفهرس</li>
          <li>الفهرس المختصر — 15 عملًا</li>
          <li>المسلسل — المصاصون، 10 حلقات</li>
        </ul>
        <Link className={`link-rule ${styles.tickerLink}`} to="/catalog">
          ادخل الفهرس ←
        </Link>
      </div>
    </section>
  );
}

/* ---------- 2. collection essay ---------- */

function CollectionEssay() {
  const col = collectionById("light-city")!;
  const works = filmsInCollection(col.id);
  return (
    <section className={`band ${styles.essay}`} aria-labelledby="essay-title">
      <SectionHead code={col.code} label="مجموعة مُنتقاة" title={col.titleAr} />

      <div className={styles.essayGrid}>
        <div className={styles.essayIntro}>
          <p className={styles.essaySubtitle}>{col.subtitleAr}</p>
          <p className={styles.essayBody}>{col.introAr}</p>
          <Link className={`link-rule ${styles.essayMore}`} to="/catalog?view=collections">
            كل المجموعات ←
          </Link>
        </div>

        <blockquote className={styles.pullQuote}>
          <p>{col.pullQuoteAr}</p>
          <cite className="u-label">من مقدمة العدد</cite>
        </blockquote>
      </div>

      <StillsRow works={works} />
    </section>
  );
}

/* ---------- 3. contact sheet ---------- */

function ContactSheetSpread() {
  const picks = [
    "nosferatu",
    "das-cabinet-des-dr-caligari",
    "detour",
    "carnival-of-souls",
    "un-chien-andalou",
    "metropolis",
    "night-of-the-living-dead",
    "le-voyage-dans-la-lune",
  ]
    .map((id) => filmById(id)!)
    .filter(Boolean);

  return (
    <section className={`band ${styles.contactSection}`} aria-labelledby="contact-title">
      <SectionHead
        code="ورقة 03"
        label="لقطات من الفهرس"
        title="ورقة تماس"
        more="/catalog"
        moreLabel="المزيد"
      />
      <p className={styles.contactNote} id="contact-title">
        ثمانية أطر مرقّمة — كل إطار يفتح ملفًا. الصور تعبيرات تحريرية لهذه الدورية،
        تُقرأ بمحاذاة الأفلام التي تُحال عليها.
      </p>
      <ContactSheet frames={framesFromFilms(picks)} title="ورقة تماس من الفهرس" />
    </section>
  );
}

/* ---------- 4. the index ---------- */

function IndexSpread() {
  const works: Work[] = [...films, seriesById("les-vampires")!].sort(
    (a, b) => a.indexCode.localeCompare(b.indexCode),
  );

  return (
    <section className={`band ${styles.indexSection}`} aria-labelledby="index-title">
      <SectionHead
        code="فهرس العدد"
        label="15 عملًا · ملكية عامة"
        title="الفهرس المختصر"
        more="/catalog"
        moreLabel="الفهرس الكامل"
      />
      <p className={styles.indexNote} id="index-title">
        الأرقام علامات رفٍّ ثابتة للإحالة والاقتباس — وليست ترتيبًا ولا تقييمًا.
        التصفية حسب العقود تعمل مباشرة.
      </p>
      <WorkIndexTable works={works} emptyNote="لا نتائج." />
    </section>
  );
}

/* ---------- 5. serial column ---------- */

function SerialColumn() {
  const s = seriesById("les-vampires")!;
  const progressMap = useEpisodeProgressMap(s.id);

  return (
    <section className={`band ${styles.serial}`} aria-labelledby="serial-title">
      <div className={styles.serialHead}>
        <SectionHead code={s.indexCode} label="مسلسل · 1915 – 1916" title={s.titleAr} />
        <p className={styles.serialIntro} id="serial-title">
          {s.noteAr}
        </p>
        <div className={styles.serialActions}>
          <ActionLink to={`/series/${s.id}`}>فهرس الحلقات</ActionLink>
          <ActionLink to={`/watch/${s.id}/1`} variant="outline">
            ابدأ الحلقة 1
          </ActionLink>
        </div>
      </div>

      <ol className={styles.episodeLedger}>
        {s.episodes.map((ep) => {
          const p = progressMap[ep.id] ?? 0;
          return (
            <li key={ep.id}>
              <Link className={styles.episodeRow} to={`/watch/${s.id}/${ep.number}`}>
                <span className={`u-mono ${styles.epNo}`}>
                  {String(ep.number).padStart(2, "0")}
                </span>
                <span className={styles.epTitle}>{ep.titleAr}</span>
                <span className={styles.epLatin}>{ep.titleOriginal}</span>
                <span className={`u-mono ${styles.epMeta}`}>~{ep.runtimeMin} د</span>
                {p > 0 && <ProgressTick value={p} label={p >= 0.97 ? "" : ""} />}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- page ---------- */

export default function HomePage() {
  useDocumentTitle("العدد " + ISSUE.number);
  return (
    <>
      <CoverStory />
      <SpreadMark n="02" label="صفحة" />
      <CollectionEssay />
      <SpreadMark n="03" label="ورقة" />
      <ContactSheetSpread />
      <SpreadMark n="04" label="صفحة" />
      <IndexSpread />
      <SpreadMark n="05" label="عمود" />
      <SerialColumn />
    </>
  );
}
