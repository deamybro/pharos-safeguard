"use client";

import { ShieldX } from "lucide-react";
import { WalletApproval } from "@/src/shared/types";
import RiskBadge from "./RiskBadge";

export default function ApprovalRow({ approval, onRevoke }: { approval: WalletApproval; onRevoke: () => void }) {
  return (
    <div className="group grid gap-3 border border-border p-3 transition hover:border-[var(--border-active)] sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-white">{approval.token_symbol}</span>
          <span className="text-sm text-muted">to {approval.spender_address.slice(0, 8)}...{approval.spender_address.slice(-6)}</span>
          <RiskBadge level={approval.risk_level} />
        </div>
        <p className="mt-2 text-sm text-muted">
          {approval.is_unlimited ? "Unlimited" : approval.allowance} allowance. {approval.spender_label || "Unknown spender"}.
        </p>
      </div>
      <button
        onClick={onRevoke}
        className="inline-flex items-center justify-center gap-2 border border-border px-3 py-2 text-sm text-white opacity-100 transition hover:border-[var(--risk-high)] sm:opacity-0 sm:group-hover:opacity-100"
      >
        <ShieldX className="h-4 w-4" aria-hidden />
        Revoke
      </button>
    </div>
  );
}
