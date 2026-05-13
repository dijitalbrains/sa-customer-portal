import crypto from "node:crypto";

export function hashObject(value: unknown): string {
  return crypto.createHash("md5").update(JSON.stringify(value)).digest("hex");
}
