// KPI calculators. Each returns a uniform shape for the home-page tiles.
// Reads are cached for 5 minutes via lib/airtable.ts unstable_cache wrapper.
import "server-only";

import { listRecordsCached } from "./airtable";
import { Tables } from "./schema";

export type KpiResult = {
  value: number | null;
  formatted: string;
  delta: number | null;
  deltaLabel?: string;
  target?: number;
  targetLabel?: string;
  asOf: Date;
  note?: string;
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtPercent = (n: number, decimals = 0) =>
  `${(n * 100).toFixed(decimals)}%`;

/** YTD revenue: SUM(Invoice Amount) WHERE Status='paid' AND Date >= YEAR_START */
export async function revenueYtd(): Promise<KpiResult> {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const t = Tables.Invoices;
  const records = await listRecordsCached<{ "Invoice Amount"?: number; "Invoice Status"?: string; Date?: string }>(
    t.id,
    {
      filterByFormula: `AND({Invoice Status} = 'paid', IS_AFTER({Date}, '${yearStart}'))`,
      fields: [t.fields["Invoice Amount"].id, t.fields["Invoice Status"].id, t.fields["Date"].id],
      returnFieldsByFieldId: false,
    },
    ["kpi:revenue"],
  );
  const total = records.reduce((sum, r) => sum + (r.fields["Invoice Amount"] || 0), 0);
  const target = 500_000;
  return {
    value: total,
    formatted: fmtCurrency(total),
    delta: null,
    target,
    targetLabel: `${Math.round((total / target) * 100)}% of ${fmtCurrency(target)}`,
    asOf: new Date(),
  };
}

/** MRR: SUM(Invoice Amount) WHERE Type='Recurring' AND Status='paid' AND Date in current month */
export async function mrr(): Promise<KpiResult> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const t = Tables.Invoices;
  const records = await listRecordsCached<{ "Invoice Amount"?: number; "Invoice Type"?: string; "Invoice Status"?: string; Date?: string }>(
    t.id,
    {
      filterByFormula: `AND({Invoice Type} = 'Recurring', {Invoice Status} = 'paid', IS_AFTER({Date}, '${monthStart}'), IS_BEFORE({Date}, '${monthEnd}'))`,
      fields: [t.fields["Invoice Amount"].id, t.fields["Invoice Type"].id, t.fields["Invoice Status"].id, t.fields["Date"].id],
    },
    ["kpi:mrr"],
  );
  const total = records.reduce((sum, r) => sum + (r.fields["Invoice Amount"] || 0), 0);
  const target = 41_700;
  return {
    value: total,
    formatted: fmtCurrency(total),
    delta: null,
    target,
    targetLabel: `Target ${fmtCurrency(target)} · ${Math.round((total / target) * 100)}%`,
    asOf: new Date(),
  };
}

/** On retainer %: COUNT(Membership AND Active) / COUNT(Active) over Companies */
export async function onRetainerPct(): Promise<KpiResult> {
  const t = Tables.Companies;
  const all = await listRecordsCached<{ "Engagement Frequency"?: string; "Contract Type"?: string }>(
    t.id,
    {
      fields: [t.fields["Engagement Frequency"].id, t.fields["Contract Type"].id],
    },
    ["kpi:retainer"],
  );
  const active = all.filter((r) => r.fields["Engagement Frequency"] === "Active");
  const onRetainer = active.filter((r) => r.fields["Contract Type"] === "Membership");
  const ratio = active.length === 0 ? 0 : onRetainer.length / active.length;
  const target = 0.5;
  return {
    value: ratio,
    formatted: fmtPercent(ratio),
    delta: null,
    target,
    targetLabel: `Target ${fmtPercent(target)}`,
    asOf: new Date(),
    note: `${onRetainer.length} of ${active.length} active clients on retainer`,
  };
}

