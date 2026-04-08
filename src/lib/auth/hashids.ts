import Hashids from "hashids";

const hashids = new Hashids(process.env.HASHIDS_SALT!);

export function decodeAutoLoginToken(token: string): {
  userId: number;
  adminId: number;
} | null {
  const decoded = hashids.decode(token);

  if (decoded.length < 2) {
    return null;
  }

  return {
    userId: Number(decoded[0]),
    adminId: Number(decoded[1]),
  };
}

export function encodeAutoLoginToken(
  userId: number,
  adminId: number = 0
): string {
  const rand = Math.floor(Math.random() * 90) + 10;
  return hashids.encode([userId, adminId, rand]);
}
