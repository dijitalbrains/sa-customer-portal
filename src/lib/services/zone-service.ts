import "server-only";
import { resolveZone, type AddressLookup } from "@/lib/services/territory-resolver";

export interface ZoneInput {
  countryId: number;
  stateId: number | null;
  city: string;
  zip: string;
  isWellWater: boolean;
  hasFiltrationSystem: boolean;
  hasMicronSystem: boolean;
}

export async function getZone(input: ZoneInput): Promise<number> {
  if (input.hasMicronSystem) return 0;
  if (input.isWellWater) return input.hasFiltrationSystem ? 3 : 5;

  const address: AddressLookup = {
    countryId: input.countryId,
    stateId: input.stateId,
    city: input.city,
    zip: input.zip,
  };
  return resolveZone(address);
}
