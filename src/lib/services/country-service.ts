import "server-only";
import { prisma } from "@/lib/prisma";
import type { CountryOption } from "@/lib/types/reference";

export async function listAvailableCountries(): Promise<CountryOption[]> {
  const countries = await prisma.countries.findMany({
    where: { available_in_country: true },
    select: { id: true, code: true, name: true },
  });
  return countries.map((c) => ({ id: c.id, code: c.code, name: c.name }));
}
