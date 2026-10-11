import Link from "next/link";
import { site } from "@/data/site";
import { Wordmark } from "@/components/ui/button";

/**
 * The footer is the rights ledger: what is free, where it streams from, and
 * what we draw ourselves — every line true, no fine print elsewhere.
 */
export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-rule bg-coal">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-4 py-16 md:grid-cols-[1.25fr_0.75fr_1.2fr] md:px-8">
        <div>
          <Wordmark />
          <p className="mt-6 max-w-sm text-sm leading-7 text-ash">
            دار الأفلام المفتوحة: أرشيف عربي منسّق لأفلام الملكية العامة والمشاع الإبداعي —
            مشاهدة قانونية بالكامل، مجانًا، وبلا حساب.
          </p>
          <p className="label-ar mt-4 text-tungsten">بلا إعلانات · بلا تتبّع · بلا مقابل</p>
        </div>

        <nav aria-label="روابط الفوتر" className="flex flex-col gap-2.5 self-start">
          {site.nav.map((l) => (
            <Link key={l.href} href={l.href} className="w-fit text-sm text-ash transition-colors hover:text-bone">
              {l.labelAr}
            </Link>
          ))}
          <Link href="/بحث" className="w-fit text-sm text-ash transition-colors hover:text-bone">
            بحث
          </Link>
        </nav>

        <div className="text-sm text-ash">
          <h2 className="label-ar mb-4 text-bone">دفتر الحقوق</h2>
          <ul className="space-y-3 leading-6">
            {site.hosts.map((h) => (
              <li key={h.name}>
                <span className="text-faint">·</span>{" "}
                <a href={h.url} className="text-bone underline decoration-rule underline-offset-4 hover:decoration-tungsten" rel="noopener noreferrer" target="_blank">
                  {h.name}
                </a>{" "}
                — {h.roleAr}
              </li>
            ))}
            <li>
              <span className="text-faint">·</span> البطاقات الفنية المرسومة هنا من صناعة الأرشيف —
              لا تدّعي أنها الملصقات الأصلية لأي فيلم.
            </li>
            <li>
              <span className="text-faint">·</span> كل عمل تُعرض نسخة قابلة للتشغيل لأنه ملكية عامة
              أو مرخّص CC BY؛ لا نستضيف ولا نربط أي مادة مقرصنة.
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-rule-soft">
        <div className="label-ar mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-faint md:px-8">
          <span>© 2026 خيال · صُنع بحبٍّ للسينما</span>
          <span dir="ltr" className="label-mono">KHAYAL ARCHIVE · v0.9</span>
        </div>
      </div>
    </footer>
  );
}
