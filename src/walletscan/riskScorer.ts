import { RiskLevel, TxAnomaly, WalletApproval } from "../shared/types";
import { maxRiskLevel } from "../shared/utils";

export function scoreWallet(approvals: WalletApproval[], anomalies: TxAnomaly[]): { score: number; level: RiskLevel } {
  const approvalScore = approvals.reduce((sum, approval) => sum + points(approval.risk_level), 0);
  const anomalyScore = anomalies.reduce((sum, anomaly) => sum + Math.ceil(points(anomaly.severity) / 2), 0);
  const score = Math.min(100, approvalScore + anomalyScore);
  const level = scoreToLevel(score, maxRiskLevel([...approvals.map((item) => item.risk_level), ...anomalies.map((item) => item.severity)]));

  return { score, level };
}

function points(level: RiskLevel): number {
  return { LOW: 5, MEDIUM: 15, HIGH: 30, CRITICAL: 45 }[level];
}

function scoreToLevel(score: number, maxDetected: RiskLevel): RiskLevel {
  if (maxDetected === "CRITICAL" || score >= 85) {
    return "CRITICAL";
  }

  if (maxDetected === "HIGH" || score >= 60) {
    return "HIGH";
  }

  if (maxDetected === "MEDIUM" || score >= 30) {
    return "MEDIUM";
  }

  return "LOW";
}
