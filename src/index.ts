import { checkBalance } from "./preflight/balanceChecker";
import { estimateGas } from "./preflight/gasChecker";
import { parseIntent } from "./preflight/intentParser";
import { formatPreFlightReport } from "./preflight/reportFormatter";
import { scanRisk } from "./preflight/riskScanner";
import { simulate } from "./preflight/simulator";
import { Constitution, SkillInput, TransactionIntent, WalletScanReport } from "./shared/types";
import { isValidAddress, nowIso } from "./shared/utils";
import { getProvider } from "./shared/provider";
import { safePromise } from "./shared/utils";
import { PHAROS_CONFIG } from "./config";
import { aggregateAssets } from "./walletscan/assetAggregator";
import { scanApprovals } from "./walletscan/approvalScanner";
import { scoreWallet } from "./walletscan/riskScorer";
import { analyzeTxHistory } from "./walletscan/txHistoryAnalyzer";

interface SentinelSkillInput extends SkillInput {
  mode?: "preflight" | "walletscan" | "sentinel";
  estimatedUsdValue?: number;
  constitutionPreset?: "conservative" | "standard" | "developer";
  customConstitution?: Constitution;
}

export async function runSafeGuard(input: SentinelSkillInput): Promise<string> {
  const mode = input.mode || routeMode(input.prompt);

  if (mode === "walletscan") {
    if (!input.walletAddress || !isValidAddress(input.walletAddress)) {
      return JSON.stringify({ error: "WalletScan requires a valid walletAddress." }, null, 2);
    }

    const report = await runWalletScan(input.walletAddress);
    console.log(renderWalletScan(report));
    return JSON.stringify(report, null, 2);
  }

  if (mode === "preflight") {
    const report = await runPreFlight(input);
    console.log(report.human_explanation);
    return JSON.stringify(report, null, 2);
  }

  if (mode === "sentinel") {
    const { evaluate } = await import("./sentinel/decisionEngine");
    const { getConstitution } = await import("./sentinel/constitution");
    const intent = parseSentinelIntent(input.prompt, input.walletAddress);
    const constitution = getConstitution(input.walletAddress || "", input.constitutionPreset, input.customConstitution);
    const decision = await evaluate({
      agent_action: {
        description: input.prompt,
        intent,
        estimated_usd_value: input.estimatedUsdValue
      },
      wallet: input.walletAddress || "",
      constitution
    });
    return JSON.stringify(decision, null, 2);
  }

  return JSON.stringify(
    {
      message: "Choose a mode: PreFlight checks a transaction, WalletScan audits a wallet, and Sentinel evaluates agent guardrails.",
      modes: ["preflight", "walletscan", "sentinel"]
    },
    null,
    2
  );
}

export async function runPreFlight(input: SkillInput) {
  const intent = parseIntent(input.prompt, input.walletAddress, input.txData);
  const [balance, gas, simulation] = await Promise.all([checkBalance(intent, input.walletAddress), estimateGas(intent), simulate(intent)]);
  const { issues, riskLevel } = scanRisk({
    intent,
    balance,
    gas,
    simulation,
    spenderVerified: false
  });

  return formatPreFlightReport({ intent, balance, gas, simulation, issues, riskLevel });
}

export async function runWalletScan(walletAddress: string): Promise<WalletScanReport> {
  const [latestBlock, portfolio, approvals, txAnomalies] = await Promise.all([
    safePromise(getProvider().getBlockNumber()),
    aggregateAssets(walletAddress),
    scanApprovals(walletAddress),
    analyzeTxHistory(walletAddress)
  ]);
  const risk = scoreWallet(approvals, txAnomalies);
  const liveDataAvailable = latestBlock !== undefined && portfolio.native_balance !== "unknown";
  const dataWarnings = liveDataAvailable
    ? []
    : ["Live Pharos RPC evidence is unavailable. Balances, approvals, and anomalies could not be verified."];
  const dangerousApprovals = approvals.filter((approval) => ["MEDIUM", "HIGH", "CRITICAL"].includes(approval.risk_level));

  return {
    mode: "walletscan",
    wallet_address: walletAddress,
    data_status: liveDataAvailable ? "LIVE" : "UNAVAILABLE",
    data_warnings: dataWarnings,
    scan_coverage: {
      latest_block: latestBlock,
      token_and_approval_window_blocks: PHAROS_CONFIG.approvalScanBlockWindow,
      transaction_history_window_blocks: PHAROS_CONFIG.maxRecentTx
    },
    risk_score: liveDataAvailable ? risk.score : Math.max(60, risk.score),
    risk_level: liveDataAvailable ? risk.level : "HIGH",
    portfolio_summary: {
      native_balance: portfolio.native_balance,
      tokens: portfolio.tokens
    },
    approvals,
    dangerous_approvals: dangerousApprovals,
    tx_anomalies: txAnomalies,
    recommendations: liveDataAvailable
      ? recommendations(dangerousApprovals.length, txAnomalies.length)
      : ["Do not treat this wallet as safe until live Pharos RPC evidence is available.", ...recommendations(dangerousApprovals.length, txAnomalies.length)],
    actions: dangerousApprovals.map((approval, index) => ({
      id: `revoke-${index + 1}`,
      label: `Revoke ${approval.token_symbol} approval`,
      description: `Set allowance for ${approval.spender_address} to zero.`,
      tx_data: approval.revoke_tx,
      requires_confirmation: true
    })),
    timestamp: nowIso()
  };
}

function routeMode(prompt: string): "preflight" | "walletscan" | "sentinel" | "ambiguous" {
  const lower = prompt.toLowerCase();
  const sentinelTriggers = [
    "sentinel:",
    "sentinel mode",
    "sentinel check",
    "can my agent",
    "constitutional check:",
    "constitution",
    "policy wallet",
    "guardrail:",
    "does this violate",
    "agent wants to"
  ];
  if (sentinelTriggers.some((trigger) => lower.includes(trigger))) {
    return "sentinel";
  }

  if (/(preflight|before|approve|send|transfer|simulate|transaction|batch|airdrop|contract)/.test(lower)) {
    return "preflight";
  }

  if (/(scan|wallet|audit|approvals|portfolio|revoke|safe\?)/.test(lower)) {
    return "walletscan";
  }

  return "ambiguous";
}

function parseSentinelIntent(prompt: string, walletAddress?: string): TransactionIntent {
  const intent = parseIntent(prompt, walletAddress);
  const lower = prompt.toLowerCase();
  if (lower.includes("deploy")) {
    return { ...intent, type: "deploy", isStateChanging: true };
  }

  return intent;
}

function recommendations(dangerousApprovalCount: number, anomalyCount: number): string[] {
  const output = [
    `Review token allowances before interacting with new protocols. This scan discovers token and approval events from the latest ${PHAROS_CONFIG.approvalScanBlockWindow.toLocaleString()} blocks.`
  ];
  if (dangerousApprovalCount > 0) {
    output.push("Revoke dangerous approvals or replace unlimited allowances with scoped approvals.");
  }

  if (anomalyCount > 0) {
    output.push("Investigate recent failed transactions for incorrect calldata or malicious targets.");
  }

  return output;
}

function renderWalletScan(report: WalletScanReport): string {
  return `WalletScan ${report.wallet_address}: ${report.risk_level} (${report.risk_score}/100), ${report.dangerous_approvals.length} dangerous approvals.`;
}
