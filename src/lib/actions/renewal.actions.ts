"use server";

import { getAuth } from "@/lib/auth";
import { getRenewals as fetchRenewals } from "@/lib/services/renewal-service";

export async function getRenewals() {
  const { userId } = await getAuth();
  return fetchRenewals(userId);
}
