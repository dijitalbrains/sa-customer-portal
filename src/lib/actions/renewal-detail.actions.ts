"use server";

import { getAuth } from "@/lib/auth";
import { getRenewalDetail as fetchRenewalDetail } from "@/lib/services/renewal-detail-service";

export async function getRenewalDetail(subscriptionId: number) {
  const { userId, isAdmin } = await getAuth();
  return fetchRenewalDetail(subscriptionId, userId, isAdmin);
}
