import { ethers } from "ethers";
import { RiskLevel } from "./types";
import { ZERO_ADDRESS } from "../config";

export function isValidAddress(address?: string): address is string {
  return Boolean(address && ethers.isAddress(address));
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address);
}

export function isZeroAddress(address?: string): boolean {
  return Boolean(address && isValidAddress(address) && normalizeAddress(address) === ZERO_ADDRESS);
}

export function formatNative(wei?: bigint): string {
  if (wei === undefined) {
    return "unknown";
  }

  return `${trimDecimals(ethers.formatEther(wei), 6)} PHRS`;
}

export function formatToken(units?: bigint, decimals = 18, symbol = "TOKEN"): string {
  if (units === undefined) {
    return `0 ${symbol}`;
  }

  return `${trimDecimals(ethers.formatUnits(units, decimals), 6)} ${symbol}`;
}

export function parseHumanAmount(amount?: string, decimals = 18): bigint | undefined {
  if (!amount) {
    return undefined;
  }

  const cleaned = amount.replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return undefined;
  }

  return ethers.parseUnits(cleaned, decimals);
}

export function shortenAddress(address?: string): string {
  if (!address) {
    return "unknown";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function maxRiskLevel(levels: RiskLevel[]): RiskLevel {
  const order: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  return levels.reduce<RiskLevel>((max, level) => (order[level] > order[max] ? level : max), "LOW");
}

export function trimDecimals(value: string, maxPlaces: number): string {
  if (!value.includes(".")) {
    return value;
  }

  const [whole, fraction] = value.split(".");
  const trimmed = fraction.slice(0, maxPlaces).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export async function safePromise<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch {
    return undefined;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function getLogsChunked(
  provider: ethers.JsonRpcProvider,
  filter: Omit<ethers.Filter, "fromBlock" | "toBlock">,
  fromBlock: number,
  toBlock: number,
  chunkSize = 1000
): Promise<ethers.Log[]> {
  const ranges: Array<{ fromBlock: number; toBlock: number }> = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    ranges.push({ fromBlock: start, toBlock: Math.min(toBlock, start + chunkSize - 1) });
  }

  const logs: ethers.Log[] = [];
  for (let index = 0; index < ranges.length; index += 10) {
    const batch = ranges.slice(index, index + 10);
    const results = await Promise.all(
      batch.map((range) =>
        provider.getLogs({
          ...filter,
          fromBlock: range.fromBlock,
          toBlock: range.toBlock
        })
      )
    );
    logs.push(...results.flat());
  }

  return logs;
}
