# Hackathon Submission

**Skill name:**  
pharos-safeguard

**Short description:**  
Pharos SafeGuard is a three-mode onchain safety skill for Pharos Agent Center. PreFlight simulates and risk-scores proposed transactions, WalletScan audits live wallets and prepares approval revocations, and Sentinel approves, blocks, or escalates agent actions against user-defined wallet constitutions, budget limits, and confirmation gates.

**GitHub link:**  
https://github.com/deamybro/pharos-safeguard

**Email Address:**  
YOUR_EMAIL_HERE

**Demo link, video, or screenshots:**  
YOUR_DEMO_LINK_HERE

**Instructions on how to use the Skill:**

1. Download or clone the repository.
2. Copy `skills/pharos-safeguard` into the Pharos Skill Engine skills directory. No npm install is required for the standalone Skill.
3. Invoke the skill with a prompt such as:
   `"Use $pharos-safeguard to simulate this transfer before execution, scan my wallet for risky approvals, and apply Sentinel policy before any write."`
4. Or run the deterministic CLI:
   `npm run skill -- --mode sentinel --prompt "Can my agent send 5 USDC?" --wallet 0x... --usd 5`
5. Verify a standalone installation with:
   `node scripts/doctor.mjs`
6. The skill returns a structured decision package with live evidence, safety verdict, required confirmations, and an explicit no-broadcast execution policy.

**Optional functional checks:**  
`npm run typecheck`  
`npm run demo:skill:safe`  
`npm run demo:skill:unsafe`  
`npm run build`

**Supported framework:**  
Pharos Skill Engine, Codex/OpenAI-compatible Skills, JavaScript/TypeScript consumers, and the included Next.js demo dashboard.

**Additional notes or dependencies:**  
Node.js 18+ is required for the standalone Skill runner. No npm install is required. SafeGuard is read-only by default and never broadcasts a transaction from skill invocation. The current live-chain configuration targets Pharos Atlantic Testnet.
