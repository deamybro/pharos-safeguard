import { NextResponse } from "next/server";
import { parseIntent } from "@/src/preflight/intentParser";
import { Constitution, TransactionIntent } from "@/src/shared/types";
import { ConstitutionPreset, getConstitution } from "@/src/sentinel/constitution";
import { evaluate } from "@/src/sentinel/decisionEngine";

interface SentinelRequest {
  prompt?: string;
  walletAddress?: string;
  estimatedUsdValue?: number;
  constitutionPreset?: ConstitutionPreset;
  customConstitution?: Constitution;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SentinelRequest;
    if (!body.prompt || !body.walletAddress) {
      return NextResponse.json({ error: "prompt and walletAddress are required" }, { status: 400 });
    }

    const intent = parseSentinelIntent(body.prompt, body.walletAddress);
    const constitution = getConstitution(body.walletAddress, body.constitutionPreset, body.customConstitution);
    const decision = await evaluate({
      agent_action: {
        description: body.prompt,
        intent,
        estimated_usd_value: body.estimatedUsdValue
      },
      wallet: body.walletAddress,
      constitution
    });

    return NextResponse.json(decision);
  } catch (error) {
    console.error("[Sentinel API]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

function parseSentinelIntent(prompt: string, walletAddress: string): TransactionIntent {
  const intent = parseIntent(prompt, walletAddress);
  if (prompt.toLowerCase().includes("deploy")) {
    return { ...intent, type: "deploy", isStateChanging: true };
  }

  return intent;
}
