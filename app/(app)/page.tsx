// Founder home — dense operational landing. Compact KPIs + quick-jump cards to each section.
// All KPI tiles + Jump-to cards are clickable. Per Lee's instruction: "click any tile to drill in."
import { getAppSession } from "@/lib/session";
import { companyGoalsData, mrr, onRetainerPct, openReceivables, revenueYtd, sprintDelivery } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CompanyGoals } from "@/components/home/CompanyGoals";
import { HomeKpiCard } from "@/components/home/HomeKpiCard";
import { HomeJumpCard } from "@/components/home/HomeJumpCard";
import { NAV_ITEMS } from "@/lib/nav";

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

  const [revenue, mrrR, retainer, sprint, receivables, goals] = await Promise.all([
    safe(revenueYtd),
    safe(mrr),
    safe(onRetainerPct),
    safe(sprintDelivery),
    safe(openReceivables),
    safe(companyGoalsData),
  ]);

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
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

      {/* KPI grid — every tile is a Link to its destination */}
      <SectionTitle title="Key indicators" aside="Click any tile to drill in" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <HomeKpiCard
          href="/money?status=paid"
          label="YTD Revenue"
          value={"value" in revenue ? revenue.formatted : "—"}
          sub={
            "value" in revenue
              ? `${revenue.targetLabel ?? ""} · ${revenue.note ?? ""}`.replace(/^ · | · $/g, "")
              : "—"
          }
          title="Sum of paid invoice amount since Jan 1 — see /money for breakdown"
        />
        <HomeKpiCard
          href="/money?type=Recurring"
          label="MRR"
          value={"value" in mrrR ? mrrR.formatted : "—"}
          sub={"value" in mrrR ? mrrR.targetLabel : "—"}
          title="Recurring invoices paid this month — see /money filtered to Recurring"
        />
        <HomeKpiCard
          href="/money?status=open"
          label="Open AR"
          value={"total" in receivables ? fmtCurrency(receivables.total) : "—"}
          sub={
            "count" in receivables
              ? `${receivables.count} unpaid${receivables.overdue > 0 ? ` · ${receivables.overdue} past due` : ""}`
              : "—"
          }
          title="Invoices in open / sent / unsent / past due — see /money filtered to Open"
        />
        <HomeKpiCard
          href="/sprints"
          label="Sprint delivery"
          value={"value" in sprint ? sprint.formatted : "—"}
          sub={"value" in sprint ? sprint.note ?? undefined : undefined}
          title="Last 4 done sprints' avg story-completion rate"
        />
        <HomeKpiCard
          href="/clients"
          label="On retainer"
          value={"value" in retainer ? retainer.formatted : "—"}
          sub={"value" in retainer ? retainer.note ?? undefined : undefined}
          title="Distinct payers with active Recurring subscription / total Active companies"
        />
      </div>

      {/* Company goals — gamified progress bars */}
      {"ytdRevenue" in goals && (
        <CompanyGoals
          ytdRevenue={goals.ytdRevenue}
          retainerCount={goals.retainerCount}
          activeClients={goals.activeClients}
        />
      )}

      {/* Quick-jump cards — sourced from the same constant as Sidebar/MobileNav */}
      <SectionTitle title="Jump to" aside="Every page in the dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {NAV_ITEMS.filter((n) => n.showOnHome).map((card) => (
          <HomeJumpCard key={card.href} href={card.href} title={card.label} desc={card.desc ?? ""} />
        ))}
      </div>
    </main>
  );
}
