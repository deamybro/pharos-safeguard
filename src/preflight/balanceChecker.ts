import { ethers } from "ethers";
import { PHAROS_CONFIG } from "../config";
import { getProvider } from "../shared/provider";
import { BalanceResult, TransactionIntent } from "../shared/types";
import { formatNative, formatToken, isValidAddress, parseHumanAmount } from "../shared/utils";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
] as const;

export async function checkBalance(intent: TransactionIntent, walletAddress?: string): Promise<BalanceResult> {
  const wallet = intent.from || walletAddress;
  if (!isValidAddress(wallet)) {
    return {
      native_balance: "unknown",
      sufficient: false,
      details: "Wallet address is missing or invalid."
    };
  }

  const provider = getProvider();
  const nativeBalanceWei = await provider.getBalance(wallet).catch(() => undefined);
  if (nativeBalanceWei === undefined) {
    return {
      native_balance: "unknown",
      sufficient: false,
      details: "Balance check unavailable because the RPC endpoint did not respond."
    };
  }

  const requiredNativeWei = intent.value ? BigInt(intent.value) : nativeRequiredFromIntent(intent);
  const nativeSufficient =
    nativeBalanceWei === undefined || requiredNativeWei === undefined ? true : nativeBalanceWei >= requiredNativeWei;

  if (intent.tokenAddress && intent.amount) {
    const token = new ethers.Contract(intent.tokenAddress, ERC20_ABI, provider);
    const [rawBalance, decimals, symbol] = await Promise.all([
      token.balanceOf(wallet).catch(() => undefined),
      token.decimals().catch(() => 18),
      token.symbol().catch(() => intent.tokenSymbol || "TOKEN")
    ]);
    const requiredTokenBaseUnits = parseHumanAmount(intent.amount, Number(decimals));
    const tokenSufficient =
      rawBalance === undefined || requiredTokenBaseUnits === undefined
        ? true
        : BigInt(rawBalance.toString()) >= requiredTokenBaseUnits;

    return {
      native_balance: formatNative(nativeBalanceWei),
      token_balance: formatToken(rawBalance ? BigInt(rawBalance.toString()) : undefined, Number(decimals), String(symbol)),
      sufficient: nativeSufficient && tokenSufficient,
      details: tokenSufficient ? "Token and gas balances appear sufficient." : "Token balance is below the requested amount.",
      nativeBalanceWei,
      tokenBalanceBaseUnits: rawBalance ? BigInt(rawBalance.toString()) : undefined,
      requiredNativeWei,
      requiredTokenBaseUnits
    };
  }

  return {
    native_balance: formatNative(nativeBalanceWei),
    sufficient: nativeSufficient,
    details: nativeSufficient
      ? "Native balance appears sufficient for the requested action."
      : "Native balance cannot cover the requested amount.",
    nativeBalanceWei,
    requiredNativeWei
  };
}

function nativeRequiredFromIntent(intent: TransactionIntent): bigint | undefined {
  if (!intent.amount || intent.tokenSymbol?.toUpperCase() !== PHAROS_CONFIG.nativeCurrency.symbol) {
    return undefined;
  }

  return parseHumanAmount(intent.amount, PHAROS_CONFIG.nativeCurrency.decimals);
}
