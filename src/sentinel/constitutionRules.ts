import { Constitution, RuleResult, SentinelInput } from "../shared/types";

const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export function checkBlockedAddress(input: SentinelInput, c: Constitution): RuleResult | null {
  const target = input.agent_action.intent.to || input.agent_action.intent.tokenAddress;
  if (!target) {
    return null;
  }

  const isBlocked = c.contract_rules.blocked_addresses.map((address) => address.toLowerCase()).includes(target.toLowerCase());
  if (!isBlocked) {
    return null;
  }

  return result(
    "BLOCKED_ADDRESS",
    "REJECTED",
    "Blocked address",
    `Address ${target} is on your blocked list.`,
    `Action blocked. Address ${target} is explicitly blocked by the wallet constitution. Do not proceed.`
  );
}

export function checkUnlimitedApproval(input: SentinelInput, c: Constitution): RuleResult | null {
  if (input.agent_action.intent.type !== "approval") {
    return null;
  }

  const amount = input.agent_action.intent.approvalAmount;
  if (!amount || c.action_rules.allow_unlimited_approvals) {
    return null;
  }

  let isUnlimited = false;
  try {
    isUnlimited = BigInt(amount) >= MAX_UINT256;
  } catch {
    return null;
  }

  if (!isUnlimited) {
    return null;
  }

  return result(
    "UNLIMITED_APPROVAL_BLOCKED",
    "REJECTED",
    "Unlimited approval blocked",
    "Your constitution blocks unlimited (MaxUint256) token approvals.",
    "Unlimited approval rejected by constitution. Use a specific amount instead."
  );
}

export function checkUnverifiedContract(input: SentinelInput, c: Constitution, isVerified: boolean): RuleResult | null {
  if (c.contract_rules.allow_unverified_contracts || isVerified) {
    return null;
  }

  const target = input.agent_action.intent.to;
  if (!target || !["approval", "contract_write", "deploy"].includes(input.agent_action.intent.type)) {
    return null;
  }

  return result(
    "UNVERIFIED_CONTRACT_BLOCKED",
    "REJECTED",
    "Unverified contract",
    `Contract ${target} has no verified source code.`,
    "Action blocked. Contract is unverified and your constitution requires verified contracts."
  );
}

export function checkDeployBlocked(input: SentinelInput, c: Constitution): RuleResult | null {
  if (input.agent_action.intent.type !== "deploy" || c.action_rules.allow_contract_deployment) {
    return null;
  }

  return result(
    "DEPLOY_BLOCKED",
    "REJECTED",
    "Contract deployment blocked",
    "Your constitution does not allow contract deployment.",
    "Deploy action blocked by constitution. Deployment is disabled."
  );
}

export function checkBatchBlocked(input: SentinelInput, c: Constitution): RuleResult | null {
  if (input.agent_action.intent.type !== "batch_transfer" || c.action_rules.allow_batch_transfers) {
    return null;
  }

  return result(
    "BATCH_BLOCKED",
    "REJECTED",
    "Batch transfers blocked",
    "Your constitution does not allow batch transfers.",
    "Batch transfer blocked by constitution."
  );
}

export function checkBatchSize(input: SentinelInput, c: Constitution): RuleResult | null {
  const recipients = input.agent_action.intent.recipients;
  if (!recipients || recipients.length <= c.action_rules.max_batch_recipients) {
    return null;
  }

  return {
    ...result(
      "BATCH_SIZE_EXCEEDED",
      "REJECTED",
      "Batch too large",
      `${recipients.length} recipients exceeds your limit of ${c.action_rules.max_batch_recipients}.`,
      `Batch blocked. ${recipients.length} recipients exceeds constitution limit of ${c.action_rules.max_batch_recipients}.`
    ),
    values: { actual: String(recipients.length), limit: String(c.action_rules.max_batch_recipients) }
  };
}

export function checkActionTypeBlocked(input: SentinelInput, c: Constitution): RuleResult | null {
  const type = input.agent_action.intent.type;
  if (!c.action_rules.blocked_action_types.includes(type)) {
    return null;
  }

  return result(
    "ACTION_TYPE_BLOCKED",
    "REJECTED",
    `Action type blocked: ${type}`,
    `Your constitution blocks all "${type}" actions.`,
    `Action type "${type}" is blocked by constitution.`
  );
}

