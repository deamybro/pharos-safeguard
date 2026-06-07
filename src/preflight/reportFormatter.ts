import { ActionItem, BalanceResult, GasResult, PreFlightReport, RiskIssue, RiskLevel, SimulationReport, TransactionIntent } from "../shared/types";
import { maxRiskLevel, nowIso, shortenAddress } from "../shared/utils";

export function formatPreFlightReport(params: {
  intent: TransactionIntent;
  balance: BalanceResult;
  gas: GasResult;
  simulation: SimulationReport;
  issues: RiskIssue[];
  riskLevel?: RiskLevel;
}): PreFlightReport {
  const riskLevel = params.riskLevel || maxRiskLevel(params.issues.map((issue) => issue.severity));
  const safeToExecute = riskLevel === "LOW";
  const actions: ActionItem[] = safeToExecute
    ? [
        {
          id: "execute-reviewed-transaction",
          label: "Proceed with reviewed transaction",
          description: "The scan found only low-risk awareness items.",
          requires_confirmation: true
        }
      ]
    : [
        {
          id: "block-execution",
          label: "Block execution",
          description: "Stop this transaction and revise the input before trying again.",
          requires_confirmation: false
        }
      ];

  return {
    mode: "preflight",
    input_summary: summarize(params.intent),
    risk_level: riskLevel,
    issues: params.issues,
    gas_estimate: params.gas.gas_estimate,
    gas_sufficient: params.gas.gas_sufficient,
    balance_check: {
      native_balance: params.balance.native_balance,
      token_balance: params.balance.token_balance,
      sufficient: params.balance.sufficient,
      details: params.balance.details
    },
    simulation_result: params.simulation.result,
    simulation_details: params.simulation.details,
    safe_to_execute: safeToExecute,
    requires_confirmation: true,
    recommendation: recommendationFor(riskLevel, params.issues),
    human_explanation: explanationFor(riskLevel, params.issues),
    actions,
    timestamp: nowIso()
  };
}

function summarize(intent: TransactionIntent): string {
  if (intent.type === "approval") {
    return `Approve ${intent.tokenSymbol || "token"} for ${shortenAddress(intent.spender)}`;
  }

  if (intent.type === "batch_transfer") {
    return `Batch transfer to ${intent.recipients?.length || 0} recipients`;
  }

  if (intent.type === "transfer") {
    return `Transfer ${intent.amount || "unknown amount"} ${intent.tokenSymbol || "PHRS"} to ${shortenAddress(intent.to)}`;
  }

  return `${intent.type} on ${shortenAddress(intent.to)}`;
}

function recommendationFor(level: RiskLevel, issues: RiskIssue[]): string {
  if (!issues.length) {
    return "No material issues detected. Confirm recipient and amount before final execution.";
  }

  if (level === "CRITICAL" || level === "HIGH") {
    return "Do not execute as-is. Resolve the highest-severity issue and rerun PreFlight.";
  }

  if (level === "MEDIUM") {
    return "Proceed only after human confirmation and contract/address verification.";
  }

  return "Low-risk awareness items detected. Review them before proceeding.";
}

function explanationFor(level: RiskLevel, issues: RiskIssue[]): string {
  const titles = issues.slice(0, 3).map((issue) => issue.title).join(", ");
  return issues.length
    ? `SafeGuard rated this ${level} because it detected: ${titles}.`
    : "SafeGuard did not detect any configured risk rule triggers.";
}
