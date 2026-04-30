import "server-only";
import { prisma } from "@/lib/prisma";
import type { StateOption } from "@/lib/types/reference";

export async function listStatesByCountry(countryId: number): Promise<StateOption[]> {
  const states = await prisma.states.findMany({
    where: { country_id: countryId },
    select: { id: true, name: true, abbr: true },
  });
  return states.map((s) => ({ id: s.id, name: s.name, abbr: s.abbr }));
}
