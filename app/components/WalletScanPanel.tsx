"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, ScanLine, ShieldX } from "lucide-react";
import { WalletApproval, WalletScanReport } from "@/src/shared/types";
import ApprovalRow from "./ApprovalRow";
import ConfirmModal from "./ConfirmModal";
import RiskBadge from "./RiskBadge";
import TerminalOutput from "./TerminalOutput";

const SAMPLE_WALLET = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
const PHAROS_CHAIN_ID_HEX = "0xa8231";

interface WalletScanPanelProps {
  connectedWallet: string | null;
  walletProvider: EthereumProvider | null;
  onRequestConnect: () => Promise<void> | void;
}

export default function WalletScanPanel({ connectedWallet, walletProvider, onRequestConnect }: WalletScanPanelProps) {
  const [walletAddress, setWalletAddress] = useState(SAMPLE_WALLET);
  const [report, setReport] = useState<WalletScanReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<WalletApproval | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
      setReport(null);
    }
  }, [connectedWallet]);

  async function scan() {
    setLoading(true);
    try {
      const response = await fetch("/api/walletscan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress })
      });
      setReport((await response.json()) as WalletScanReport);
    } finally {
      setLoading(false);
    }
  }

  function openRevoke(approval: WalletApproval) {
    setSelectedApproval(approval);
    setRevokeError(null);
    setTxHash(null);
    setModalOpen(true);
  }

  async function revokeSelectedApproval() {
    if (!selectedApproval) {
      setRevokeError("Choose an approval to revoke first.");
      return;
    }

    if (!connectedWallet) {
      setModalOpen(false);
      await onRequestConnect();
      return;
    }

    const ethereum = walletProvider;
    if (!ethereum) {
      setRevokeError("No injected wallet found. Install MetaMask or another EIP-1193 wallet.");
      return;
    }

    const txData = normalizeTxData(selectedApproval.revoke_tx);
    if (!txData?.to || !txData.data) {
      setRevokeError("This approval does not include revoke transaction data.");
      return;
    }

    setRevokeBusy(true);
    setRevokeError(null);
    setTxHash(null);
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: PHAROS_CHAIN_ID_HEX }]
      });
      const hash = await ethereum.request<string>({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedWallet,
            to: txData.to,
            data: txData.data,
            value: txData.value || "0x0"
          }
        ]
      });
      setTxHash(hash);
    } catch (error) {
      setRevokeError(error instanceof Error ? error.message : "Wallet rejected or failed to submit the revoke transaction.");
    } finally {
      setRevokeBusy(false);
    }
  }

  const activeReport = report || emptyReport(walletAddress);
  const approvalCount = activeReport.approvals.length || activeReport.dangerous_approvals.length;
  const lines = loading
    ? ["Initializing Pharos SafeGuard...", "[WalletScan] Discovering held ERC20 tokens...", "[ApprovalScan] Reading allowances...", "[RiskScore] Scoring wallet..."]
    : ["Initializing Pharos SafeGuard...", `Wallet: ${activeReport.wallet_address}`, `[WalletScan] Approvals: ${approvalCount}`, `RESULT: ${activeReport.risk_level} (${activeReport.risk_score}/100)`];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <section className="border border-border bg-base p-4">
          <h2 className="font-mono text-base text-white">WALLET SECURITY AUDIT</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="h-11 min-w-0 border border-border bg-surface px-3 font-mono text-sm text-white outline-none transition placeholder:text-muted focus:border-pharos"
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="0x wallet address"
            />
            <button
              onClick={scan}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 border border-pharos bg-[rgba(59,130,246,0.14)] px-4 text-sm text-white transition hover:bg-[rgba(59,130,246,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ScanLine className="h-4 w-4" aria-hidden />}
              {loading ? "Analyzing..." : "Scan Wallet"}
            </button>
          </div>
        </section>

        <section className="border border-border bg-base p-4">
          <p className="font-mono text-xs uppercase text-muted">Portfolio</p>
          <p className="mt-3 text-sm text-white">
            {activeReport.portfolio_summary.native_balance}
            {activeReport.portfolio_summary.tokens.map((token) => ` · ${token.balance} ${token.symbol}`).join("")}
          </p>
        </section>

        <section className="border border-border bg-base p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase text-muted">Risk Score</p>
            <RiskBadge level={activeReport.risk_level} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-3 flex-1 border border-border bg-surface">
              <div className="score-fill h-full bg-[var(--risk-high)]" style={{ width: `${activeReport.risk_score}%` }} />
            </div>
            <span className="w-20 text-right font-mono text-sm text-white">{activeReport.risk_score} / 100</span>
          </div>
        </section>

        <section className="border border-border bg-base p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase text-muted">Dangerous Approvals</p>
            <span className="font-mono text-xs text-muted">{activeReport.dangerous_approvals.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {activeReport.dangerous_approvals.length === 0 ? (
              <p className="text-sm text-muted">No dangerous live approvals found for this wallet.</p>
            ) : (
              activeReport.dangerous_approvals.map((approval) => (
                <ApprovalRow key={`${approval.token_address}-${approval.spender_address}`} approval={approval} onRevoke={() => openRevoke(approval)} />
              ))
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => activeReport.dangerous_approvals[0] && openRevoke(activeReport.dangerous_approvals[0])}
            disabled={activeReport.dangerous_approvals.length === 0}
            className="inline-flex items-center gap-2 border border-[var(--risk-high)] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldX className="h-4 w-4" aria-hidden />
            Revoke First Dangerous
          </button>
          <button className="inline-flex items-center gap-2 border border-border px-3 py-2 text-sm text-white">
            <Download className="h-4 w-4" aria-hidden />
            Export Report
          </button>
        </div>
      </div>
      <TerminalOutput lines={lines} />
      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={revokeSelectedApproval}
        title="Confirm Revoke"
        description={
          connectedWallet
            ? "Your wallet will be asked to sign an ERC20 approve(spender, 0) transaction. Nothing is broadcast until you confirm in the wallet."
            : "Connect a wallet before signing a revoke transaction."
        }
        confirmLabel={connectedWallet ? "Sign Revoke" : "Connect Wallet"}
        busy={revokeBusy}
        error={revokeError}
      >
        {selectedApproval && (
          <div className="space-y-2 border border-border bg-base p-3 font-mono text-xs text-muted">
            <div className="flex justify-between gap-3">
              <span>Token</span>
              <span className="text-white">{selectedApproval.token_symbol}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Spender</span>
              <span className="break-all text-white">{selectedApproval.spender_address}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Allowance</span>
              <span className="text-white">{selectedApproval.allowance}</span>
            </div>
            {txHash && (
              <div className="border-t border-border pt-2">
                <span className="break-all text-[var(--risk-low)]">Submitted: {txHash}</span>
              </div>
            )}
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}

function normalizeTxData(txData: object | undefined): { to?: string; data?: string; value?: string } | undefined {
  if (!txData) {
    return undefined;
  }

  const candidate = txData as { to?: unknown; data?: unknown; value?: unknown };
  return {
    to: typeof candidate.to === "string" ? candidate.to : undefined,
    data: typeof candidate.data === "string" ? candidate.data : undefined,
    value: typeof candidate.value === "string" ? candidate.value : undefined
  };
}

function emptyReport(walletAddress: string): WalletScanReport {
  return {
    mode: "walletscan",
    wallet_address: walletAddress,
    data_status: "UNAVAILABLE",
    data_warnings: ["Run WalletScan to collect live Pharos RPC evidence."],
    scan_coverage: {
      token_and_approval_window_blocks: 100000,
      transaction_history_window_blocks: 50
    },
    risk_score: 0,
    risk_level: "LOW",
    portfolio_summary: {
      native_balance: "Not scanned yet",
      tokens: []
    },
    approvals: [],
    dangerous_approvals: [],
    tx_anomalies: [],
    recommendations: ["Run WalletScan to read live balances, approvals, and revoke actions."],
    actions: [],
    timestamp: new Date().toISOString()
  };
}

const demoDangerousApprovals: WalletApproval[] = [
  {
    token_address: "0x0000000000000000000000000000000000000001",
    token_symbol: "USDC",
    token_name: "USD Coin",
    spender_address: "0xDEADBEEF00000000000000000000000000000000",
    spender_label: "Unverified contract",
    allowance: "UNLIMITED",
    is_unlimited: true,
    risk_level: "CRITICAL",
    revoke_tx: {
      to: "0x0000000000000000000000000000000000000001",
      data: "0x095ea7b3000000000000000000000000deadbeef00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      value: "0x0"
    }
  },
  {
    token_address: "0x0000000000000000000000000000000000000002",
    token_symbol: "TEST",
    token_name: "Test Token",
    spender_address: "0xABCDEF1200000000000000000000000000000000",
    spender_label: "Contract spender",
    allowance: "UNLIMITED",
    is_unlimited: true,
    risk_level: "HIGH",
    revoke_tx: {
      to: "0x0000000000000000000000000000000000000002",
      data: "0x095ea7b3000000000000000000000000abcdef12000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      value: "0x0"
    }
  }
];

const demoReport: WalletScanReport = {
  mode: "walletscan",
  wallet_address: SAMPLE_WALLET,
  data_status: "LIVE",
  data_warnings: [],
  scan_coverage: {
    token_and_approval_window_blocks: 100000,
    transaction_history_window_blocks: 50
  },
  risk_score: 72,
  risk_level: "HIGH",
  portfolio_summary: {
    native_balance: "1.42 PHRS",
    tokens: [
      { address: "0x0000000000000000000000000000000000000001", symbol: "USDC", name: "USD Coin", balance: "820", decimals: 6 },
      { address: "0x0000000000000000000000000000000000000002", symbol: "TEST", name: "Test Token", balance: "5000", decimals: 18 }
    ]
  },
  approvals: demoDangerousApprovals,
  dangerous_approvals: demoDangerousApprovals,
  tx_anomalies: [
    {
      tx_hash: "0x9999000000000000000000000000000000000000000000000000000000000000",
      type: "FAILED_TRANSACTION",
      description: "Failed tx to 0x999...",
      severity: "LOW"
    }
  ],
  recommendations: ["Revoke dangerous approvals or replace unlimited allowances with scoped approvals."],
  actions: [],
  timestamp: new Date().toISOString()
};
