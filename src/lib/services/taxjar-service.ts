import "server-only";

const TAXJAR_BASE_URL = "https://api.taxjar.com/v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface TaxJarAddress {
  zip: string;
  city: string;
  street: string;
  country: string;
}

interface CacheEntry {
  percent: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function getTaxJarPercent(address: TaxJarAddress): Promise<number> {
  const apiKey = process.env.TAXJAR_API_KEY;
  if (!apiKey) return 0;

  if (!isValidAddress(address)) return 0;

  const key = cacheKey(address);
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.percent;

  const percent = await fetchRate(address, apiKey);
  cache.set(key, { percent, expiresAt: now + CACHE_TTL_MS });
  return percent;
}

async function fetchRate(address: TaxJarAddress, apiKey: string): Promise<number> {
  const url = new URL(`${TAXJAR_BASE_URL}/rates/${encodeURIComponent(address.zip)}`);
  url.searchParams.set("city", address.city);
  url.searchParams.set("street", address.street);
  url.searchParams.set("country", address.country);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[taxjar] ${res.status} ${res.statusText}`);
      return 0;
    }
    const body = (await res.json()) as { rate?: { combined_rate?: string | number } };
    const combined = Number(body.rate?.combined_rate ?? 0);
    if (!Number.isFinite(combined)) return 0;
    return combined * 100;
  } catch (err) {
    console.error("[taxjar] fetch failed", err);
    return 0;
  }
}

function isValidAddress(address: TaxJarAddress): boolean {
  return Boolean(address.zip && address.city && address.street && address.country);
}

function cacheKey(a: TaxJarAddress): string {
  return `${a.country}|${a.zip}|${a.city}|${a.street}`.toLowerCase();
}
