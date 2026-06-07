import { NextResponse } from "next/server";
import { runWalletScan } from "@/src";

export async function POST(request: Request) {
  const body = (await request.json()) as { walletAddress?: string };
  if (!body.walletAddress) {
    return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
  }

  const report = await runWalletScan(body.walletAddress);
  return NextResponse.json(report);
}
