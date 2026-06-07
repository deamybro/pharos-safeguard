import { RiskLevel } from "@/src/shared/types";

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const colors: Record<RiskLevel, string> = {
    LOW: "border-[var(--risk-low)] bg-[var(--risk-low-bg)] text-[var(--risk-low)]",
    MEDIUM: "border-[var(--risk-medium)] bg-[var(--risk-medium-bg)] text-[var(--risk-medium)]",
    HIGH: "border-[var(--risk-high)] bg-[var(--risk-high-bg)] text-[var(--risk-high)] risk-pulse",
    CRITICAL: "border-[var(--risk-critical)] bg-[var(--risk-critical-bg)] text-[var(--risk-critical)] risk-pulse"
  };

  return <span className={`inline-flex border px-2.5 py-1 font-mono text-xs ${colors[level]}`}>{level}</span>;
}
