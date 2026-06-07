"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { AuditEntry, Constitution, SentinelDecision } from "@/src/shared/types";
import standardPreset from "@/constitutions/standard.json";
import AuditLogTable from "./AuditLogTable";
import ConstitutionEditor from "./ConstitutionEditor";
import DecisionResult from "./DecisionResult";
import TerminalOutput from "./TerminalOutput";

const SAMPLE_WALLET = "0x742d35cc6634c0532925a3b844bc454e4438f44e";

export default function SentinelPanel({ connectedWallet }: { connectedWallet: string | null }) {
  const [walletAddress, setWalletAddress] = useState(connectedWallet || SAMPLE_WALLET);
  const [prompt, setPrompt] = useState("Sentinel: can my agent send 3 USDC as a test?");
  const [estimatedUsdValue, setEstimatedUsdValue] = useState(3);
  const [constitution, setConstitution] = useState<Constitution>(() => structuredClone(standardPreset as Constitution));
  const [decision, setDecision] = useState<SentinelDecision | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
    }
  }, [connectedWallet]);

  useEffect(() => {
    const savedConstitution = window.localStorage.getItem(`sentinel-constitution-${walletAddress.toLowerCase()}`);
    if (savedConstitution) {
      setConstitution(JSON.parse(savedConstitution) as Constitution);
    }
  }, [walletAddress]);

  async function runCheck() {
    setLoading(true);
    setDecision(null);
    setError(null);
    try {
      const response = await fetch("/api/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          walletAddress,
          estimatedUsdValue,
          customConstitution: constitution
        })
      });
      const payload = (await response.json()) as SentinelDecision | { error?: string };
      if (!response.ok || !("deciding_rule" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Sentinel evaluation failed.");
      }
      const nextDecision = payload;
      setDecision(nextDecision);
      setEntries((current) => [toAuditEntry(nextDecision, walletAddress, prompt, estimatedUsdValue), ...current]);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Sentinel evaluation failed.");
    } finally {
      setLoading(false);
    }
  }

  function saveConstitution() {
    window.localStorage.setItem(`sentinel-constitution-${walletAddress.toLowerCase()}`, JSON.stringify(constitution));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const terminalLines = useMemo(() => {
    if (loading) {
      return ["Initializing Sentinel...", "[Constitution] Loading wallet rules...", "[Budget] Reading today's spend...", "[DecisionEngine] Evaluating hard rules...", "[DecisionEngine] Evaluating confirmation rules..."];
    }
    if (!decision) {
      return ["Sentinel ready.", "[Constitution] Standard guardrails loaded.", "[DecisionEngine] Awaiting agent action."];
    }
    return [
      `Action: ${prompt}`,
      `Value: $${estimatedUsdValue}`,
      `Rule: ${decision.deciding_rule.rule_id}`,
      `Verdict: ${decision.verdict}`,
      `Instruction: ${decision.agent_instruction}`
    ];
  }, [decision, estimatedUsdValue, loading, prompt]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="space-y-3">
          <ConstitutionEditor constitution={constitution} onChange={setConstitution} />
          <button
            className="inline-flex w-full items-center justify-center gap-2 border border-[var(--risk-medium)] bg-[var(--risk-medium-bg)] px-3 py-2 text-sm text-white"
            onClick={saveConstitution}
          >
            <Save className="h-4 w-4" aria-hidden />
            {saved ? "Constitution Saved" : "Save Constitution"}
          </button>
        </div>

        <div className="space-y-5">
          <section className="border border-border bg-base p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--risk-medium)]" aria-hidden />
              <h2 className="font-mono text-base text-white">SENTINEL DECISION SIMULATOR</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                className="h-11 border border-border bg-surface px-3 font-mono text-sm text-white outline-none focus:border-[var(--risk-medium)]"
                value={walletAddress}
                onChange={(event) => setWalletAddress(event.target.value)}
                placeholder="0x wallet address"
              />
              <textarea
                className="min-h-28 resize-y border border-border bg-surface p-3 text-sm text-white outline-none focus:border-[var(--risk-medium)]"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Agent wants to..."
              />
              <input
                type="number"
                min="0"
                className="h-11 border border-border bg-surface px-3 font-mono text-sm text-white outline-none focus:border-[var(--risk-medium)]"
                value={estimatedUsdValue}
                onChange={(event) => setEstimatedUsdValue(Number(event.target.value))}
                placeholder="Estimated USD value"
              />
              <button
                onClick={runCheck}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 border border-[var(--risk-medium)] bg-[var(--risk-medium-bg)] px-4 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
                {loading ? "Evaluating..." : "Run Sentinel Check"}
              </button>
            </div>
          </section>

          <TerminalOutput lines={terminalLines} />
          {error && <div className="border border-[var(--risk-high)] bg-[var(--risk-high-bg)] p-3 text-sm text-[var(--risk-high)]">{error}</div>}
          {decision && <DecisionResult decision={decision} />}
          {decision && <BudgetBar decision={decision} />}
        </div>
      </div>
      <AuditLogTable entries={entries} />
    </div>
  );
}

function BudgetBar({ decision }: { decision: SentinelDecision }) {
  const context = decision.budget_context;
  const usedPercent = Math.min(100, ((context.spent_today_usd + context.this_tx_usd) / context.daily_limit_usd) * 100);
  return (
    <section className="border border-border bg-base p-4">
      <div className="flex flex-wrap justify-between gap-3 font-mono text-xs text-muted">
        <span>Daily limit: ${context.daily_limit_usd}</span>
        <span>Spent: ${context.spent_today_usd}</span>
        <span>Remaining after: ${context.remaining_after_usd}</span>
      </div>
      <div className="mt-3 h-2 border border-border bg-surface">
        <div className="h-full bg-[var(--risk-medium)]" style={{ width: `${usedPercent}%` }} />
      </div>
    </section>
  );
}

function toAuditEntry(decision: SentinelDecision, wallet: string, prompt: string, value: number): AuditEntry {
  return {
    audit_id: decision.audit_id,
    timestamp: decision.timestamp,
    wallet,
    action_description: prompt,
    verdict: decision.verdict,
    deciding_rule: decision.deciding_rule.rule_id,
    tx_value_usd: value,
    agent_instruction: decision.agent_instruction
  };
}
