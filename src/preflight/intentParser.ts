import { ethers } from "ethers";
import { RISK_THRESHOLDS } from "../config";
import { TransactionIntent } from "../shared/types";
import { isValidAddress, normalizeAddress } from "../shared/utils";

const ADDRESS_RE = /0x[a-fA-F0-9]{40}\b/g;
const ADDRESS_LIKE_RE = /0x[a-fA-F0-9]{1,40}\b/g;
const AMOUNT_RE = /(?:send|transfer|approve|amount|for)\s+([0-9][0-9,]*(?:\.[0-9]+)?)/i;
const SYMBOL_RE = /\b(PHRS|USDC|USDT|DAI|WETH|TEST-TOKEN|TEST|ETH)\b/i;

export function parseIntent(prompt: string, walletAddress?: string, txData?: Partial<TransactionIntent>): TransactionIntent {
  const lower = prompt.toLowerCase();
  const addresses = Array.from(prompt.matchAll(ADDRESS_RE)).map((match) => match[0]);
  const checksumAddresses = addresses.filter(isValidAddress).map(normalizeAddress);
  const amountMatch = prompt.match(AMOUNT_RE);
  const symbolMatch = prompt.match(SYMBOL_RE);
  const isUnlimited =
    lower.includes("unlimited") ||
    lower.includes("maxuint") ||
    lower.includes(RISK_THRESHOLDS.unlimitedApproval.toString());

  if (txData?.data || txData?.to || txData?.value) {
    return {
      ...txData,
      rawPrompt: prompt,
      from: txData.from || walletAddress,
      type: txData.data ? "contract_write" : "transfer",
      isStateChanging: Boolean(txData.data)
    };
  }

  if (lower.includes("airdrop") || lower.includes("batch")) {
    return {
      type: "batch_transfer",
      from: walletAddress,
      rawPrompt: prompt,
      tokenSymbol: symbolMatch?.[1]?.toUpperCase(),
      amount: amountMatch?.[1],
      recipients: extractRecipients(prompt)
    };
  }

  if (lower.includes("approve") || lower.includes("approval")) {
    return {
      type: "approval",
      from: walletAddress,
      rawPrompt: prompt,
      tokenSymbol: symbolMatch?.[1]?.toUpperCase(),
      spender: checksumAddresses[0],
      to: checksumAddresses[0],
      approvalAmount: isUnlimited ? RISK_THRESHOLDS.unlimitedApproval.toString() : amountMatch?.[1],
      isUnlimitedApproval: isUnlimited
    };
  }

  if (lower.includes("call") || lower.includes("withdraw") || lower.includes("contract")) {
    return {
      type: "contract_write",
      from: walletAddress,
      rawPrompt: prompt,
      to: checksumAddresses[0],
      methodName: extractMethodName(prompt),
      isStateChanging: true
    };
  }

  if (lower.includes("send") || lower.includes("transfer")) {
    return {
      type: "transfer",
      from: walletAddress,
      rawPrompt: prompt,
      to: checksumAddresses[0],
      amount: amountMatch?.[1],
      tokenSymbol: symbolMatch?.[1]?.toUpperCase()
    };
  }

  return {
    type: "unknown",
    from: walletAddress,
    rawPrompt: prompt,
    to: checksumAddresses[0]
  };
}

function extractRecipients(prompt: string): { address: string; amount: string }[] {
  const fallbackAmount = prompt.match(AMOUNT_RE)?.[1] || "0";
  return Array.from(prompt.matchAll(ADDRESS_LIKE_RE)).map((match) => ({
    address: ethers.isAddress(match[0]) ? ethers.getAddress(match[0]) : match[0],
    amount: fallbackAmount
  }));
}

function extractMethodName(prompt: string): string | undefined {
  return prompt.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/)?.[1];
}
