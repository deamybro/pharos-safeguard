"use client";

import { ScanLine, ShieldAlert, ShieldCheck } from "lucide-react";

interface ModeSelectorProps {
  mode: "preflight" | "walletscan" | "sentinel";
  onModeChange: (mode: "preflight" | "walletscan" | "sentinel") => void;
}

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid gap-3">
      <button
        className={modeButton(mode === "preflight")}
        onClick={() => onModeChange("preflight")}
        aria-pressed={mode === "preflight"}
      >
        <ShieldCheck className="h-5 w-5" aria-hidden />
        <span>
          <span className="block font-mono text-sm text-white">PRE-FLIGHT</span>
          <span className="block text-xs text-muted">Check before execution</span>
        </span>
      </button>
      <button
        className={modeButton(mode === "walletscan")}
        onClick={() => onModeChange("walletscan")}
        aria-pressed={mode === "walletscan"}
      >
        <ScanLine className="h-5 w-5" aria-hidden />
        <span>
          <span className="block font-mono text-sm text-white">WALLET SCAN</span>
          <span className="block text-xs text-muted">Audit existing approvals</span>
        </span>
      </button>
      <button
        className={modeButton(mode === "sentinel", true)}
        onClick={() => onModeChange("sentinel")}
        aria-pressed={mode === "sentinel"}
      >
        <ShieldAlert className="h-5 w-5" aria-hidden />
        <span>
          <span className="block font-mono text-sm text-white">SENTINEL</span>
          <span className="block text-xs text-muted">Agent guardrails</span>
        </span>
      </button>
    </div>
  );
}

function modeButton(active: boolean, sentinel = false): string {
  return [
    "flex min-h-24 items-center gap-3 border p-4 text-left transition",
    active
      ? sentinel
        ? "border-[var(--risk-medium)] bg-[var(--risk-medium-bg)]"
        : "border-pharos bg-[rgba(59,130,246,0.12)]"
      : "border-border bg-base hover:border-[var(--border-active)]"
  ].join(" ");
}
