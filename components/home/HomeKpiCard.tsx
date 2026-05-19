// Clickable variant of StatCard used on the home page — wraps in a Link.
import Link from "next/link";

type Props = {
  href: string;
  label: string;
  value: string;
  sub?: React.ReactNode;
  title?: string; // tooltip: how the value is computed
};

export function HomeKpiCard({ href, label, value, sub, title }: Props) {
  return (
    <Link
      href={href}
      title={title}
      className="block text-left bg-surface rounded-card border border-rule hover:border-rule-strong p-4 transition-colors min-h-[100px]"
    >
      <div className="eyebrow mb-2">{label}</div>
      <div className="text-[26px] font-semibold leading-none tabnum text-ink-strong">{value}</div>
      {sub && <div className="mt-2 text-[11px] text-ink-muted leading-snug">{sub}</div>}
    </Link>
  );
}
