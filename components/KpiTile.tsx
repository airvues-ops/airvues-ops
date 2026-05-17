// KPI tile — single metric box. Variant `hero` is the big YTD revenue card; default is the smaller side tiles.
import type { KpiResult } from "@/lib/kpi";

type Props = {
  label: string;
  result: KpiResult | { error: string };
  hero?: boolean;
};

function isError(r: Props["result"]): r is { error: string } {
  return "error" in r;
}

function progressPercent(result: KpiResult): number {
  if (result.value == null || result.target == null || result.target === 0) return 0;
  return Math.min(100, Math.max(0, (result.value / result.target) * 100));
}

export function KpiTile({ label, result, hero = false }: Props) {
  if (isError(result)) {
    return (
      <div className={`bg-card p-${hero ? "8" : "5.5"} ${hero ? "row-span-2 col-span-2 bg-navy-deep" : ""} flex flex-col justify-between min-h-[156px]`}>
        <div className={`text-[10px] tracking-[0.16em] uppercase font-semibold ${hero ? "text-accent" : "text-ink-muted"}`}>{label}</div>
        <div className={`text-sm ${hero ? "text-bg/70" : "text-ink-muted"}`}>⚠ Unable to load · <span className="underline cursor-pointer">retry</span></div>
      </div>
    );
  }

  const p = progressPercent(result);

  if (hero) {
    return (
      <div className="bg-navy-deep text-bg p-8 row-span-2 col-span-2 flex flex-col justify-between min-h-[156px]">
        <div>
          <div className="text-[10px] tracking-[0.16em] uppercase font-semibold text-accent">{label}</div>
          <div className="display text-[96px] leading-[0.95] tracking-tightest mt-3">{result.formatted}</div>
          {result.targetLabel && (
            <div className="num text-[11px] text-bg/55 mt-2">{result.targetLabel}</div>
          )}
          {result.note && (
            <div className="text-[11px] text-bg/55 mt-1.5">{result.note}</div>
          )}
        </div>
        <div className="h-[3px] bg-bg/15 relative">
          <div className="absolute left-0 top-0 h-full bg-accent" style={{ width: `${p}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-5 flex flex-col justify-between min-h-[156px] hover:bg-bg-soft transition-colors">
      <div>
        <div className="text-[10px] tracking-[0.16em] uppercase font-semibold text-ink-muted">{label}</div>
        <div className="num font-medium text-[36px] leading-none text-ink mt-3 tracking-tighter">{result.formatted}</div>
      </div>
      <div>
        {result.targetLabel && (
          <div className="num text-[11px] text-ink-faint mt-1">{result.targetLabel}</div>
        )}
        {result.note && (
          <div className="text-[11px] text-ink-faint mt-1">{result.note}</div>
        )}
        <div className="h-[2px] bg-rule mt-3 relative">
          <div className="absolute left-0 top-0 h-full bg-navy-deep" style={{ width: `${p}%` }} />
        </div>
      </div>
    </div>
  );
}
