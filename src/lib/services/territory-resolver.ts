import "server-only";
import { prisma } from "@/lib/prisma";

export type FallbackModel = "Zipcode" | "City" | "State" | "Country";

export interface AddressLookup {
  countryId: number;
  stateId: number | null;
  city: string;
  zip: string;
}

interface TierPriceRow {
  quantity: number | null;
  shipping_price: number;
}

const ALL_FALLBACK_MODELS: FallbackModel[] = ["Zipcode", "City", "State", "Country"];

export async function resolveTierPrices(
  address: AddressLookup,
  productId: number,
): Promise<TierPriceRow[]> {
  const country = await loadCountry(address.countryId);
  if (!country) return [];

  for (const model of parseFallback(country.tier_fallback)) {
    const objectId = await resolveObjectId(model, address, country.code);
    if (!objectId) continue;

    const tier = await prisma.tiers.findFirst({
      where: { object: model, object_id: BigInt(objectId) },
      select: { tier: true },
    });
    if (!tier) continue;

    const rows = await prisma.tier_prices.findMany({
      where: {
        country_id: country.id,
        tier: tier.tier,
        product_id: productId,
        deleted_at: null,
      },
      select: { quantity: true, shipping_price: true },
    });
    if (rows.length > 0) return rows;
  }

  return [];
}

export async function resolveZone(address: AddressLookup): Promise<number> {
  const country = await loadCountry(address.countryId);
  if (!country) return -1;

  for (const model of parseFallback(country.zone_fallback)) {
    const objectId = await resolveObjectId(model, address, country.code);
    if (!objectId) continue;

    const row = await prisma.zones.findFirst({
      where: { object: model, object_id: BigInt(objectId), deleted_at: null },
      select: { zone: true },
    });
    if (row) return Number(row.zone);
  }

  return -1;
}

async function loadCountry(countryId: number) {
  return prisma.countries.findFirst({
    where: { id: countryId, deleted_at: null },
    select: { id: true, code: true, tier_fallback: true, zone_fallback: true },
  });
}

function parseFallback(value: unknown): FallbackModel[] {
  const list = Array.isArray(value) ? value : [];
  return list.filter((m): m is FallbackModel =>
    ALL_FALLBACK_MODELS.includes(m as FallbackModel),
  );
}

async function resolveObjectId(
  model: FallbackModel,
  address: AddressLookup,
  countryCode: string,
): Promise<number | null> {
  switch (model) {
    case "Zipcode": {
      const searchableZip = await getSearchableZip(countryCode, address.zip, address.countryId);
      const row = await prisma.zipcodes.findFirst({
        where: { zip: searchableZip, country_id: address.countryId },
        select: { id: true },
      });
      return row ? Number(row.id) : null;
    }
    case "City": {
      const row = await prisma.cities.findFirst({
        where: { name: address.city },
        select: { id: true },
      });
      return row ? Number(row.id) : null;
    }
    case "State": {
      if (address.stateId === null) return null;
      const row = await prisma.states.findFirst({
        where: { id: address.stateId },
        select: { id: true },
      });
      return row ? Number(row.id) : null;
    }
    case "Country": {
      return address.countryId;
    }
  }
}

async function getSearchableZip(
  countryCode: string,
  zip: string,
  countryId: number,
): Promise<string> {
  switch (countryCode) {
    case "CA":
    case "IE":
      return zip.substring(0, 3);
    case "PL":
      return zip.substring(0, 2);
    case "GB":
      return resolveGbZip(zip.replace(/\s+/g, ""), countryId);
    default:
      return zip;
  }
}

async function resolveGbZip(zip: string, countryId: number): Promise<string> {
  const exact = await prisma.zipcodes.findFirst({
    where: { zip, country_id: countryId },
    select: { id: true },
  });
  if (exact) return zip;

  if (zip.length > 3) {
    const trimmed = zip.substring(0, zip.length - 3);
    const trimmedMatch = await prisma.zipcodes.findFirst({
      where: { zip: trimmed, country_id: countryId },
      select: { id: true },
    });
    if (trimmedMatch) return trimmed;
  }
  return zip;
}
