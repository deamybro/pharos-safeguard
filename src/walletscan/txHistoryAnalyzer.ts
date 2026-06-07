import { ethers } from "ethers";
import { PHAROS_CONFIG } from "../config";
import { getProvider } from "../shared/provider";
import { TxAnomaly } from "../shared/types";
import { isValidAddress, safePromise } from "../shared/utils";

export async function analyzeTxHistory(walletAddress: string): Promise<TxAnomaly[]> {
  if (!isValidAddress(walletAddress)) {
    return [];
  }

  const provider = getProvider();
  const latest = await safePromise(provider.getBlockNumber());
  if (!latest) {
    return [];
  }

  const anomalies: TxAnomaly[] = [];
  const start = Math.max(0, latest - PHAROS_CONFIG.maxRecentTx);

  for (let blockNumber = latest; blockNumber >= start && anomalies.length < 5; blockNumber -= 1) {
    const block = await safePromise(provider.getBlock(blockNumber, true));
    const txs = block?.prefetchedTransactions || [];
    for (const tx of txs) {
      if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
        continue;
      }

      const receipt = await safePromise(provider.getTransactionReceipt(tx.hash));
      if (receipt?.status === 0) {
        anomalies.push({
          tx_hash: tx.hash,
          type: "FAILED_TRANSACTION",
          description: `Failed transaction to ${tx.to ? ethers.getAddress(tx.to) : "contract deployment"}.`,
          severity: "LOW"
        });
      }
    }
  }

  return anomalies;
}
