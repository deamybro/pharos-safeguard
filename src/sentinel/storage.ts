import fs from "fs";
import os from "os";
import path from "path";

let resolvedDataDir: string | undefined;

export function getDataFile(filename: string): string {
  return path.join(getDataDir(), filename);
}

function getDataDir(): string {
  if (resolvedDataDir) {
    return resolvedDataDir;
  }

  const candidates = [
    process.env.PHAROS_SAFEGUARD_DATA_DIR,
    path.join(process.cwd(), ".pharos-safeguard-data"),
    path.join(os.tmpdir(), "pharos-safeguard")
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      const probe = path.join(candidate, ".write-test");
      fs.writeFileSync(probe, "ok");
      fs.unlinkSync(probe);
      resolvedDataDir = candidate;
      return candidate;
    } catch {
      // Try the next writable location.
    }
  }

  throw new Error("No writable SafeGuard data directory is available.");
}
