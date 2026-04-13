"use server";

import { requireUserId } from "@/lib/auth";
import { getFilterRenewal } from "@/lib/services/subscription-service";

export async function getRenewals() {
  const userId = await requireUserId();
  return getFilterRenewal(userId);
}
