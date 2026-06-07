import { runSafeGuard } from "../index";
import { batchAuditScenario } from "./scenarios/batch-audit";
import { riskyApprovalScenario } from "./scenarios/risky-approval";
import { safeTransferScenario } from "./scenarios/safe-transfer";

async function main() {
  const scenarios = [safeTransferScenario, riskyApprovalScenario, batchAuditScenario];

  for (const scenario of scenarios) {
    const result = await runSafeGuard(scenario);
    console.log(result);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
