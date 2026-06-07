import { ethers } from "ethers";
import { PHAROS_CONFIG, RISK_THRESHOLDS } from "../config";
import { getProvider } from "../shared/provider";
import { GasResult, TransactionIntent } from "../shared/types";
import { formatNative, isValidAddress, parseHumanAmount } from "../shared/utils";

export async function estimateGas(intent: TransactionIntent): Promise<GasResult> {
  if (!isValidAddress(intent.to) && intent.type !== "deploy") {
    return {
      gas_estimate: "unknown",
      gas_sufficient: true,
      details: "Gas estimate skipped because transaction target is missing."
    };
  }

  const provider = getProvider();
  const tx = {
    from: isValidAddress(intent.from) ? intent.from : undefined,
    to: intent.to,
    value: nativeValue(intent),
    data: intent.data || "0x"
  };

  try {
    const [gas, feeData] = await Promise.all([provider.estimateGas(tx), provider.getFeeData()]);
    const gasPrice = feeData.gasPrice || 0n;
    const cost = gas * gasPrice;
    const highGas = gas > 21000n * BigInt(RISK_THRESHOLDS.highGasMultiplier);

    return {
      gas_estimate: `${gas.toString()} gas (${formatNative(cost)})`,
      gas_sufficient: true,
      gas_units: gas,
      gas_cost_wei: cost,
      highGas,
      details: highGas ? "Gas estimate is materially above a plain transfer baseline." : "Gas estimate completed."
    };
  } catch (error) {
    return {
      gas_estimate: "unknown",
      gas_sufficient: true,
      details: `Gas estimation failed gracefully: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}

function nativeValue(intent: TransactionIntent): bigint {
  if (intent.value) {
    return BigInt(intent.value);
  }

  if (intent.type === "transfer" && intent.tokenSymbol === PHAROS_CONFIG.nativeCurrency.symbol) {
    return parseHumanAmount(intent.amount, PHAROS_CONFIG.nativeCurrency.decimals) || 0n;
  }

  return 0n;
}
