import "server-only";
import HashidsService from "@/lib/hashids";
import type { AutoLoginToken } from "@/lib/types/auth";
import {
  AUTO_LOGIN_TOKEN_TTL_SECONDS,
  MIN_ISSUED_AT_UNIX_SECONDS,
} from "@/lib/constants/auth";

export function decodeAutoLoginToken(token: string): AutoLoginToken | null {
  const [userId, adminId, issuedAtElement] = HashidsService.decode(token);
  if (userId === undefined || adminId === undefined) {
    return null;
  }

  const issuedAt = readIssuedAt(issuedAtElement);
  if (hasExpired(issuedAt)) {
    return null;
  }

  return { userId, adminId, issuedAt };
}

function readIssuedAt(element: number | undefined): number | null {
  if (element === undefined || element < MIN_ISSUED_AT_UNIX_SECONDS) {
    return null;
  }
  return element;
}

function hasExpired(issuedAt: number | null): boolean {
  if (issuedAt === null) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - issuedAt > AUTO_LOGIN_TOKEN_TTL_SECONDS;
}
