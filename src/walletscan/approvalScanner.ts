import { ethers } from "ethers";
import { PHAROS_CONFIG, RISK_THRESHOLDS } from "../config";
import { getProvider } from "../shared/provider";
import { RiskLevel, WalletApproval } from "../shared/types";
import { getLogsChunked, isValidAddress, safePromise, unique } from "../shared/utils";
import { discoverHeldTokenAddresses } from "./assetAggregator";
import { buildRevokeTx } from "./revoker";

const ERC20_ABI = [
  "function allowance(address owner,address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
] as const;

const APPROVAL_TOPIC = ethers.id("Approval(address,address,uint256)");

export async function scanApprovals(walletAddress: string): Promise<WalletApproval[]> {
  if (!isValidAddress(walletAddress)) {
    return [];
  }

  const tokenAddresses = unique([
    ...(await discoverHeldTokenAddresses(walletAddress)),
    ...(await discoverApprovalTokenAddresses(walletAddress))
  ]);
  const approvals = await Promise.all(tokenAddresses.map((token) => scanTokenApprovals(token, walletAddress)));
  return approvals.flat().sort((a, b) => severityRank(b.risk_level) - severityRank(a.risk_level));
}

async function discoverApprovalTokenAddresses(walletAddress: string): Promise<string[]> {
  const provider = getProvider();
  const latest = await safePromise(provider.getBlockNumber());
  if (!latest) {
    return [];
  }

  const fromBlock = Math.max(0, latest - PHAROS_CONFIG.approvalScanBlockWindow);
  const paddedOwner = ethers.zeroPadValue(walletAddress, 32);
  const logs = await safePromise(
    getLogsChunked(provider, { topics: [APPROVAL_TOPIC, paddedOwner] }, fromBlock, latest)
  );
  return unique((logs || []).map((log) => ethers.getAddress(log.address)));
}

async function scanTokenApprovals(tokenAddress: string, walletAddress: string): Promise<WalletApproval[]> {
  const provider = getProvider();
  const paddedOwner = ethers.zeroPadValue(walletAddress, 32);
  const latest = await safePromise(provider.getBlockNumber());
  const fromBlock = latest ? Math.max(0, latest - PHAROS_CONFIG.approvalScanBlockWindow) : 0;
  const logs = await safePromise(
    getLogsChunked(provider, {
      address: tokenAddress,
      topics: [APPROVAL_TOPIC, paddedOwner]
    }, fromBlock, latest || fromBlock)
  );

  const spenders = unique((logs || []).map((log) => ethers.getAddress(`0x${String(log.topics[2]).slice(26)}`)));
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [decimals, symbol, name] = await Promise.all([
    safePromise(token.decimals()),
    safePromise(token.symbol()),
    safePromise(token.name())
  ]);

  const entries: Array<WalletApproval | undefined> = await Promise.all(
    spenders.map(async (spender) => {
      const allowanceRaw = await safePromise(token.allowance(walletAddress, spender));
      const allowance = allowanceRaw ? BigInt(allowanceRaw.toString()) : 0n;
      if (allowance === 0n) {
        return undefined;
      }

      const spenderCode = await safePromise(provider.getCode(spender));
      const spenderIsContract = Boolean(spenderCode && spenderCode !== "0x");
      const spenderVerified = spenderIsContract ? false : true;
      const safeDecimals = Number(decimals ?? 18);
      const isUnlimited = allowance === RISK_THRESHOLDS.unlimitedApproval;
      const riskLevel = scoreApproval(allowance, safeDecimals, isUnlimited, spenderIsContract, spenderVerified);

      const entry: WalletApproval = {
        token_address: ethers.getAddress(tokenAddress),
        token_symbol: String(symbol || "TOKEN"),
        token_name: String(name || "Unknown token"),
        spender_address: spender,
        spender_label: spenderIsContract ? "Contract spender" : "Externally owned account",
        allowance: isUnlimited ? "UNLIMITED" : ethers.formatUnits(allowance, safeDecimals),
        is_unlimited: isUnlimited,
        risk_level: riskLevel,
        revoke_tx: buildRevokeTx(tokenAddress, spender)
      };

      return entry;
    })
  );

  return entries.filter((entry): entry is WalletApproval => Boolean(entry));
}

function scoreApproval(
  allowance: bigint,
  decimals: number,
  isUnlimited: boolean,
  spenderIsContract: boolean,
  spenderVerified: boolean
): RiskLevel {
  if (isUnlimited && spenderIsContract && !spenderVerified) {
    return "CRITICAL";
  }

  if (isUnlimited && spenderIsContract) {
    return "HIGH";
  }

  if (allowance > RISK_THRESHOLDS.largeApprovalTokenUnits * 10n ** BigInt(decimals)) {
    return "MEDIUM";
  }

  return "LOW";
}

function severityRank(level: RiskLevel): number {
  return { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[level];
}
