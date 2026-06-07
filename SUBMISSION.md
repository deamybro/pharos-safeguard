# Pharos SafeGuard Skill Submission

## Skill Name

Pharos SafeGuard

## Short Description

Pharos SafeGuard is an AI-agent onchain safety Skill for Pharos Atlantic Testnet. It protects users before and after onchain actions through three modes:

- **Sentinel** enforces a user-defined wallet constitution and returns `APPROVED`, `CONFIRMATION_REQUIRED`, or `REJECTED`.
- **WalletScan** audits live balances, token approvals, dangerous allowances, and transaction anomalies.
- **PreFlight** checks balances, estimates gas, simulates proposed transactions, and scores risk before execution.

SafeGuard is read-only by default. It never signs or broadcasts a transaction from Skill invocation, and every write action requires explicit wallet confirmation.

Examples:

- "Can my agent send 600 USDC under my standard constitution?"
- "Scan this wallet for dangerous approvals."
- "Simulate sending 0.001 PHRS before execution."
- "Can my agent grant this unlimited token approval?"

Flow: User Request -> Mode Selection -> Live Pharos Evidence / Constitution Rules -> Safety Verdict -> Human Confirmation Gate

## GitHub Link

https://github.com/deamybro/pharos-safeguard

## How to Use

Clone the repository:

```bash
git clone https://github.com/deamybro/pharos-safeguard.git
cd pharos-safeguard
```

Verify the standalone Skill and Pharos connection:

```bash
node skills/pharos-safeguard/scripts/doctor.mjs
```

Invoke it from an AI agent:

```text
Use $pharos-safeguard in Sentinel mode to evaluate whether my agent can send 600 USDC from policy wallet 0x... using the standard constitution. Estimated USD value: 600.
```

```text
Use $pharos-safeguard in WalletScan mode to scan 0x... for live balances, token approvals, dangerous approvals, and risks.
```

```text
Use $pharos-safeguard in PreFlight mode to simulate sending 0.001 PHRS from 0x... to 0x....
```

Direct standalone invocation:

```bash
node skills/pharos-safeguard/scripts/invoke.mjs --mode sentinel --prompt "Can my agent send 600 USDC?" --wallet 0x... --usd 600 --constitution standard
```

Optional dashboard:

```bash
npm install
npm run dev
```

## Supported Framework

- Pharos Skill Engine
- Codex/OpenAI-compatible Skills
- Claude-compatible Skill folders
- JavaScript/TypeScript and stdio consumers
- Optional Next.js dashboard

## Notes

- Read-only by default; no private key required
- Deterministic JSON output for agent pipelines
- Explicit `preflight`, `walletscan`, and `sentinel` modes
- Built-in installation and network health check
- Live Pharos Atlantic Testnet support, Chain ID `688689`
- WalletScan reports live-data status and exact historical scan coverage
- Standalone Skill requires Node.js 18+ and no npm install
- Dashboard requires npm install
- Current release: SafeGuard `v1.1.1`

## Email

YOUR_EMAIL_HERE

## Demo Video

YOUR_DEMO_VIDEO_LINK_HERE