/** Sprint delivery: AVG over last 4 done sprints of (completed stories / total stories in sprint) */
export async function sprintDelivery(): Promise<KpiResult> {
  const sprintsT = Tables.Sprints;
  const storiesT = Tables.Stories;

  const doneSprints = await listRecordsCached<{ "Sprint Status"?: string; "Sprint Number"?: number; Stories?: string[] }>(
    sprintsT.id,
    {
      filterByFormula: `{Sprint Status} = 'Done'`,
      fields: [sprintsT.fields["Sprint Status"].id, sprintsT.fields["Sprint Number"].id, sprintsT.fields["Stories"].id],
      sort: [{ field: "Sprint Number", direction: "desc" }],
      maxRecords: 4,
    },
    ["kpi:sprint-delivery"],
  );

  if (doneSprints.length === 0) {
    return {
      value: null,
      formatted: "—",
      delta: null,
      asOf: new Date(),
      note: "No completed sprints yet",
    };
  }

  // For each sprint, fetch its linked stories & status
  const ratios: number[] = [];
  for (const sp of doneSprints) {
    const storyIds = sp.fields.Stories || [];
    if (storyIds.length === 0) {
      ratios.push(0);
      continue;
    }
    const filter = `OR(${storyIds.map((id) => `RECORD_ID() = '${id}'`).join(",")})`;
    const stories = await listRecordsCached<{ "Story Status"?: string }>(
      storiesT.id,
      {
        filterByFormula: filter,
        fields: [storiesT.fields["Story Status"].id],
      },
      ["kpi:sprint-delivery"],
    );
    const done = stories.filter((s) => s.fields["Story Status"] === "Completed").length;
    ratios.push(stories.length === 0 ? 0 : done / stories.length);
  }

  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const target = 0.9;
  return {
    value: avg,
    formatted: fmtPercent(avg),
    delta: null,
    target,
    targetLabel: `Target ${fmtPercent(target)}`,
    asOf: new Date(),
    note: `Last ${ratios.length} done sprints`,
  };
}

/** Open receivables — sum of outstanding invoices */
export async function openReceivables(): Promise<{ total: number; count: number; overdue: number }> {
  const t = Tables.Invoices;
  const records = await listRecordsCached<{ "Invoice Amount"?: number; "Invoice Status"?: string; Date?: string }>(
    t.id,
    {
      filterByFormula: `OR({Invoice Status} = 'open', {Invoice Status} = 'sent', {Invoice Status} = 'past due', {Invoice Status} = 'unsent')`,
      fields: [t.fields["Invoice Amount"].id, t.fields["Invoice Status"].id, t.fields["Date"].id],
    },
    ["kpi:receivables"],
  );
  const total = records.reduce((sum, r) => sum + (r.fields["Invoice Amount"] || 0), 0);
  const overdue = records.filter((r) => r.fields["Invoice Status"] === "past due").length;
  return { total, count: records.length, overdue };
}

// ============================================================================
// Money page — additional reads
// ============================================================================

export type ArAgingBuckets = {
  buckets: { label: string; count: number; total: number }[];
  grandTotal: number;
  grandCount: number;
};

/** AR Aging — outstanding invoices bucketed by days since Invoice Status Last Modified. */
export async function arAging(): Promise<ArAgingBuckets> {
  const t = Tables.Invoices;
  const records = await listRecordsCached<{
    "Invoice Amount"?: number;
    "Invoice Status"?: string;
    "Invoice Status Last Modified"?: string;
  }>(
    t.id,
    {
      filterByFormula: `OR({Invoice Status} = 'open', {Invoice Status} = 'sent', {Invoice Status} = 'past due', {Invoice Status} = 'unsent')`,
      fields: [
        t.fields["Invoice Amount"].id,
        t.fields["Invoice Status"].id,
        t.fields["Invoice Status Last Modified"].id,
      ],
    },
    ["kpi:ar-aging"],
  );
  const now = Date.now();
  const ranges: { label: string; min: number; max: number }[] = [
    { label: "0–30 days", min: 0, max: 30 },
    { label: "30–60 days", min: 30, max: 60 },
    { label: "60–90 days", min: 60, max: 90 },
    { label: "90+ days", min: 90, max: Infinity },
  ];
  const buckets = ranges.map((r) => ({ label: r.label, count: 0, total: 0 }));
  let grandTotal = 0;
  let grandCount = 0;
  for (const rec of records) {
    const amt = rec.fields["Invoice Amount"] || 0;
    const lm = rec.fields["Invoice Status Last Modified"];
    if (!lm) continue;
    const days = Math.floor((now - new Date(lm).getTime()) / 86_400_000);
    const idx = ranges.findIndex((r) => days >= r.min && days < r.max);
    if (idx === -1) continue;
    buckets[idx].count += 1;
    buckets[idx].total += amt;
    grandTotal += amt;
    grandCount += 1;
  }
  return { buckets, grandTotal, grandCount };
}

