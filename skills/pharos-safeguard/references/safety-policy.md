# SafeGuard Safety Policy

1. SafeGuard is read-only by default and never broadcasts from skill invocation.
2. Every state-changing transaction requires explicit confirmation in the user's connected wallet.
3. A Sentinel `REJECTED` verdict is final for the current request.
4. A Sentinel `CONFIRMATION_REQUIRED` verdict must pause execution.
5. Unknown or unavailable live-chain evidence is not treated as success.
6. Revoke actions must show token, spender, and zero-allowance calldata before confirmation.
7. Never silently switch networks or claim mainnet execution while configured for Atlantic Testnet.
