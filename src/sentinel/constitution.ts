import fs from "fs";
import path from "path";
import { Constitution } from "../shared/types";

const CONSTITUTIONS_DIR = path.join(process.cwd(), "constitutions");

export type ConstitutionPreset = "conservative" | "standard" | "developer";

export function loadPreset(preset: ConstitutionPreset): Constitution {
  const file = path.join(CONSTITUTIONS_DIR, `${preset}.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as Constitution;
}

export function loadCustom(walletAddress: string): Constitution | null {
  const file = path.join(CONSTITUTIONS_DIR, `custom-${walletAddress.toLowerCase()}.json`);
  if (!fs.existsSync(file)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(file, "utf-8")) as Constitution;
}

export function saveCustom(walletAddress: string, constitution: Constitution): void {
  if (!fs.existsSync(CONSTITUTIONS_DIR)) {
    fs.mkdirSync(CONSTITUTIONS_DIR, { recursive: true });
  }

  const file = path.join(CONSTITUTIONS_DIR, `custom-${walletAddress.toLowerCase()}.json`);
  fs.writeFileSync(file, JSON.stringify(constitution, null, 2));
}

export function getConstitution(
  wallet: string,
  preset?: ConstitutionPreset,
  custom?: Constitution
): Constitution {
  if (custom) {
    return custom;
  }

  const saved = loadCustom(wallet);
  if (saved) {
    return saved;
  }

  return loadPreset(preset || "standard");
}
