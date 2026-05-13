import "server-only";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CACHE_DIR = path.join(os.tmpdir(), "sa-customer-portal-cache");

interface Entry<T> {
  value: T;
  expiresAt: number | null;
}

export async function get<T>(key: string): Promise<T | null> {
  const file = pathFor(key);
  try {
    const raw = await fs.readFile(file, "utf8");
    const entry = JSON.parse(raw) as Entry<T>;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      await fs.unlink(file).catch(() => {});
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export async function set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const entry: Entry<T> = {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  };
  await fs.writeFile(pathFor(key), JSON.stringify(entry), "utf8");
}

export async function del(key: string): Promise<void> {
  await fs.unlink(pathFor(key)).catch(() => {});
}

function pathFor(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}
