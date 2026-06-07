import fs from "fs";
import { getDataFile } from "./storage";

function getBudgetFile(wallet: string): string {
  return getDataFile(`sentinel-budget-${wallet.toLowerCase()}.json`);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

interface BudgetFile {
  wallet: string;
  date: string;
  total_usd_spent: number;
  transactions: { hash?: string; usd_value: number; timestamp: string }[];
}

function load(wallet: string): BudgetFile {
  const file = getBudgetFile(wallet);
  if (!fs.existsSync(file)) {
    return { wallet, date: getToday(), total_usd_spent: 0, transactions: [] };
  }

  const data = JSON.parse(fs.readFileSync(file, "utf-8")) as BudgetFile;
  if (data.date !== getToday()) {
    return { wallet, date: getToday(), total_usd_spent: 0, transactions: [] };
  }

  return data;
}

export function getTodaySpend(wallet: string): number {
  return load(wallet).total_usd_spent;
}

export function recordSpend(wallet: string, usdValue: number, txHash?: string): void {
  const data = load(wallet);
  data.total_usd_spent += usdValue;
  data.transactions.push({ hash: txHash, usd_value: usdValue, timestamp: new Date().toISOString() });
  fs.writeFileSync(getBudgetFile(wallet), JSON.stringify(data, null, 2));
}

export function getRemainingBudget(wallet: string, dailyLimit: number): number {
  return Math.max(0, dailyLimit - getTodaySpend(wallet));
}
