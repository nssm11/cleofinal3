import Link from "next/link";
import { archiveStats } from "@/features/content/repository";

/**
 * The numbers of the house — computed from the catalog, never hand-typed,
 * so the strip can never lie about what is in here.
 */
export function StatsStrip() {
  const s = archiveStats();
  const cells: Array<[string, string, string]> = [
    [String(s.films), "فيلمًا كاملًا", "Films"],
    [String(s.series), "مسلسلات بحلقاتها", "Series"],
    [s.years, "من سنة", "Years span"],
    [String(s.countries), "بلدان", "Countries"],
    [String(s.episodes), "حلقة محفوظة", "Episodes"],
    [String(s.openLicensed), "تحت المشاع", "CC-licensed"],
  ];
  return (
    <section aria-label="أرقام الأرشيف" className="border-y border-rule bg-coal/50">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 divide-x divide-x-reverse divide-rule px-4 md:grid-cols-6 md:px-8">
        {cells.map(([value, labelAr, labelLat], i) => (
          <div key={i} className="flex flex-col gap-1 px-3 py-6 text-center first:border-s-0">
            <span className="nums display-tight text-3xl font-bold text-tungsten">{value}</span>
            <span className="label-ar text-bone">{labelAr}</span>
            <span className="label-mono hidden text-[9px] text-faint lg:block" dir="ltr">
              {labelLat}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * The honest promise: the Arab-cinema shelf is not filled with stock posters
 * or pirated rips — it is a printed "under restoration" notice, part of the
 * mission, on program paper.
 */
export function ArabScreenPanel() {
  return (
    <section aria-labelledby="arab-screen-title" className="on-paper relative mx-auto my-16 max-w-[1180px] px-4 md:mx-auto md:px-8">
      <div className="relative border border-ruleink bg-paper px-6 py-10 sm:px-10 sm:py-14">
        <div className="rule-double-ink mb-8" aria-hidden />
        <div className="grid items-start gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="label-ar text-inkmuted">رفّ قيد التحضير</p>
            <h2 id="arab-screen-title" className="display-tight mt-2 text-3xl font-bold text-ink sm:text-4xl">
              الشاشة العربية
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-inkmuted">
              أرشيف لا يكتمل بدون سينمائه. نعمل على توثيق كلاسيكيات السينما المصرية والسورية واللبنانية
 والتونسية المبكرة، ملفًا ملفًا: تتبع حالات الملكية العامة، ومفاوضات ترميم وترخيص مع
              العائلات والجهات المالكة — ولن يُعرض عمل عربي واحد هنا قبل أن نملك حق عرضه.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/about#arabic" className="label-ar border-b-2 border-cinnabar/70 pb-1 text-ink transition-colors hover:border-cinnabar hover:text-cinnabar-deep">
                اقرأ خطة العمل ←
              </Link>
              <span className="text-sm text-inkmuted">وعدٌ مكتوب، لا واجهة فارغة.</span>
            </div>
          </div>
          <div className="mx-auto grid size-32 rotate-[-6deg] place-items-center rounded-full border-2 border-dashed border-cinnabar/60 text-center md:mx-0" aria-hidden>
            <span className="label-ar text-sm font-semibold leading-5 text-cinnabar-deep">
              قريبًا
              <span className="label-mono mt-1 block text-[9px] tracking-[0.2em]" dir="ltr">UNDER RESTORATION</span>
            </span>
          </div>
        </div>
        <div className="rule-double-ink mt-10" aria-hidden />
      </div>
    </section>
  );
}