export function checkSingleTxLimit(input: SentinelInput, c: Constitution): RuleResult | null {
  const usd = input.agent_action.estimated_usd_value;
  if (usd === undefined || usd <= c.spending_limits.max_single_tx_usd) {
    return null;
  }

  return {
    ...result(
      "SINGLE_TX_LIMIT_EXCEEDED",
      "REJECTED",
      "Single transaction limit exceeded",
      `$${usd} exceeds your single transaction limit of $${c.spending_limits.max_single_tx_usd}.`,
      `Transaction blocked. $${usd} exceeds the constitution limit of $${c.spending_limits.max_single_tx_usd} per transaction.`
    ),
    values: { actual: `$${usd}`, limit: `$${c.spending_limits.max_single_tx_usd}` }
  };
}

export function checkDailyBudget(input: SentinelInput, c: Constitution, spentToday: number): RuleResult | null {
  const usd = input.agent_action.estimated_usd_value || 0;
  const total = spentToday + usd;
  if (total <= c.spending_limits.max_daily_spend_usd) {
    return null;
  }

  return {
    ...result(
      "DAILY_BUDGET_EXCEEDED",
      "REJECTED",
      "Daily budget exceeded",
      `This would bring today's total to $${total.toFixed(2)}, exceeding your $${c.spending_limits.max_daily_spend_usd} daily limit.`,
      `Daily budget would be exceeded. Spent: $${spentToday}. Limit: $${c.spending_limits.max_daily_spend_usd}.`
    ),
    values: { actual: `$${total.toFixed(2)}`, limit: `$${c.spending_limits.max_daily_spend_usd}` }
  };
}

export function checkAutoApprove(input: SentinelInput, c: Constitution): RuleResult | null {
  const usd = input.agent_action.estimated_usd_value;
  if (usd === undefined || usd > c.spending_limits.auto_approve_below_usd) {
    return null;
  }

  return result(
    "AUTO_APPROVED",
    "APPROVED",
    "Auto-approved",
    `$${usd} is below your auto-approve threshold of $${c.spending_limits.auto_approve_below_usd}.`,
    "Auto-approved. Amount is within the automatic approval threshold."
  );
}

export function checkConfirmationThreshold(input: SentinelInput, c: Constitution): RuleResult | null {
  const usd = input.agent_action.estimated_usd_value;
  const threshold =
    input.agent_action.intent.type === "approval"
      ? c.spending_limits.auto_approve_below_usd
      : c.spending_limits.require_confirmation_above_usd;
  if (usd === undefined || usd <= threshold) {
    return null;
  }

  return {
    ...result(
      "ABOVE_CONFIRMATION_THRESHOLD",
      "CONFIRMATION_REQUIRED",
      "Confirmation required",
      `$${usd} exceeds the applicable confirmation threshold of $${threshold}.`,
      `Human confirmation required. Amount $${usd} is above the $${threshold} threshold.`
    ),
    values: { actual: `$${usd}`, limit: `$${threshold}` }
  };
}

export function checkNewContract(input: SentinelInput, c: Constitution, isFirstInteraction: boolean): RuleResult | null {
  if (!c.contract_rules.require_confirmation_for_new_contracts || !isFirstInteraction) {
    return null;
  }

  if (!["approval", "contract_write", "deploy", "unknown"].includes(input.agent_action.intent.type)) {
    return null;
  }

  const target = input.agent_action.intent.to || "the requested contract";
  return result(
    "FIRST_CONTRACT_INTERACTION",
    "CONFIRMATION_REQUIRED",
    "First interaction with contract",
    `This is your first interaction with ${target}.`,
    "Pausing for confirmation - first interaction with this contract address."
  );
}

function result(
  rule_id: string,
  verdict: RuleResult["verdict"],
  title: string,
  explanation: string,
  agent_message: string
): RuleResult {
  return { rule_id, verdict, title, explanation, agent_message };
}
