// DataTable — refined editorial table style. Hairline rules, generous row height,
// eyebrow column headers, Fraunces tabular numbers in right-aligned currency cells.

import { ReactNode } from "react";

export type Col<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: string; // CSS width (e.g. "48px", "20%", "200px")
  render: (row: T, i: number) => ReactNode;
};

type Props<T> = {
  rows: T[];
  cols: Col<T>[];
  empty?: ReactNode;
  caption?: ReactNode;
};

export function DataTable<T>({ rows, cols, empty, caption }: Props<T>) {
  return (
    <div className="bg-surface rounded-card shadow-card overflow-hidden">
      {rows.length === 0 ? (
        <div className="p-8 text-[13px] text-ink-muted">{empty ?? "No records."}</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={`eyebrow px-6 py-4 ${c.align === "right" ? "text-right" : "text-left"} border-b border-rule`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-rule-soft last:border-0 hover:bg-paper-soft/40 transition-colors"
              >
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={`px-6 py-4 text-[14px] ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {caption && rows.length > 0 && (
        <div className="px-6 py-3 border-t border-rule-soft bg-paper-soft/40 text-[11px] text-ink-muted">
          {caption}
        </div>
      )}
    </div>
  );
}
