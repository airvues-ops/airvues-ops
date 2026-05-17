// Founder home — dense operational landing. Compact KPIs + quick-jump cards to each section.
import { getAppSession } from "@/lib/session";
import { mrr, onRetainerPct, openReceivables, revenueYtd, sprintDelivery } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/ui/StatCard";
import Link from "next/link";

function firstName(email: string | null | undefined): string {
  if (!email) return "Lee";
  const local = email.split("@")[0];
  return local.split(".")[0].charAt(0).toUpperCase() + local.split(".")[0].slice(1);
}

async function safe<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    return { error: (err as Error).message };
  }
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default async function HomePage() {
  const session = await getAppSession();
  const name = firstName(session?.user?.email);

  const [revenue, mrrR, retainer, sprint, receivables] = await Promise.all([
    safe(revenueYtd),
    safe(mrr),
    safe(onRetainerPct),
    safe(sprintDelivery),
    safe(openReceivables),
  ]);

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-5">
      <PageHeader
        title={`Welcome, ${name}.`}
        subtitle="A snapshot of the firm. Click any tile to drill in."
        meta={
          <>
            <div className="font-mono tabnum">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="text-[11px] text-ink-faint mt-0.5">5-min cache</div>
          </>
        }
      />

      {/* KPI grid */}
      <SectionTitle title="Key indicators" aside="Phase 1 metrics live · others coming online" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard
          label="YTD Revenue"
          value={"value" in revenue ? revenue.formatted : "—"}
          sub={"value" in revenue ? revenue.targetLabel : "—"}
        />
        <StatCard
          label="MRR"
          value={"value" in mrrR ? mrrR.formatted : "—"}
          sub={"value" in mrrR ? mrrR.targetLabel : "—"}
        />
        <StatCard
          label="Open AR"
          value={"total" in receivables ? fmtCurrency(receivables.total) : "—"}
          sub={
            "count" in receivables
              ? `${receivables.count} unpaid${receivables.overdue > 0 ? ` · ${receivables.overdue} past due` : ""}`
              : "—"
          }
        />
        <StatCard
          label="Sprint delivery"
          value={"value" in sprint ? sprint.formatted : "—"}
          sub={"value" in sprint ? sprint.note ?? undefined : undefined}
        />
        <StatCard
          label="On retainer"
          value={"value" in retainer ? retainer.formatted : "—"}
          sub={"value" in retainer ? retainer.note ?? undefined : undefined}
        />
      </div>

      {/* Quick-jump cards */}
      <SectionTitle title="Jump to" aside="Drill into a section" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: "/money", title: "Money", desc: "Invoices · AR aging · MRR · top clients · drill into each record" },
          { href: "/pipeline", title: "Pipeline", desc: "Stalled quotes · funnel · goal tracker · stage breakdown" },
          { href: "/clients", title: "Clients", desc: "Active · at-risk · retainer tier · concentration risk" },
          { href: "/team", title: "Team", desc: "Headcount · unrouted payments · onboarding pipeline" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-surface border border-rule rounded-card p-4 hover:border-rule-strong transition-colors"
          >
            <div className="text-[14px] font-semibold text-ink-strong mb-1">{card.title}</div>
            <div className="text-[12px] text-ink-muted leading-snug">{card.desc}</div>
            <div className="mt-3 text-[11px] font-mono text-emerald">Open →</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
