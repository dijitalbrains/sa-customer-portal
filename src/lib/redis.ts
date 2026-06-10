import "server-only";
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

function createRedisClient() {
  return new Redis(process.env.REDIS_URL!, {
    db: Number(process.env.REDIS_DB ?? 0),
    family: 4,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
}

if (!globalForRedis.redis) {
  globalForRedis.redis = createRedisClient();
}

export const redis = globalForRedis.redis;

export const REDIS_PREFIX = process.env.REDIS_KEY_PREFIX ?? "sa_customer_portal:";
export const CART_TTL_SECONDS = Number(process.env.CART_TTL_SECONDS ?? 7200);
