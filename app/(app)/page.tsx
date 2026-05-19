// Grand Central — the post-login landing. KPIs · 2026 Goals · Departures · Arrivals · The Stack · Jump to.
import { getAppSession } from "@/lib/session";
import { companyGoalsData, mrr, onRetainerPct, openReceivables, revenueYtd, sprintDelivery } from "@/lib/kpi";
import { getLandingBoards } from "@/lib/landing";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CompanyGoals } from "@/components/home/CompanyGoals";
import { HomeKpiCard } from "@/components/home/HomeKpiCard";
import { HomeJumpCard } from "@/components/home/HomeJumpCard";
import { StationBoard } from "@/components/home/DeparturesBoard";
import { TheStack } from "@/components/home/TheStack";
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

  const [revenue, mrrR, retainer, sprint, receivables, goals, boards] = await Promise.all([
    safe(revenueYtd),
    safe(mrr),
    safe(onRetainerPct),
    safe(sprintDelivery),
    safe(openReceivables),
    safe(companyGoalsData),
    safe(getLandingBoards),
  ]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
      {/* ── Greeting ─────────────────────────────────────────────── */}
      <header className="relative mb-10 pb-6 border-b border-rule">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-faint mb-2">
              ◆ Operations control plane
            </div>
            <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-semibold text-ink-strong leading-[1.05] tracking-tight">
              Welcome, <span className="text-emerald">{name}</span>.
            </h1>
            <p className="text-[13px] text-ink-muted mt-2 max-w-2xl">
              Everything Airvues needs to run today — KPIs, what's leaving the platform, what just arrived, and where the team lives.
            </p>
          </div>
          <div className="text-right text-[12px] text-ink-muted leading-snug shrink-0">
            <div className="font-mono tabnum uppercase tracking-wider">{dateStr}</div>
            <div className="text-[10px] text-ink-faint mt-0.5 font-mono uppercase tracking-wider">5-min cache</div>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(34, 211, 168, 0.5), transparent 50%)",
          }}
          aria-hidden="true"
        />
      </header>

      {/* ── KPIs ────────────────────────────────────────────────── */}
      <SectionTitle title="Key indicators" aside="Click any tile to drill in" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        <HomeKpiCard
          href="/money?status=paid"
          label="YTD Revenue"
          value={"value" in revenue ? revenue.formatted : "—"}
          numericValue={"value" in revenue ? revenue.value : null}
          format="currency"
          sub={
            "value" in revenue
              ? `${revenue.targetLabel ?? ""} · ${revenue.note ?? ""}`.replace(/^ · | · $/g, "")
              : "—"
          }
          title="Sum of paid invoice amount since Jan 1"
        />
        <HomeKpiCard
          href="/money?type=Recurring"
          label="MRR"
          value={"value" in mrrR ? mrrR.formatted : "—"}
          numericValue={"value" in mrrR ? mrrR.value : null}
          format="currency"
          sub={"value" in mrrR ? mrrR.targetLabel : "—"}
          title="Recurring invoices paid this month"
        />
        <HomeKpiCard
          href="/money?status=open"
          label="Open AR"
          value={"total" in receivables ? fmtCurrency(receivables.total) : "—"}
          numericValue={"total" in receivables ? receivables.total : null}
          format="currency"
          sub={
            "count" in receivables
              ? `${receivables.count} unpaid${receivables.overdue > 0 ? ` · ${receivables.overdue} past due` : ""}`
              : "—"
          }
          title="Invoices in open / sent / unsent / past due"
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
          title="Distinct payers with active Recurring subscription / Active companies"
        />
      </div>

      {/* ── 2026 Goals ───────────────────────────────────────────── */}
      {"ytdRevenue" in goals && (
        <CompanyGoals
          ytdRevenue={goals.ytdRevenue}
          retainerCount={goals.retainerCount}
          activeClients={goals.activeClients}
        />
      )}

      {/* ── Departures + Arrivals ────────────────────────────────── */}
      {"departures" in boards && (
        <div className="mb-10">
          <SectionTitle title="The board" aside="Live operational state" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <StationBoard
              title="Departures"
              subtitle="Stuck quotes · overdue invoices · sprints ending soon"
              items={boards.departures}
              tone="departure"
              emptyText="Nothing leaving — fully on schedule."
            />
            <StationBoard
              title="Arrivals"
              subtitle="Recent quotes · paid invoices · sprints closed · new stories"
              items={boards.arrivals}
              tone="arrival"
              emptyText="Quiet platform — no recent activity in the last 14 days."
            />
          </div>
        </div>
      )}

      {/* ── The Stack ───────────────────────────────────────────── */}
      <div className="mb-10">
        <SectionTitle title="The stack" aside="External tools the team lives in" />
        <TheStack />
      </div>

      {/* ── Jump to ─────────────────────────────────────────────── */}
      <div>
        <SectionTitle title="Jump to" aside="Every page in this dashboard" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {NAV_ITEMS.filter((n) => n.showOnHome).map((card) => (
            <HomeJumpCard key={card.href} href={card.href} title={card.label} desc={card.desc ?? ""} />
          ))}
        </div>
      </div>
    </main>
  );
}
