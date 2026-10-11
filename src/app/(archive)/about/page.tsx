import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/data/site";
import { archiveStats } from "@/features/content/repository";

export const metadata: Metadata = {
  title: "حول خيال",
  description:
    "بيان المنصة: أرشيف عربي لأفلام الملكية العامة والمشاع الإبداعي — كيف يعمل، ولماذا، وما سياساته.",
};

/**
 * The manifesto page. Half projection room, half printed program: the paper
 * sections exist to prove the token system flips worlds without losing its
 * voice — and to say the unglamorous truths up front.
 */
export default function AboutPage() {
  const stats = archiveStats();
  return (
    <div>
      {/* the statement — dark, the house voice */}
      <section className="mx-auto max-w-[1180px] px-4 pb-16 pt-12 md:px-8 md:pt-16">
        <p className="label-ar text-tungsten">بيان</p>
        <h1 className="display-tight mt-4 max-w-4xl text-4xl font-bold leading-[1.3] sm:text-5xl lg:text-6xl">
          السينما ذاكرة، <span className="text-tungsten">والذاكرة لا تُحتكر</span>.
        </h1>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 text-[15px] leading-9 text-bone/90">
            {site.missionAr.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <aside className="self-start rounded-frame border border-rule bg-coal p-6">
            <h2 className="label-ar mb-4 text-tungsten">الأرشيف بالأرقام</h2>
            <dl className="nums space-y-2.5 text-sm">
              {[
                ["أفلام كاملة", stats.films],
                ["مسلسلات", stats.series],
                ["حلقات محفوظة", stats.episodes],
                ["بلدان", stats.countries],
                ["امتداد السنين", stats.years],
                ["أعمال بترخيص CC BY", stats.openLicensed],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-baseline justify-between gap-4 border-b border-rule-soft pb-2">
                  <dt className="text-ash">{k}</dt>
                  <dd className="font-mono text-bone">{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {/* the mechanics — on paper */}
      <section className="on-paper">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-16 md:grid-cols-3 md:px-8">
          <div className="md:col-span-1">
            <p className="label-ar text-cinnabar">كيف يعمل</p>
            <h2 className="display-tight mt-2 text-3xl font-bold text-ink sm:text-4xl">بلا سيرفر فيديو، وبلا قرصنة</h2>
            <p className="mt-4 text-sm leading-8 text-inkmuted">
              الميزانية صفر. لم نكن لنكذب بذلك: لا نرفع أفلامًا إلى سيرفرات مجهولة ولا نربط بنسخ
              مقرصنة. كل عرض هنا يعمل بنظام بسيط ومعلن.
            </p>
          </div>
          <ol className="list-none md:col-span-2">
            {[
              ["١", "نختار العمل", "كل عنوان في القائمة يُفحص وضعه القانوني: ملكية عامة مؤكدة (تخلٍّ عن التجديد، نهاية المدة، أخطاء إشعار) أو رخصة مشاع إبداعي مع الإسناد."],
              ["٢", "نوثّق المصدر", "لكل فيلم أو حلقة رابط إلى عنصره في Internet Archive — المكتبة الرقمية الأكبر في العالم، ومضيف النسخ القابلة للتشغيل فعليًا."],
              ["٣", "نُدير العدسة", "عند الضغط على «شغّل»، يجلب المشغّل قائمة الملفات من الأرشيف نفسه ويعرض أفضل نسخة H.264 متاحة، مع خيار الجودة والترجمة إن وُجدت."],
              ["٤", "نسجّل عندك أنت", "قائمتي وموضع المشاهدة يُحفظان في متصفحك فقط — لا حسابات، لا خوادم تتبع، لا كوكيز إعلانية."],
            ].map(([n, t, b]) => (
              <li key={n} className="grid grid-cols-[56px_1fr] gap-4 border-b border-ruleink py-6 first:border-t first:border-ruleink">
                <span className="nums font-mono text-2xl font-bold text-cinnabar">{n}</span>
                <div>
                  <h3 className="display-tight text-lg font-bold text-ink">{t}</h3>
                  <p className="mt-1.5 text-sm leading-7 text-inkmuted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* promises and policies — back in the dark */}
      <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div id="arabic" className="scroll-mt-24">
            <p className="label-ar text-tungsten">الشاشة العربية</p>
            <h2 className="display-tight mt-2 text-3xl font-bold">ما لم نضعه هنا، ولماذا</h2>
            <p className="mt-5 text-[15px] leading-8 text-ash">
              كثير من كلاسيكيات السينما المصرية والسورية والتونسية والمغربية ليست ملكية عامة: حقوقها
              حيّة مع شركات وعائلات، وأحيانًا مع نزاعات. المنصة لن تعرض عملًا واحدًا قبل أن تملك حق
              عرضه، ولن تغطي غيابها بروابط مسروقة. نعمل الآن على جرد الحالات القانونية، وملفات ترميم
              مشتركة مع أرشيفات إقليمية، وصفحات حقوق شفافة تُنشر مع كل عمل عند انضمامه.
            </p>
            <p className="label-ar mt-6 text-cinnabar">رفّ «قيد الترميم» وعدٌ مكتوب، لا ديكور.</p>
          </div>
          <div>
            <p className="label-ar text-tungsten">سياسات صريحة</p>
            <h2 className="display-tight mt-2 text-3xl font-bold">ما تلتزم به خيال</h2>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-ash">
              {[
                "لا روابط غير مصرّح بها أبدًا — ولا استثناء لـ«الأفلام الصعبة الوجود».",
                "لا نزيّف ملصقات ولا ننسب عملًا لفقدانه؛ البطاقات الفنية كلها من رسم الأرشيف، ومكتوب ذلك في الفوتر.",
                "أي عمل يثبت لاحقًا أن حقوقه لم تسقط يُسحب من الأرشيف وتوثَّق الحالة في سجل التغييرات.",
                "أفلام المشاع الإبداعي تُنسب دائمًا لصانعيها برخصتهم الكاملة (CC BY 4.0).",
                "التجربة كلها تعمل بميزانية صفر: أدوات حرة، استضافة مجانية، محتوى قانوني — وهذا ليس عذرًا بل قيدًا يصنع الصدق.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-tungsten" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* colophon */}
      <section className="border-t border-rule bg-coal/60">
        <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-8">
          <h2 className="label-ar text-ash">قُلوفون — أدوات الصنعة</h2>
          <div className="mt-6 grid gap-8 text-sm leading-7 text-faint sm:grid-cols-2 lg:grid-cols-4">
            <p>
              <b className="text-bone">الخطوط:</b> عارف رقعة (Aref Ruqaa) للعناوين العربية؛ IBM Plex Sans Arabic
              للواجهة والمتن؛ Fraunces للعناوين اللاتينية؛ JetBrains Mono لأرقام الأرشيف والتوقيت.
              كلها مفتوحة المصدر، مُقدَّمة ذاتيًا بلا تتبّع.
            </p>
            <p>
              <b className="text-bone">البرمجة:</b> Next.js App Router على React 19، TypeScript صارم،
              Tailwind v4 بكتيب رموز واحد، Framer Motion للحالة، وRadix للوصولية. البنية على ميزات،
              والاختبارات تغطي البحث والفهرس والنتقاء.
            </p>
            <p>
              <b className="text-bone">الصورة:</b> كل بطاقة فنية SVG تُولَّد من خوارزمية ثابتة البذرة —
              تدرّج الصبغة التاريخية، وهندسة المотив، وحبيبات الطباعة — فتكون لكل فيلم بصمته دون
              ادعاءٍ أنه الملصق الأصلي.
            </p>
            <p>
              <b className="text-bone">ما بعد النموذج:</b> حسابات متزامنة، تطبيق Android، ترجمة عربية
              للملاحظات، وترخيص أعمال عربية — مرتبة حسب ما يفتح أبواب الذاكرة أكثر.
            </p>
          </div>
          <p className="label-ar mt-10 border-t border-rule pt-5 text-faint">
            العودة إلى{" "}
            <Link href="/" className="text-tungsten underline underline-offset-4">برنامج الليلة</Link>{" "}
            ←
          </p>
        </div>
      </section>
    </div>
  );
}
