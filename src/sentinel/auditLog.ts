import fs from "fs";
import { AuditEntry } from "../shared/types";
import { getDataFile } from "./storage";

function getLogFile(wallet: string): string {
  return getDataFile(`sentinel-audit-${wallet.toLowerCase()}.json`);
}

export function append(wallet: string, entry: AuditEntry): void {
  try {
    const file = getLogFile(wallet);
    const log: AuditEntry[] = fs.existsSync(file)
      ? (JSON.parse(fs.readFileSync(file, "utf-8")) as AuditEntry[])
      : [];
    log.unshift(entry);
    if (log.length > 200) {
      log.splice(200);
    }

    fs.writeFileSync(file, JSON.stringify(log, null, 2));
  } catch (error) {
    console.warn("[Sentinel Audit] Decision evaluated but audit persistence was unavailable.");
  }
}

export function getLast(wallet: string, count = 20): AuditEntry[] {
  const file = getLogFile(wallet);
  if (!fs.existsSync(file)) {
    return [];
  }

  const log = JSON.parse(fs.readFileSync(file, "utf-8")) as AuditEntry[];
  return log.slice(0, count);
}

export function clearLog(wallet: string): void {
  const file = getLogFile(wallet);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}
