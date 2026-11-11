/** Section heading used across pages: small eyebrow pill + gradient title + optional serif accent. */
export function SectionHead({ eyebrow, title, accent, className = "" }: { eyebrow: string; title: string; accent?: string; className?: string }) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="display mt-4 text-[2.1rem] leading-[1.06] sm:text-[2.9rem]">
        <span className="text-gradient">{title}</span>
        {accent && (
          <>
            {" "}
            <span className="serif text-champagne text-[1.08em]">{accent}</span>
          </>
        )}
      </h2>
    </div>
  );
}
