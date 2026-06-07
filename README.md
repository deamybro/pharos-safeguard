# Pharos SafeGuard

Pharos SafeGuard is a three-mode onchain safety skill for Pharos Agent Center.

> Current network: Pharos Atlantic Testnet. SafeGuard is non-custodial and never broadcasts from Skill invocation.

- PreFlight checks, simulates, and risk-scores a transaction before execution.
- WalletScan audits an existing wallet for dangerous ERC20 approvals, risky positions, and remediation actions.
- Sentinel evaluates agent actions against a user-defined wallet constitution.

Tagline: "The only Pharos skill that protects your wallet before and after every onchain action."

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 and run one of the built-in demo prompts.

## Install As A Skill

Copy `skills/pharos-safeguard` into the Pharos Skill Engine skills directory, then invoke it as `$pharos-safeguard`. The copied Skill is standalone: its bundled engine requires Node.js 18+ but does not require the repository or `npm install`.

Download users can also extract `pharos-safeguard-skill.zip` directly into their agent's skills directory.

Verify a downloaded installation before first use:

```bash
node scripts/doctor.mjs
```

```text
Use $pharos-safeguard to check whether my agent may send 5 USDC, scan the wallet for dangerous approvals, and require confirmation before any write.
```

Run the deterministic skill backend directly:

```bash
npm run skill -- --mode sentinel --prompt "Can my agent send 5 USDC?" --wallet 0x7395E49d02fD4Fdb321CA69761F97bA698E44484 --usd 5
```

The invocation returns a structured decision package and never broadcasts a transaction. See `SUBMISSION.md` for the hackathon-ready listing.

Rebuild the standalone Skill bundle after changing the TypeScript engine:

```bash
npm run build:skill
```

To run the CLI-style demo:

```bash
npm run demo
```

## Usage With Claude Code

Use natural language prompts:

```text
PreFlight: approve USDC for 0xDEADBEEF00000000000000000000000000000000 with unlimited amount
```

```text
Scan my wallet 0x742d35cc6634c0532925a3b844bc454e4438f44e for risky approvals
```

The skill entry point is `runSafeGuard` in `src/index.ts`.

## Usage With OpenClaw

```json
{
  "skills": [
    {
      "name": "pharos-safeguard",
      "path": "./SKILL.md",
      "entry": "./src/index.ts",
      "network": "pharos-atlantic-testnet"
    }
  ]
}
```

## Risk Rules Reference

| Rule | Severity |
| --- | --- |
| UNLIMITED_APPROVAL | HIGH |
| UNVERIFIED_CONTRACT | MEDIUM |
| ZERO_ADDRESS | HIGH |
| ENTIRE_BALANCE | HIGH |
| HIGH_GAS | LOW |
| DUPLICATE_RECIPIENTS | LOW |
| INVALID_ADDRESS | HIGH |
| CONTRACT_WRITE | LOW |
| FAILED_SIMULATION | HIGH |
| INSUFFICIENT_BALANCE | HIGH |
| HIGH_VALUE_TRANSFER | MEDIUM |
| SELF_TRANSFER | LOW |
| SUSPICIOUS_BATCH_SIZE | MEDIUM |
| BATCH_INSUFFICIENT_FUNDS | MEDIUM |

Critical escalation occurs when failed simulation and insufficient balance are both present, or when an unlimited approval targets an unverified contract.

## Output Format

PreFlight returns a `PreFlightReport` with risk level, issues, gas estimate, balance check, simulation result, safety decision, recommendation, and action items.

WalletScan returns a `WalletScanReport` with portfolio summary, approvals, dangerous approvals, anomalies, risk score, recommendations, and revoke transaction data.

Example outputs live in `examples/`.

## Architecture

PreFlight pipeline:

1. Parse natural language into a `TransactionIntent`.
2. Check wallet balances.
3. Estimate gas.
4. Simulate with `eth_call`.
5. Run 14 risk rules.
6. Format a human-readable JSON report.

WalletScan pipeline:

1. Discover held ERC20 tokens from Transfer logs.
2. Discover spenders from Approval logs.
3. Read live allowances.
4. Risk-score approvals.
5. Generate `approve(spender, 0)` revoke calldata.

## Demo Video

Add Loom link here before submission.

## Contributing

Add new rules in `src/preflight/riskScanner.ts`, update `src/shared/riskRules.ts`, and add a scenario in `src/demo/scenarios/`. Keep every new rule deterministic and explain the user-facing recommendation.
