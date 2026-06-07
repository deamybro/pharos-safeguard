import { NextResponse } from "next/server";
import { runPreFlight } from "@/src";

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string; walletAddress?: string };
  if (!body.prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const report = await runPreFlight({ prompt: body.prompt, walletAddress: body.walletAddress });
  return NextResponse.json(report);
}
