export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b hairline">
      <div className="aurora pointer-events-none absolute inset-0 -top-40" aria-hidden />
      <div className="grid-lines pointer-events-none absolute inset-0 -top-40" aria-hidden />
      <div className="shell relative py-10 sm:py-14">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="display mt-4 max-w-3xl text-[2.6rem] leading-[1.04] sm:text-6xl"><span className="text-gradient">{title}</span></h1>
        {intro && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">{intro}</p>}
      </div>
    </header>
  );
}