export type TopClient = { name: string; email: string; total: number; count: number };

/** Top revenue clients — sum of paid invoices grouped by Invoice Payer email. */
export async function topRevenueClients(limit = 10): Promise<TopClient[]> {
  const t = Tables.Invoices;
  const records = await listRecordsCached<{
    "Invoice Amount"?: number;
    "Invoice Status"?: string;
  }>(
    t.id,
    {
      filterByFormula: `{Invoice Status} = 'paid'`,
      fields: [
        t.fields["Invoice Amount"].id,
        t.fields["Invoice Status"].id,
        t.fields["Invoice Payer"].id,
        t.fields["Stripe Customer ID (from Invoice Payer)"].id,
        t.fields["Invoice Identifier"].id,
      ],
    },
    ["kpi:top-clients"],
  );
  // Group by Invoice Identifier (formula `${id}-${PayerName} | ${amount}`) — extract payer name
  const byPayer = new Map<string, TopClient>();
  for (const rec of records) {
    const f = rec.fields as Record<string, unknown>;
    const identifier = (f["Invoice Identifier"] as string | undefined) ?? "";
    // Identifier format: `{InvoiceID}-{Payer Name} | ${Amount}`
    const match = identifier.match(/^\d+-([^|]+?)\s*\|/);
    const name = (match ? match[1].trim() : "(unknown)") || "(unknown)";
    const amt = (f["Invoice Amount"] as number | undefined) || 0;
    const existing = byPayer.get(name);
    if (existing) {
      existing.total += amt;
      existing.count += 1;
    } else {
      byPayer.set(name, { name, email: "", total: amt, count: 1 });
    }
  }
  return Array.from(byPayer.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export type RecurringPayer = {
  id: string;
  payer: string;
  amount: number;
  status: string;
  date: string | null;
};

/** Active recurring contracts — the actual MRR breakdown by payer. */
export async function mrrBreakdown(): Promise<RecurringPayer[]> {
  const t = Tables.Invoices;
  const records = await listRecordsCached<{
    "Invoice Amount"?: number;
    "Invoice Status"?: string;
    "Invoice Identifier"?: string;
    "Date"?: string;
  }>(
    t.id,
    {
      filterByFormula: `AND({Invoice Type} = 'Recurring', OR({Invoice Status} = 'subscribed', {Invoice Status} = 'send subscription link', {Invoice Status} = 'paid'))`,
      fields: [
        t.fields["Invoice Amount"].id,
        t.fields["Invoice Status"].id,
        t.fields["Invoice Identifier"].id,
        t.fields["Date"].id,
        t.fields["Invoice Type"].id,
      ],
    },
    ["kpi:mrr-breakdown"],
  );
  return records
    .map((r) => {
      const identifier = (r.fields["Invoice Identifier"] as string | undefined) ?? "";
      const match = identifier.match(/^\d+-([^|]+?)\s*\|/);
      return {
        id: r.id,
        payer: (match ? match[1].trim() : "(unknown)") || "(unknown)",
        amount: (r.fields["Invoice Amount"] as number | undefined) || 0,
        status: (r.fields["Invoice Status"] as string | undefined) || "",
        date: (r.fields["Date"] as string | undefined) || null,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Average paid invoice size (lifetime). */
export async function avgInvoice(): Promise<KpiResult> {
  const t = Tables.Invoices;
  const records = await listRecordsCached<{ "Invoice Amount"?: number }>(
    t.id,
    {
      filterByFormula: `{Invoice Status} = 'paid'`,
      fields: [t.fields["Invoice Amount"].id, t.fields["Invoice Status"].id],
    },
    ["kpi:avg-invoice"],
  );
  if (records.length === 0) {
    return { value: null, formatted: "—", delta: null, asOf: new Date() };
  }
  const sum = records.reduce((s, r) => s + (r.fields["Invoice Amount"] || 0), 0);
  const avg = sum / records.length;
  return {
    value: avg,
    formatted: fmtCurrency(avg),
    delta: null,
    asOf: new Date(),
    note: `Across ${records.length.toLocaleString()} paid invoices`,
  };
}
