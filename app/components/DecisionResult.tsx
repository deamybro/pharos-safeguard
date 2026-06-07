"use client";

import { useState } from "react";
import { Check, ShieldAlert, X } from "lucide-react";
import { SentinelDecision } from "@/src/shared/types";

export default function DecisionResult({ decision }: { decision: SentinelDecision }) {
  const [humanDecision, setHumanDecision] = useState<"approved" | "rejected" | null>(null);
  const styles = {
    green: "border-[var(--risk-low)] bg-[var(--risk-low-bg)] shadow-[0_0_24px_rgba(34,197,94,0.15)]",
    red: "border-[var(--risk-high)] bg-[var(--risk-high-bg)] shadow-[0_0_24px_rgba(239,68,68,0.15)]",
    amber: "border-[var(--risk-medium)] bg-[var(--risk-medium-bg)] shadow-[0_0_24px_rgba(245,158,11,0.15)]"
  };
  const verdictText =
    decision.verdict === "APPROVED"
      ? "APPROVED"
      : decision.verdict === "REJECTED"
        ? "REJECTED"
        : "CONFIRMATION REQUIRED";

  return (
    <section className={`animate-[verdict-in_200ms_ease-out] border p-4 ${styles[decision.verdict_color]}`}>
      <div className="flex items-center gap-3">
        {decision.verdict === "APPROVED" ? (
          <Check className="h-6 w-6 text-[var(--risk-low)]" aria-hidden />
        ) : decision.verdict === "REJECTED" ? (
          <X className="h-6 w-6 text-[var(--risk-high)]" aria-hidden />
        ) : (
          <ShieldAlert className="h-6 w-6 text-[var(--risk-medium)]" aria-hidden />
        )}
        <h3 className="font-mono text-lg text-white">{verdictText}</h3>
      </div>
      <p className="mt-4 font-mono text-xs text-muted">{decision.deciding_rule.rule_id}</p>
      <p className="mt-3 text-sm text-white">{decision.user_summary}</p>
      <pre className="mt-4 overflow-x-auto border border-border bg-base p-3 whitespace-pre-wrap font-mono text-xs text-muted">
        {decision.agent_instruction}
      </pre>
      {decision.verdict === "CONFIRMATION_REQUIRED" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 border border-[var(--risk-low)] px-3 py-2 text-sm text-white"
            onClick={() => setHumanDecision("approved")}
          >
            <Check className="h-4 w-4" aria-hidden />
            Approve
          </button>
          <button
            className="inline-flex items-center gap-2 border border-[var(--risk-high)] px-3 py-2 text-sm text-white"
            onClick={() => setHumanDecision("rejected")}
          >
            <X className="h-4 w-4" aria-hidden />
            Reject
          </button>
          {humanDecision && <span className="font-mono text-xs uppercase text-muted">Human decision: {humanDecision}</span>}
        </div>
      )}
    </section>
  );
}
