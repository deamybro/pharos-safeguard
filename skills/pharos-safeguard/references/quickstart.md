# Pharos SafeGuard Quick Start

## Verify Installation

From the installed Skill directory:

```bash
node scripts/doctor.mjs
```

A fully ready installation returns `ready: true` and `rpc_status: LIVE`. If RPC is unavailable, grant the agent network access and rerun the check.

## Natural-Language Examples

Sentinel:

```text
Use $pharos-safeguard in Sentinel mode to evaluate whether my agent can send 600 USDC from policy wallet 0x... using the standard constitution. Estimated USD value: 600.
```

WalletScan:

```text
Use $pharos-safeguard in WalletScan mode to scan 0x... for live balances, approvals, and risks.
```

PreFlight:

```text
Use $pharos-safeguard in PreFlight mode to simulate sending 0.001 PHRS from 0x... to 0x....
```

Users do not need to mention internal commands. The agent must execute the bundled engine with the explicitly requested mode.

## Direct Runner

```bash
node scripts/invoke.mjs --mode sentinel --prompt "Can my agent send 600 USDC?" --wallet 0x... --usd 600 --constitution standard
```

SafeGuard is read-only by default and never broadcasts from Skill invocation.
