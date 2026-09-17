export function CategoryIntro({ title, description }: { title: string; description?: string | null }) {
  return (
    <div className="border-b border-line px-8 py-12">
      <h1 className="font-sans text-[32px] font-bold tracking-[-0.02em]">{title}</h1>
      {description && <p className="mt-3 max-w-[48ch] font-sans text-[14px] leading-[1.6] text-text-secondary">{description}</p>}
    </div>
  );
}
