// Compact page header — title + subtitle + right-side meta. No flair.

type Props = {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
};

export function PageHeader({ title, subtitle, meta }: Props) {
  return (
    <header className="mb-6 pb-4 border-b border-rule">
      <div className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-[20px] font-semibold text-ink-strong leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-ink-muted mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {meta && (
          <div className="text-right text-[12px] text-ink-muted leading-snug shrink-0">{meta}</div>
        )}
      </div>
    </header>
  );
}
