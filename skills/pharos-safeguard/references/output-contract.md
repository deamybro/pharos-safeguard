# SafeGuard Decision Package

Every invocation returns:

- `skill`: always `pharos-safeguard`.
- `skill_version`: identifies the installed engine version.
- `output_schema_version`: identifies the response contract.
- `network`: the network used for live checks.
- `requested_mode`: the deterministic requested mode or `auto`.
- `decision`: the selected mode's deterministic result.
- `execution_policy`: proof that invocation did not broadcast a transaction.

## PreFlight

Use `risk_level`, `issues`, `gas_estimate`, `balance_check`, `simulation_result`, `safe_to_execute`, and `requires_confirmation` as the decision evidence. A write may proceed only when `safe_to_execute` is true and the user confirms it in a wallet.

## WalletScan

Use `data_status`, `data_warnings`, `scan_coverage`, `risk_score`, `risk_level`, `portfolio_summary`, `dangerous_approvals`, `tx_anomalies`, and `recommendations`. A result with `data_status: UNAVAILABLE` is unresolved and must not be described as safe. Describe clean results within the reported scan coverage rather than as an all-time guarantee. Entries in `actions` are prepared revoke transactions only; they are never automatically submitted.

## Sentinel

Use `verdict`, `deciding_rule`, `rules_triggered`, `budget_context`, `agent_instruction`, and `audit_id`. The agent must obey:

- `APPROVED`: policy permits proceeding, subject to wallet confirmation for writes.
- `CONFIRMATION_REQUIRED`: stop and request explicit user approval.
- `REJECTED`: stop. Do not offer to bypass the deciding rule.
