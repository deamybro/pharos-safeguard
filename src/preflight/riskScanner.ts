import { RISK_THRESHOLDS } from "../config";
import { BalanceResult, GasResult, RiskIssue, SimulationReport, TransactionIntent } from "../shared/types";
import { isValidAddress, isZeroAddress, maxRiskLevel, normalizeAddress, parseHumanAmount } from "../shared/utils";

interface ScanContext {
  intent: TransactionIntent;
  balance: BalanceResult;
  gas: GasResult;
  simulation: SimulationReport;
  spenderVerified?: boolean;
}

type Rule = (context: ScanContext) => RiskIssue | null;

export function scanRisk(context: ScanContext): { issues: RiskIssue[]; riskLevel: ReturnType<typeof maxRiskLevel> } {
  const issues = rules.map((rule) => rule(context)).filter((issue): issue is RiskIssue => Boolean(issue));
  const criticalPair =
    issues.some((issue) => issue.code === "FAILED_SIMULATION") &&
    issues.some((issue) => issue.code === "INSUFFICIENT_BALANCE");
  const unlimitedUnverified =
    issues.some((issue) => issue.code === "UNLIMITED_APPROVAL") &&
    issues.some((issue) => issue.code === "UNVERIFIED_CONTRACT");

  if (criticalPair) {
    issues.push(issue("CRITICAL", "SIMULATION_AND_BALANCE_FAILURE", "Simulation and balance failure", "The dry run failed and the wallet cannot cover the requested amount.", "Do not execute until both failures are resolved."));
  }

  if (unlimitedUnverified) {
    issues.push(issue("CRITICAL", "UNLIMITED_APPROVAL_UNVERIFIED", "Unlimited approval to unverified contract", "The spender receives unlimited token access and cannot be verified.", "Use a limited approval only after independently verifying the spender."));
  }

  return {
    issues,
    riskLevel: maxRiskLevel(issues.map((item) => item.severity))
  };
}

const rules: Rule[] = [
  unlimitedApproval,
  unverifiedContract,
  zeroAddress,
  entireBalance,
  highGas,
  duplicateRecipients,
  invalidAddress,
  contractWrite,
  failedSimulation,
  insufficientBalance,
  highValueTransfer,
  selfTransfer,
  suspiciousBatchSize,
  batchInsufficientFunds
];

function unlimitedApproval({ intent }: ScanContext): RiskIssue | null {
  if (!intent.isUnlimitedApproval && BigInt(intent.approvalAmount || "0") !== RISK_THRESHOLDS.unlimitedApproval) {
    return null;
  }

  return issue("HIGH", "UNLIMITED_APPROVAL", "Unlimited approval", "This approval can allow the spender to drain the full token balance.", "Prefer a limited approval sized to the exact action.");
}

function unverifiedContract({ intent, spenderVerified }: ScanContext): RiskIssue | null {
  const target = intent.spender || intent.to;
  if (
    !target ||
    spenderVerified !== false ||
    !isValidAddress(target) ||
    !["approval", "contract_write", "deploy"].includes(intent.type)
  ) {
    return null;
  }

  return issue("MEDIUM", "UNVERIFIED_CONTRACT", "Unverified contract", "The target contract could not be verified through available metadata.", "Verify the contract source and ownership before proceeding.");
}

function zeroAddress({ intent }: ScanContext): RiskIssue | null {
  if (!isZeroAddress(intent.to) && !isZeroAddress(intent.spender)) {
    return null;
  }

  return issue("HIGH", "ZERO_ADDRESS", "Zero address target", "Funds or approvals are pointed at the zero address.", "Correct the address before execution.");
}

function entireBalance({ intent, balance }: ScanContext): RiskIssue | null {
  const required = intent.tokenAddress ? balance.requiredTokenBaseUnits : balance.requiredNativeWei;
  const available = intent.tokenAddress ? balance.tokenBalanceBaseUnits : balance.nativeBalanceWei;
  if (!required || !available || required !== available) {
    return null;
  }

  return issue("HIGH", "ENTIRE_BALANCE", "Entire balance transfer", "The transaction spends exactly all available balance.", "Leave dust for fees and reduce the transfer amount.");
}

