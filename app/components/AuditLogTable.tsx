"use client";

import { useState } from "react";
import { AuditEntry } from "@/src/shared/types";

export default function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  const [limit, setLimit] = useState(20);
  const visibleEntries = entries.slice(0, limit);

  return (
    <section className="border border-border bg-base p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs uppercase text-muted">Decision History</h3>
        <span className="font-mono text-xs text-muted">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No decisions recorded yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead className="font-mono text-muted">
              <tr className="border-b border-border">
                <th className="p-2 font-normal">Time</th>
                <th className="p-2 font-normal">Action</th>
                <th className="p-2 font-normal">Verdict</th>
                <th className="p-2 font-normal">Rule</th>
                <th className="p-2 font-normal">Value</th>
                <th className="p-2 font-normal">Instruction</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry) => (
                <tr key={entry.audit_id} className="border-b border-border text-muted last:border-b-0">
                  <td className="p-2 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                  <td className="max-w-48 truncate p-2 text-white">{entry.action_description}</td>
                  <td className="p-2">
                    <VerdictBadge verdict={entry.verdict} />
                  </td>
                  <td className="p-2 font-mono">{entry.deciding_rule}</td>
                  <td className="p-2 font-mono">${entry.tx_value_usd}</td>
                  <td className="max-w-64 truncate p-2">{entry.agent_instruction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length > limit && (
            <button className="mt-3 border border-border px-3 py-2 text-xs text-white" onClick={() => setLimit((value) => value + 20)}>
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function VerdictBadge({ verdict }: { verdict: AuditEntry["verdict"] }) {
  const classes = {
    APPROVED: "border-[var(--risk-low)] text-[var(--risk-low)]",
    REJECTED: "border-[var(--risk-high)] text-[var(--risk-high)]",
    CONFIRMATION_REQUIRED: "border-[var(--risk-medium)] text-[var(--risk-medium)]"
  };
  return <span className={`inline-flex border px-2 py-1 font-mono text-[10px] ${classes[verdict]}`}>{verdict}</span>;
}
