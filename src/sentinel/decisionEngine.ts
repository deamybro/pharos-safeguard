import { v4 as uuidv4 } from "uuid";
import {
  BudgetContext,
  Constitution,
  RuleResult,
  SentinelDecision,
  SentinelInput,
  SentinelVerdict
} from "../shared/types";
import { append } from "./auditLog";
import { getTodaySpend } from "./budgetTracker";
import * as Rules from "./constitutionRules";

export async function evaluate(input: SentinelInput): Promise<SentinelDecision> {
  const { constitution, wallet } = input;
  const usd = input.agent_action.estimated_usd_value || 0;
  const spentToday = getTodaySpend(wallet);
  const isVerified = constitution.contract_rules.allowed_addresses.some(
    (address) => address.toLowerCase() === input.agent_action.intent.to?.toLowerCase()
  );
  const isFirstInteraction = true;

  const hardRules = [
    Rules.checkBlockedAddress(input, constitution),
    Rules.checkUnlimitedApproval(input, constitution),
    Rules.checkUnverifiedContract(input, constitution, isVerified),
    Rules.checkDeployBlocked(input, constitution),
    Rules.checkBatchBlocked(input, constitution),
    Rules.checkBatchSize(input, constitution),
    Rules.checkActionTypeBlocked(input, constitution),
    Rules.checkSingleTxLimit(input, constitution),
    Rules.checkDailyBudget(input, constitution, spentToday)
  ].filter((rule): rule is RuleResult => Boolean(rule));

  const rejection = hardRules.find((rule) => rule.verdict === "REJECTED");
  if (rejection) {
    return buildDecision("REJECTED", rejection, hardRules, usd, spentToday, constitution, wallet, input.agent_action.description);
  }

  const autoApprove = Rules.checkAutoApprove(input, constitution);
  if (autoApprove) {
    return buildDecision("APPROVED", autoApprove, [...hardRules, autoApprove], usd, spentToday, constitution, wallet, input.agent_action.description);
  }

  const softRules = [
    Rules.checkConfirmationThreshold(input, constitution),
    Rules.checkNewContract(input, constitution, isFirstInteraction)
  ].filter((rule): rule is RuleResult => Boolean(rule));

  const allChecked = [...hardRules, ...softRules];
  const confirmRule = softRules.find((rule) => rule.verdict === "CONFIRMATION_REQUIRED");
  if (confirmRule) {
    return buildDecision("CONFIRMATION_REQUIRED", confirmRule, allChecked, usd, spentToday, constitution, wallet, input.agent_action.description);
  }

  const approvedRule: RuleResult = {
    rule_id: "ALL_CLEAR",
    verdict: "APPROVED",
    title: "All rules passed",
    explanation: "Action is within all constitution limits.",
    agent_message: "All constitution checks passed. Proceed with execution."
  };
  return buildDecision("APPROVED", approvedRule, [...allChecked, approvedRule], usd, spentToday, constitution, wallet, input.agent_action.description);
}

function buildDecision(
  verdict: SentinelVerdict,
  decidingRule: RuleResult,
  allChecked: RuleResult[],
  usd: number,
  spentToday: number,
  constitution: Constitution,
  wallet: string,
  actionDescription: string
): SentinelDecision {
  const auditId = uuidv4();
  const dailyLimit = constitution.spending_limits.max_daily_spend_usd;
  const budgetContext: BudgetContext = {
    daily_limit_usd: dailyLimit,
    spent_today_usd: spentToday,
    this_tx_usd: usd,
    remaining_after_usd: Math.max(0, dailyLimit - spentToday - usd),
    would_exceed: spentToday + usd > dailyLimit
  };

  const decision: SentinelDecision = {
    mode: "sentinel",
    verdict,
    verdict_color: verdict === "APPROVED" ? "green" : verdict === "REJECTED" ? "red" : "amber",
    deciding_rule: decidingRule,
    all_rules_checked: allChecked,
    rules_triggered: allChecked.filter((rule) => rule.verdict !== "APPROVED"),
    budget_context: budgetContext,
    agent_instruction: decidingRule.agent_message,
    user_summary: decidingRule.explanation,
    confirmation_prompt:
      verdict === "CONFIRMATION_REQUIRED"
        ? `Your agent wants to: "${actionDescription}". Do you approve this action?`
        : undefined,
    timestamp: new Date().toISOString(),
    audit_id: auditId
  };

  append(wallet, {
    audit_id: auditId,
    timestamp: decision.timestamp,
    wallet,
    action_description: actionDescription,
    verdict,
    deciding_rule: decidingRule.rule_id,
    tx_value_usd: usd,
    agent_instruction: decidingRule.agent_message
  });

  return decision;
}
