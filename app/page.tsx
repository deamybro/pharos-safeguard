"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Activity, Wallet, RadioTower } from "lucide-react";
import ModeSelector from "./components/ModeSelector";
import PreFlightPanel from "./components/PreFlightPanel";
import WalletScanPanel from "./components/WalletScanPanel";
import SentinelPanel from "./components/SentinelPanel";
import WalletConnectionMenu from "./components/WalletConnectionMenu";

const PHAROS_CHAIN_ID_HEX = "0xa8231";
const PHAROS_RPC = "https://atlantic.dplabs-internal.com";

export default function Page() {
  const [mode, setMode] = useState<"preflight" | "walletscan" | "sentinel">("preflight");
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<AvailableWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<AvailableWallet | null>(null);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  useEffect(() => {
    const announceProvider = (event: Event) => {
      const detail = (event as CustomEvent<AvailableWallet>).detail;
      setWallets((current) => current.some((wallet) => wallet.info.uuid === detail.info.uuid) ? current : [...current, detail]);
    };
    window.addEventListener("eip6963:announceProvider", announceProvider as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const fallbackTimer = window.setTimeout(() => {
      if (window.ethereum) {
        const legacy = window.ethereum as EthereumProvider & { providers?: EthereumProvider[] };
        const legacyProviders = legacy.providers?.length ? legacy.providers : [window.ethereum];
        setWallets((current) => {
          const additions = legacyProviders
            .map((provider, index): AvailableWallet => ({
              info: {
                uuid: `legacy-window-ethereum-${index}`,
                name: inferLegacyWalletName(provider, index),
                icon: "",
                rdns: `legacy.window.ethereum.${index}`
              },
              provider
            }))
            .filter((wallet) => !current.some((existing) => existing.provider === wallet.provider));
          return additions.length ? [...current, ...additions] : current;
        });
      }
    }, 300);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("eip6963:announceProvider", announceProvider as EventListener);
    };
  }, []);

  useEffect(() => {
    const ethereum = selectedWallet?.provider;
    if (!ethereum) {
      return;
    }
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      setAccount(accounts[0] ?? null);
    };
    const handleChainChanged = (...args: unknown[]) => {
      setChainId(typeof args[0] === "string" ? args[0] : null);
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [selectedWallet]);

  async function connectWallet(wallet: AvailableWallet, forceAccountSelection = false) {
    const ethereum = wallet.provider;
    setConnecting(true);
    setWalletError(null);
    try {
      if (forceAccountSelection) {
        await ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        }).catch(() => undefined);
      }
      const accounts = await ethereum.request<string[]>({ method: "eth_requestAccounts" });
      setAccount(accounts[0] ?? null);
      setSelectedWallet(wallet);
      await ensurePharosChain(ethereum);
      const activeChain = await ethereum.request<string>({ method: "eth_chainId" });
      setChainId(activeChain);
      setWalletMenuOpen(false);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectWallet() {
    const provider = selectedWallet?.provider;
    if (provider) {
      await provider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }]
      }).catch(() => undefined);
    }
    setAccount(null);
    setChainId(null);
    setSelectedWallet(null);
    setWalletMenuOpen(false);
    setWalletError(null);
  }

  function requestConnect() {
    setWalletMenuOpen(true);
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col border border-border bg-[rgba(18,18,26,0.86)]">
        <header className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-pharos" aria-hidden />
              <h1 className="font-mono text-xl font-semibold tracking-normal text-white">PHAROS SAFEGUARD</h1>
            </div>
            <p className="mt-1 text-sm text-muted">Onchain Safety Layer</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 border border-border bg-elevated px-3 py-2 font-mono text-muted">
              <RadioTower className="h-4 w-4 text-[var(--risk-low)]" aria-hidden />
              {chainId === PHAROS_CHAIN_ID_HEX ? "Pharos Atlantic" : "Network unchecked"}
            </span>
            <WalletConnectionMenu
              wallets={wallets}
              selectedWallet={selectedWallet}
              account={account}
              connecting={connecting}
              open={walletMenuOpen}
              onToggle={() => setWalletMenuOpen((open) => !open)}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
            />
          </div>
          {walletError && <p className="text-xs text-[var(--risk-medium)] sm:basis-full sm:text-right">{walletError}</p>}
        </header>

        <section className="grid flex-1 gap-5 p-5 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <ModeSelector mode={mode} onModeChange={setMode} />
            <div className="border border-border bg-base p-4">
              <p className="font-mono text-xs uppercase text-muted">System State</p>
              <div className="mt-4 space-y-3 text-sm">
                <Metric icon={<Activity className="h-4 w-4" />} label="Rules online" value="14" />
                <Metric icon={<Wallet className="h-4 w-4" />} label="Modes" value="3" />
                <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Guardrail" value="Human confirm" />
              </div>
            </div>
          </aside>

          <section>
            {mode === "preflight" ? (
              <PreFlightPanel connectedWallet={account} />
            ) : mode === "walletscan" ? (
              <WalletScanPanel connectedWallet={account} walletProvider={selectedWallet?.provider || null} onRequestConnect={requestConnect} />
            ) : (
              <SentinelPanel connectedWallet={account} />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

async function ensurePharosChain(ethereum: EthereumProvider) {
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: PHAROS_CHAIN_ID_HEX }]
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: number }).code : undefined;
    if (code !== 4902) {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: PHAROS_CHAIN_ID_HEX,
          chainName: "Pharos Atlantic Testnet",
          nativeCurrency: { name: "Pharos", symbol: "PHRS", decimals: 18 },
          rpcUrls: [PHAROS_RPC],
          blockExplorerUrls: ["https://atlantic.pharosscan.xyz"]
        }
      ]
    });
  }
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="inline-flex items-center gap-2 text-muted">
        {icon}
        {label}
      </span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function inferLegacyWalletName(provider: EthereumProvider, index: number): string {
  const flags = provider as EthereumProvider & {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    isRabby?: boolean;
    isBraveWallet?: boolean;
  };
  if (flags.isRabby) return "Rabby";
  if (flags.isCoinbaseWallet) return "Coinbase Wallet";
  if (flags.isBraveWallet) return "Brave Wallet";
  if (flags.isMetaMask) return "MetaMask";
  return index === 0 ? "Browser Wallet" : `Browser Wallet ${index + 1}`;
}
