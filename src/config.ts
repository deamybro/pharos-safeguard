export const PHAROS_CONFIG = {
  rpc: process.env.PHAROS_RPC || "https://atlantic.dplabs-internal.com",
  chainId: Number(process.env.PHAROS_CHAIN_ID || 688689),
  nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
  blockExplorer: "https://atlantic.pharosscan.xyz",
  maxRecentTx: 50,
  maxTokensToScan: 30,
  approvalScanBlockWindow: 100000
} as const;

export const RISK_THRESHOLDS = {
  unlimitedApproval: BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
  highValueTransferUSD: 10000,
  highGasMultiplier: 3,
  maxBatchSize: 500,
  largeApprovalTokenUnits: 1000n
} as const;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
