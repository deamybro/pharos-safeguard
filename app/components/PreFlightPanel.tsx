"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { PreFlightReport } from "@/src/shared/types";
import RiskReport from "./RiskReport";
import TerminalOutput from "./TerminalOutput";

const SAMPLE_PROMPT = "Approve USDC for 0xDEADBEEF00000000000000000000000000000000 with unlimited amount";
const SAMPLE_WALLET = "0x742d35cc6634c0532925a3b844bc454e4438f44e";

export default function PreFlightPanel({ connectedWallet }: { connectedWallet: string | null }) {
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);
  const [walletAddress, setWalletAddress] = useState(SAMPLE_WALLET);
  const [report, setReport] = useState<PreFlightReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
    }
  }, [connectedWallet]);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, walletAddress })
      });
      setReport((await response.json()) as PreFlightReport);
    } finally {
      setLoading(false);
    }
  }

  const terminalLines = useMemo(() => buildLines(report, walletAddress, loading), [report, walletAddress, loading]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <section className="border border-border bg-base p-4">
          <h2 className="font-mono text-base text-white">PRE-FLIGHT CHECK</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="h-11 border border-border bg-surface px-3 font-mono text-sm text-white outline-none transition placeholder:text-muted focus:border-pharos"
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="0x wallet address"
            />
            <textarea
              className="min-h-36 resize-y border border-border bg-surface px-3 py-3 text-sm text-white outline-none transition placeholder:text-muted focus:border-pharos"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe what you want to do in plain English..."
            />
            <button
              onClick={run}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 border border-pharos bg-[rgba(59,130,246,0.14)] px-4 text-sm text-white transition hover:bg-[rgba(59,130,246,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {loading ? "Analyzing..." : "Run PreFlight Check"}
            </button>
          </div>
        </section>
        {report && <RiskReport report={report} />}
      </div>
      <TerminalOutput lines={terminalLines} />
    </div>
  );
}

function buildLines(report: PreFlightReport | null, walletAddress: string, loading: boolean): string[] {
  const base = [
    "Initializing Pharos SafeGuard...",
    "Connected to Pharos Atlantic Testnet (chainId: 688689)",
    `Wallet: ${walletAddress}`,
    "[PreFlight] Parsing transaction intent..."
  ];

  if (loading) {
    return [...base, "[RiskScan] Running 14 risk rules...", "[Gas] Estimating gas...", "[Simulate] Running eth_call dry run..."];
  }

  if (!report) {
    return [...base, "[PreFlight] Awaiting transaction description."];
  }

  return [
    ...base,
    `[PreFlight] Action: ${report.input_summary}`,
    "[RiskScan] Running 14 risk rules...",
    ...report.issues.map((issue) => `[RiskScan] ${issue.code} - ${issue.severity}`),
    `[Gas] ${report.gas_estimate}`,
    `[Balance] ${report.balance_check.details}`,
    `[Simulate] Result: ${report.simulation_result}`,
    `RESULT: ${report.risk_level} RISK`
  ];
}
