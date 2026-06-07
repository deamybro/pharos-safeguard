import { runSafeGuard } from "./index";
import { getProvider } from "./shared/provider";

type Preset = "conservative" | "standard" | "developer";
type Mode = "preflight" | "walletscan" | "sentinel";

interface CliInput {
  prompt: string;
  mode?: Mode;
  walletAddress?: string;
  estimatedUsdValue?: number;
  constitutionPreset?: Preset;
  doctor?: boolean;
}

async function main() {
  const input = parseArgs(process.argv.slice(2));
  if (input.doctor) {
    await runDoctor();
    return;
  }

  if (!input.prompt) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const originalLog = console.log;
  console.log = () => undefined;

  let raw: string;
  try {
    raw = await runSafeGuard(input);
  } finally {
    console.log = originalLog;
  }

  const decision = JSON.parse(raw) as Record<string, unknown>;
  const output = {
    skill: "pharos-safeguard",
    skill_version: "1.1.1",
    output_schema_version: "1.2",
    network: "pharos-atlantic-testnet",
    requested_mode: input.mode || "auto",
    decision,
    execution_policy: {
      read_only_by_default: true,
      broadcast_performed: false,
      explicit_user_confirmation_required: true,
      note: "SafeGuard prepares decisions and transaction data but never broadcasts an action from skill invocation."
    }
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

function parseArgs(args: string[]): CliInput {
  const input: CliInput = { prompt: "" };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    switch (args[index]) {
      case "--prompt":
        input.prompt = value || "";
        index += 1;
        break;
      case "--mode":
        if (value === "preflight" || value === "walletscan" || value === "sentinel") {
          input.mode = value;
        }
        index += 1;
        break;
      case "--wallet":
        input.walletAddress = value;
        index += 1;
        break;
      case "--usd":
        input.estimatedUsdValue = Number(value);
        index += 1;
        break;
      case "--constitution":
        if (value === "conservative" || value === "standard" || value === "developer") {
          input.constitutionPreset = value;
        }
        index += 1;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      case "--doctor":
        input.doctor = true;
        break;
    }
  }

  return input;
}

function printUsage() {
  process.stdout.write(
    [
      "Pharos SafeGuard skill runner",
      "",
      "Usage:",
      '  npm run skill -- --mode preflight|walletscan|sentinel --prompt "<request>" [--wallet <address>] [--usd <amount>] [--constitution conservative|standard|developer]',
      "  npm run skill -- --doctor",
      "",
      "Pass --mode for deterministic routing. Without it, SafeGuard infers the mode from the prompt."
    ].join("\n") + "\n"
  );
}

async function runDoctor() {
  const result = {
    skill: "pharos-safeguard",
    skill_version: "1.1.1",
    node_version: process.version,
    network: "pharos-atlantic-testnet",
    rpc_status: "UNAVAILABLE",
    latest_block: null as number | null,
    ready: false
  };

  try {
    result.latest_block = await getProvider().getBlockNumber();
    result.rpc_status = "LIVE";
    result.ready = true;
  } catch {
    // The structured result explains that network permission or connectivity is required.
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ error: message })}\n`);
  process.exitCode = 1;
});
