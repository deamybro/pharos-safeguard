# Pharos SafeGuard - Natural Language Prompt Examples

## PreFlight Mode

### Basic Transfer
"PreFlight: send 50 PHRS to 0x742d35cc6634c0532925a3b844bc454e4438f44e from my wallet 0xabc0000000000000000000000000000000000000"

### Token Approval
"Check if it's safe to approve USDC to Pharos DEX router 0xDEADBEEF00000000000000000000000000000000"

### Unlimited Approval Check
"Before I run this: approve(0xDEADBEEF00000000000000000000000000000000, 115792089237316195423570985008687907853269984665640564039457584007913129639935)"

### Batch Transfer Audit
"Audit this airdrop list before I run it: send 100 USDC to 0x1111111111111111111111111111111111111111, 0x2222222222222222222222222222222222222222, 0x3333333333333333333333333333333333333333"

### Contract Interaction
"I want to call withdraw(100e18) on contract 0xDEADBEEF00000000000000000000000000000000 - check it first"

## WalletScan Mode

### Quick Audit
"Scan 0x742d35cc6634c0532925a3b844bc454e4438f44e for risks"

### Full Security Check
"Full security audit of my wallet 0x742d35cc6634c0532925a3b844bc454e4438f44e"

### Approval Focus
"What contracts have approval to spend my tokens?"

### Post-Transaction Check
"I just interacted with a new DeFi protocol - check if my wallet is still safe"
