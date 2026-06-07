"use client";

import { ChevronDown, Loader2, LogOut, PlugZap, RefreshCw, Wallet } from "lucide-react";

interface WalletConnectionMenuProps {
  wallets: AvailableWallet[];
  selectedWallet: AvailableWallet | null;
  account: string | null;
  connecting: boolean;
  open: boolean;
  onToggle: () => void;
  onConnect: (wallet: AvailableWallet, forceAccountSelection?: boolean) => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export default function WalletConnectionMenu({
  wallets,
  selectedWallet,
  account,
  connecting,
  open,
  onToggle,
  onConnect,
  onDisconnect
}: WalletConnectionMenuProps) {
  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-2 border border-[var(--border-active)] bg-transparent px-3 py-2 text-white transition hover:border-pharos disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onToggle}
        disabled={connecting}
        aria-expanded={open}
      >
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlugZap className="h-4 w-4" aria-hidden />}
        {account ? shortenAddress(account) : connecting ? "Connecting..." : "Connect Wallet"}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-72 border border-border bg-surface p-2 shadow-2xl">
          {account && selectedWallet ? (
            <>
              <div className="border-b border-border p-3">
                <div className="flex items-center gap-3">
                  <WalletIcon wallet={selectedWallet} />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{selectedWallet.info.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{shortenAddress(account)}</p>
                  </div>
                </div>
              </div>
              <button className={menuButtonClass} onClick={() => onConnect(selectedWallet, true)}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Change account
              </button>
              <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase text-muted">Choose another wallet</p>
              {wallets
                .filter((wallet) => wallet.info.uuid !== selectedWallet.info.uuid)
                .map((wallet) => (
                  <button key={wallet.info.uuid} className={menuButtonClass} onClick={() => onConnect(wallet)}>
                    <WalletIcon wallet={wallet} />
                    {wallet.info.name}
                  </button>
                ))}
              <button className={`${menuButtonClass} mt-2 border-t border-border text-[var(--risk-high)]`} onClick={onDisconnect}>
                <LogOut className="h-4 w-4" aria-hidden />
                Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="px-3 py-2 font-mono text-[10px] uppercase text-muted">Select wallet</p>
              {wallets.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted">No injected wallets detected.</p>
              ) : (
                wallets.map((wallet) => (
                  <button key={wallet.info.uuid} className={menuButtonClass} onClick={() => onConnect(wallet)}>
                    <WalletIcon wallet={wallet} />
                    {wallet.info.name}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const menuButtonClass =
  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition hover:bg-elevated";

function WalletIcon({ wallet }: { wallet: AvailableWallet }) {
  if (wallet.info.icon) {
    return <img className="h-5 w-5" src={wallet.info.icon} alt="" />;
  }

  return <Wallet className="h-5 w-5 text-muted" aria-hidden />;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
