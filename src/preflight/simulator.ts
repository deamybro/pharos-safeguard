import { ethers } from "ethers";
import { PHAROS_CONFIG } from "../config";
import { getProvider } from "../shared/provider";
import { SimulationReport, TransactionIntent } from "../shared/types";
import { isValidAddress, parseHumanAmount } from "../shared/utils";

const ERC20_ABI = [
  "function transfer(address to,uint256 amount) returns (bool)",
  "function approve(address spender,uint256 amount) returns (bool)"
] as const;

export async function simulate(intent: TransactionIntent): Promise<SimulationReport> {
  const provider = getProvider();
  const tx = buildSimulationTx(intent);

  if (!tx || (!tx.to && intent.type !== "deploy")) {
    return {
      result: "UNKNOWN",
      details: "Simulation requires a target address and calldata."
    };
  }

  try {
    await provider.call(tx);
    return {
      result: "SUCCESS",
      details: "eth_call completed successfully at latest block."
    };
  } catch (error) {
    if (isNetworkFailure(error)) {
      return {
        result: "UNKNOWN",
        details: `Simulation unavailable: ${decodeError(error) || "RPC endpoint did not respond."}`
      };
    }

    return {
      result: "LIKELY_FAIL",
      details: `eth_call reverted or failed: ${decodeError(error)}`
    };
  }
}

function buildSimulationTx(intent: TransactionIntent): ethers.TransactionRequest | undefined {
  if (intent.data) {
    return {
      from: isValidAddress(intent.from) ? intent.from : undefined,
      to: intent.to,
      value: nativeValue(intent),
      data: intent.data
    };
  }

  if (intent.type === "approval" && isValidAddress(intent.tokenAddress) && isValidAddress(intent.spender)) {
    const iface = new ethers.Interface(ERC20_ABI);
    return {
      from: isValidAddress(intent.from) ? intent.from : undefined,
      to: intent.tokenAddress,
      data: iface.encodeFunctionData("approve", [intent.spender, BigInt(intent.approvalAmount || "0")])
    };
  }

  if (intent.type === "transfer" && isValidAddress(intent.tokenAddress) && isValidAddress(intent.to) && intent.amount) {
    const iface = new ethers.Interface(ERC20_ABI);
    return {
      from: isValidAddress(intent.from) ? intent.from : undefined,
      to: intent.tokenAddress,
      data: iface.encodeFunctionData("transfer", [intent.to, BigInt(intent.amount)])
    };
  }

  if (intent.type === "transfer" && isValidAddress(intent.to)) {
    return {
      from: isValidAddress(intent.from) ? intent.from : undefined,
      to: intent.to,
      value: nativeValue(intent),
      data: "0x"
    };
  }

  return undefined;
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

function decodeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown revert reason";
}

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    !message ||
    message.includes("econn") ||
    message.includes("eacces") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("failed to fetch")
  );
}