function highGas({ gas }: ScanContext): RiskIssue | null {
  if (!gas.highGas) {
    return null;
  }

  return issue("LOW", "HIGH_GAS", "High gas estimate", gas.details, "Review calldata and contract path before submitting.");
}

function duplicateRecipients({ intent }: ScanContext): RiskIssue | null {
  const recipients = intent.recipients || [];
  const normalized = recipients.map((recipient) => recipient.address.toLowerCase());
  if (normalized.length === new Set(normalized).size) {
    return null;
  }

  return issue("LOW", "DUPLICATE_RECIPIENTS", "Duplicate recipients", "The batch includes duplicate recipient addresses.", "Deduplicate the batch list and recalculate totals.");
}

function invalidAddress({ intent }: ScanContext): RiskIssue | null {
  const addresses = [intent.to, intent.spender, ...(intent.recipients || []).map((recipient) => recipient.address)].filter(Boolean);
  if (addresses.every((address) => isValidAddress(address))) {
    return null;
  }

  return issue("HIGH", "INVALID_ADDRESS", "Invalid address", "At least one address is malformed.", "Fix invalid addresses before making any onchain call.");
}

function contractWrite({ intent }: ScanContext): RiskIssue | null {
  if (!intent.isStateChanging && intent.type !== "contract_write") {
    return null;
  }

  return issue("LOW", "CONTRACT_WRITE", "State-changing contract call", "This action can modify contract or wallet state.", "Confirm the method, calldata, and target contract.");
}

function failedSimulation({ simulation }: ScanContext): RiskIssue | null {
  if (simulation.result !== "LIKELY_FAIL") {
    return null;
  }

  return issue("HIGH", "FAILED_SIMULATION", "Failed simulation", simulation.details, "Do not execute until the revert reason is understood.");
}

function insufficientBalance({ balance }: ScanContext): RiskIssue | null {
  if (balance.sufficient) {
    return null;
  }

  return issue("HIGH", "INSUFFICIENT_BALANCE", "Insufficient balance", balance.details, "Fund the wallet or reduce the requested amount.");
}

function highValueTransfer({ intent }: ScanContext): RiskIssue | null {
  const amount = Number((intent.amount || "0").replace(/,/g, ""));
  const isDollarStable = ["USDC", "USDT", "DAI"].includes(intent.tokenSymbol || "");
  if (!isDollarStable || amount <= RISK_THRESHOLDS.highValueTransferUSD) {
    return null;
  }

  return issue("MEDIUM", "HIGH_VALUE_TRANSFER", "High value transfer", "The stablecoin transfer appears to exceed 10000 USD.", "Use a second-party review or split execution if operationally required.");
}

function selfTransfer({ intent }: ScanContext): RiskIssue | null {
  if (!intent.from || !intent.to || !isValidAddress(intent.from) || !isValidAddress(intent.to)) {
    return null;
  }

  if (normalizeAddress(intent.from) !== normalizeAddress(intent.to)) {
    return null;
  }

  return issue("LOW", "SELF_TRANSFER", "Self transfer", "The sender and recipient are the same wallet.", "Check whether this transfer is accidental.");
}

function suspiciousBatchSize({ intent }: ScanContext): RiskIssue | null {
  const count = intent.recipients?.length || 0;
  if (count <= RISK_THRESHOLDS.maxBatchSize) {
    return null;
  }

  return issue("MEDIUM", "SUSPICIOUS_BATCH_SIZE", "Large batch size", "The batch exceeds the configured recipient limit.", "Split the batch and validate each segment.");
}

function batchInsufficientFunds({ intent, balance }: ScanContext): RiskIssue | null {
  if (intent.type !== "batch_transfer" || !intent.recipients?.length || !balance.nativeBalanceWei) {
    return null;
  }

  const total = intent.recipients.reduce((sum, recipient) => sum + (parseHumanAmount(recipient.amount) || 0n), 0n);
  if (total <= balance.nativeBalanceWei) {
    return null;
  }

  return issue("MEDIUM", "BATCH_INSUFFICIENT_FUNDS", "Batch exceeds wallet balance", "The batch total appears greater than the available wallet balance.", "Reduce the batch or fund the wallet before submitting.");
}

function issue(severity: RiskIssue["severity"], code: string, title: string, description: string, recommendation: string): RiskIssue {
  return { severity, code, title, description, recommendation };
}
