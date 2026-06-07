---
name: pharos-safeguard
description: Analyze Pharos onchain actions before execution, audit wallets for dangerous approvals, and enforce wallet constitutions through Sentinel. Use for transaction simulation, wallet safety scans, approval review, agent spending-policy checks, and any request to determine whether a Pharos action should proceed.
---

# Pharos SafeGuard

Use SafeGuard as the final safety layer before an onchain action.

1. Select the mode from the user's request:
   - **PreFlight** for a proposed transaction, approval, transfer, contract call, or batch.
   - **WalletScan** for wallet health, assets, approvals, anomalies, or revoke preparation.
   - **Sentinel** for an autonomous-agent action that must satisfy a wallet constitution.
   - Treat an explicitly requested mode as authoritative.
2. Ask for a wallet address only when the selected check needs one.
3. Run the deterministic engine from the installed Skill directory:
   ```bash
   npm run skill -- --prompt "<user request>" --wallet <address> --usd <estimated-usd-value> --constitution standard
   ```
4. Return the JSON decision package without weakening or overriding its verdict.
5. Never broadcast a transaction or revoke an approval from skill invocation. Require explicit user confirmation in a wallet UI for every write action.

Read [the output contract](skills/pharos-safeguard/references/output-contract.md) when mapping results into another agent workflow. Read [the safety policy](skills/pharos-safeguard/references/safety-policy.md) before preparing any executable action.
