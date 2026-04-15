"use server";

import { requireUserId } from "@/lib/auth";
import { getRenewals as fetchRenewals } from "@/lib/services/renewal-service";

export async function getRenewals() {
  const userId = await requireUserId();
  return fetchRenewals(userId);
}
