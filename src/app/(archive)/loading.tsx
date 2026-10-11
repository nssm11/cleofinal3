export default function ArchiveLoading() {
  return (
    <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-24 md:px-8" role="status" aria-label="جارٍ التحميل">
      <span className="size-3 animate-pulse rounded-full bg-tungsten motion-reduce:animate-none" aria-hidden />
      <span className="label-ar text-ash">تُقلب الصفحة في البرنامج…</span>
    </div>
  );
}
