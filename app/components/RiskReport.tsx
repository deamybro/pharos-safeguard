import { PreFlightReport } from "@/src/shared/types";
import RiskBadge from "./RiskBadge";

export default function RiskReport({ report }: { report: PreFlightReport }) {
  return (
    <div className="space-y-4">
      <div className="border border-border bg-base p-4">
        <p className="font-mono text-xs uppercase text-muted">Risk Level</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <RiskBadge level={report.risk_level} />
          <span className="text-sm text-white">{report.input_summary}</span>
        </div>
      </div>

      <div className="border border-border bg-base p-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase text-muted">Issues Detected</p>
          <span className="font-mono text-xs text-muted">{report.issues.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {report.issues.length === 0 ? (
            <p className="text-sm text-muted">No configured risk rules fired.</p>
          ) : (
            report.issues.map((issue) => (
              <div key={issue.code} className="border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm text-white">{issue.code}</span>
                  <RiskBadge level={issue.severity} />
                </div>
                <p className="mt-2 text-sm text-muted">{issue.description}</p>
                <p className="mt-2 text-sm text-white">{issue.recommendation}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Gas" value={report.gas_estimate} />
        <Stat label="Balance" value={report.balance_check.details} />
        <Stat label="Simulation" value={report.simulation_result} />
      </div>

      <div className="border border-[var(--border-active)] bg-elevated p-4">
        <p className="font-mono text-xs uppercase text-muted">Recommendation</p>
        <p className="mt-3 text-sm text-white">{report.recommendation}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 border border-border bg-base p-3">
      <p className="font-mono text-xs uppercase text-muted">{label}</p>
      <p className="mt-3 break-words text-sm text-white">{value}</p>
    </div>
  );
}
