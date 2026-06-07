import { RiskLevel } from "./types";

export const RISK_RULES = [
  "UNLIMITED_APPROVAL",
  "UNVERIFIED_CONTRACT",
  "ZERO_ADDRESS",
  "ENTIRE_BALANCE",
  "HIGH_GAS",
  "DUPLICATE_RECIPIENTS",
  "INVALID_ADDRESS",
  "CONTRACT_WRITE",
  "FAILED_SIMULATION",
  "INSUFFICIENT_BALANCE",
  "HIGH_VALUE_TRANSFER",
  "SELF_TRANSFER",
  "SUSPICIOUS_BATCH_SIZE",
  "BATCH_INSUFFICIENT_FUNDS"
] as const;

export type RiskRuleCode = (typeof RISK_RULES)[number];

export const RISK_ORDER: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};
