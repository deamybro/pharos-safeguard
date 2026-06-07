import { ethers } from "ethers";
import { PHAROS_CONFIG } from "../config";
import { getProvider } from "../shared/provider";
import { TokenBalance } from "../shared/types";
import { formatNative, getLogsChunked, isValidAddress, safePromise, unique } from "../shared/utils";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
] as const;

const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const APPROVAL_TOPIC = ethers.id("Approval(address,address,uint256)");

export async function aggregateAssets(walletAddress: string): Promise<{ native_balance: string; tokens: TokenBalance[] }> {
  if (!isValidAddress(walletAddress)) {
    return { native_balance: "invalid wallet", tokens: [] };
  }

  const provider = getProvider();
  const nativeBalance = await safePromise(provider.getBalance(walletAddress));
  const tokenAddresses = await discoverHeldTokenAddresses(walletAddress);
  const tokens = await Promise.all(tokenAddresses.slice(0, PHAROS_CONFIG.maxTokensToScan).map((token) => readTokenBalance(token, walletAddress)));

  return {
    native_balance: formatNative(nativeBalance),
    tokens: tokens.filter((token): token is TokenBalance => Boolean(token))
  };
}

export async function discoverHeldTokenAddresses(walletAddress: string): Promise<string[]> {
  if (!isValidAddress(walletAddress)) {
    return [];
  }

  const provider = getProvider();
  const latest = await safePromise(provider.getBlockNumber());
  if (!latest) {
    return [];
  }

  const fromBlock = Math.max(0, latest - PHAROS_CONFIG.approvalScanBlockWindow);
  const padded = ethers.zeroPadValue(walletAddress, 32);
  const logs = await Promise.all([
    safePromise(getLogsChunked(provider, { topics: [TRANSFER_TOPIC, padded] }, fromBlock, latest)),
    safePromise(getLogsChunked(provider, { topics: [TRANSFER_TOPIC, null, padded] }, fromBlock, latest)),
    safePromise(getLogsChunked(provider, { topics: [APPROVAL_TOPIC, padded] }, fromBlock, latest))
  ]);

  return unique(logs.flatMap((group) => group || []).map((log) => ethers.getAddress(log.address)));
}

async function readTokenBalance(tokenAddress: string, walletAddress: string): Promise<TokenBalance | undefined> {
  const provider = getProvider();
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [rawBalance, decimals, symbol, name] = await Promise.all([
    safePromise(token.balanceOf(walletAddress)),
    safePromise(token.decimals()),
    safePromise(token.symbol()),
    safePromise(token.name())
  ]);

  if (!rawBalance || BigInt(rawBalance.toString()) === 0n) {
    return undefined;
  }

  const safeDecimals = Number(decimals ?? 18);
  return {
    address: ethers.getAddress(tokenAddress),
    symbol: String(symbol || "TOKEN"),
    name: String(name || "Unknown token"),
    balance: ethers.formatUnits(BigInt(rawBalance.toString()), safeDecimals),
    decimals: safeDecimals
  };
}
