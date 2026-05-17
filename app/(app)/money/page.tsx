// Money — full operational dashboard with drill-in.
// Server component: bulk-fetch all invoices ONCE, hand off to client for filter/sort/sheet.

import { listAllInvoices } from "@/lib/money";
import { PageHeader } from "@/components/ui/PageHeader";
import { MoneyDashboard } from "@/components/money/MoneyDashboard";

export default async function MoneyPage() {
  let invoices: Awaited<ReturnType<typeof listAllInvoices>> = [];
  let error: string | null = null;
  try {
    invoices = await listAllInvoices();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-5">
      <PageHeader
        title="Money"
        subtitle="All invoices · filter, sort, drill in. Click any row to see full detail."
        meta={
          <>
            <div className="font-mono tabnum">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="text-[11px] text-ink-faint mt-0.5">
              {invoices.length.toLocaleString()} invoices loaded · 5-min cache
            </div>
          </>
        }
      />

      {error ? (
        <div className="bg-signal-down/10 border border-signal-down/30 rounded-md p-4 text-[13px] text-signal-down">
          ⚠ Failed to load invoices: {error}
        </div>
      ) : (
        <MoneyDashboard invoices={invoices} />
      )}
    </main>
  );
}
