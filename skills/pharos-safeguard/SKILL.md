---
name: pharos-safeguard
description: Analyze Pharos onchain actions before execution, audit wallets for dangerous approvals, and enforce wallet constitutions through Sentinel. Use for transaction simulation, wallet safety scans, approval review, agent spending-policy checks, and any request to determine whether a Pharos action should proceed.
---

# Pharos SafeGuard

Use SafeGuard as the final safety layer before an onchain action.

## Workflow

1. Choose exactly one mode:
   - **PreFlight**: proposed transfer, approval, contract call, deployment, or batch action.
   - **WalletScan**: wallet health, token assets, dangerous approvals, anomalies, or revoke preparation.
   - **Sentinel**: an agent action requiring constitution, budget, or confirmation checks.
   - Treat an explicit phrase such as "in Sentinel mode", "in WalletScan mode", or "in PreFlight mode" as authoritative.
2. Collect the wallet address when the chosen mode requires live wallet state.
3. Include an estimated USD value for Sentinel spending-policy checks.
4. From this Skill's directory, always execute the bundled engine:
   `node scripts/invoke.mjs --mode <preflight|walletscan|sentinel> --prompt "<request>" --wallet <address> --usd <value> --constitution standard`
5. Treat the engine JSON as authoritative. Never synthesize a result without running the command.
6. Return a concise explanation plus the complete safety-critical fields from the engine output. Do not reinterpret a rejected or confirmation-required verdict as approved.
7. For write actions, present the prepared action and require explicit wallet confirmation. Never broadcast from the skill.

## Decision Rules

- Treat unavailable RPC data, unknown simulation results, stale data, and invalid inputs as unresolved risk.
- Block or escalate unlimited approvals, failed simulations, insufficient balances, blocked action types, and constitution-limit violations.
- Preserve `requires_confirmation`, Sentinel verdicts, and execution-policy fields exactly.
- For WalletScan, always report `data_status`, `data_warnings`, `scan_coverage`, `native_balance`, and `risk_level`. Never describe a scan as safe unless `data_status` is `LIVE`, and describe findings within the reported coverage rather than as an all-time guarantee.
- Keep analysis on Pharos Atlantic Testnet unless the user explicitly supplies a supported network configuration.
- The included runner and engine bundle require Node.js 18+ but do not require `npm install`.

## Installation Check

Run `node scripts/doctor.mjs`. If `rpc_status` is `UNAVAILABLE`, request network access and rerun it. A ready installation returns `ready: true` and `rpc_status: LIVE`.

Read [references/quickstart.md](references/quickstart.md) for clean user examples, [references/output-contract.md](references/output-contract.md) for response fields, and [references/safety-policy.md](references/safety-policy.md) before preparing an executable action.
