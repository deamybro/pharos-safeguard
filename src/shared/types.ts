export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type SimResult = "SUCCESS" | "LIKELY_FAIL" | "UNKNOWN";

export interface TransactionIntent {
  type:
    | "transfer"
    | "approval"
    | "contract_write"
    | "contract_read"
    | "deploy"
    | "batch_transfer"
    | "unknown";
  from?: string;
  to?: string;
  value?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  amount?: string;
  spender?: string;
  approvalAmount?: string;
  methodName?: string;
  data?: string;
  isUnlimitedApproval?: boolean;
  isStateChanging?: boolean;
  recipients?: { address: string; amount: string }[];
  rawPrompt?: string;
}

export interface RiskIssue {
  severity: RiskLevel;
  code: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface BalanceResult {
  native_balance: string;
  token_balance?: string;
  sufficient: boolean;
  details: string;
  nativeBalanceWei?: bigint;
  tokenBalanceBaseUnits?: bigint;
  requiredNativeWei?: bigint;
  requiredTokenBaseUnits?: bigint;
}

export interface GasResult {
  gas_estimate: string;
  gas_sufficient: boolean;
  gas_units?: bigint;
  gas_cost_wei?: bigint;
  highGas?: boolean;
  details: string;
}

export interface SimulationReport {
  result: SimResult;
  details: string;
}

export interface PreFlightReport {
  mode: "preflight";
  input_summary: string;
  risk_level: RiskLevel;
  issues: RiskIssue[];
  gas_estimate: string;
  gas_sufficient: boolean;
  balance_check: {
    native_balance: string;
    token_balance?: string;
    sufficient: boolean;
    details: string;
  };
  simulation_result: SimResult;
  simulation_details: string;
  safe_to_execute: boolean;
  requires_confirmation: boolean;
  recommendation: string;
  human_explanation: string;
  actions?: ActionItem[];
  timestamp: string;
}

export interface WalletApproval {
  token_address: string;
  token_symbol: string;
  token_name: string;
  spender_address: string;
  spender_label?: string;
  allowance: string;
  is_unlimited: boolean;
  risk_level: RiskLevel;
  last_used_block?: number;
  revoke_tx?: object;
}

export interface WalletScanReport {
  mode: "walletscan";
  wallet_address: string;
  data_status: "LIVE" | "UNAVAILABLE";
  data_warnings: string[];
  scan_coverage: {
    latest_block?: number;
    token_and_approval_window_blocks: number;
    transaction_history_window_blocks: number;
  };
  risk_score: number;
  risk_level: RiskLevel;
  portfolio_summary: {
    native_balance: string;
    native_usd?: string;
    tokens: TokenBalance[];
    total_usd?: string;
  };
  approvals: WalletApproval[];
  dangerous_approvals: WalletApproval[];
  tx_anomalies: TxAnomaly[];
  recommendations: string[];
  actions: ActionItem[];
  timestamp: string;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usd_value?: string;
}

export interface TxAnomaly {
  tx_hash: string;
  type: string;
  description: string;
  severity: RiskLevel;
}

export interface ActionItem {
  id: string;
  label: string;
  description: string;
  tx_data?: object;
  requires_confirmation: boolean;
}

export interface SkillInput {
  prompt: string;
  walletAddress?: string;
  txData?: {
    to?: string;
    from?: string;
    value?: string;
    data?: string;
  };
}

// --- SENTINEL TYPES ----------------------------------------------------------

export type SentinelVerdict = "APPROVED" | "REJECTED" | "CONFIRMATION_REQUIRED";

export type ActionType =
  | "transfer"
  | "approval"
  | "contract_write"
  | "contract_read"
  | "deploy"
  | "batch_transfer"
  | "bridge"
  | "swap"
  | "stake"
  | "unstake"
  | "unknown";

export interface Constitution {
  version: string;
  wallet: string;
  created_at: string;
  spending_limits: {
    max_single_tx_usd: number;
    max_daily_spend_usd: number;
    max_single_tx_native: string;
    require_confirmation_above_usd: number;
    auto_approve_below_usd: number;
  };
  contract_rules: {
    allow_unverified_contracts: boolean;
    blocked_addresses: string[];
    allowed_addresses: string[];
    require_confirmation_for_new_contracts: boolean;
  };
  gas_rules: {
    max_gas_price_gwei: number;
    max_gas_cost_native: string;
  };
  action_rules: {
    allow_unlimited_approvals: boolean;
    allow_contract_deployment: boolean;
    allow_batch_transfers: boolean;
    max_batch_recipients: number;
    allow_cross_chain_actions: boolean;
    blocked_action_types: ActionType[];
    allowed_action_types: ActionType[];
  };
  mission: {
    description: string;
  };
  escalation: {
    require_2fa_above_usd: number;
  };
}

export interface RuleResult {
  rule_id: string;
  verdict: SentinelVerdict;
  title: string;
  explanation: string;
  agent_message: string;
  values?: { actual: string; limit: string };
}

export interface BudgetContext {
  daily_limit_usd: number;
  spent_today_usd: number;
  this_tx_usd: number;
  remaining_after_usd: number;
  would_exceed: boolean;
}

export interface SentinelDecision {
  mode: "sentinel";
  verdict: SentinelVerdict;
  verdict_color: "green" | "red" | "amber";
  deciding_rule: RuleResult;
  all_rules_checked: RuleResult[];
  rules_triggered: RuleResult[];
  budget_context: BudgetContext;
  agent_instruction: string;
  user_summary: string;
  confirmation_prompt?: string;
  timestamp: string;
  audit_id: string;
}

export interface SentinelInput {
  agent_action: {
    description: string;
    intent: TransactionIntent;
    estimated_usd_value?: number;
  };
  wallet: string;
  constitution: Constitution;
}

export interface AuditEntry {
  audit_id: string;
  timestamp: string;
  wallet: string;
  action_description: string;
  verdict: SentinelVerdict;
  deciding_rule: string;
  tx_value_usd: number;
  agent_instruction: string;
}
