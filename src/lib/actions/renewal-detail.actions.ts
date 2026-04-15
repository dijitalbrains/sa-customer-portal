"use server";

import { auth } from "@/lib/auth";
import { getRenewalDetail as fetchRenewalDetail } from "@/lib/services/renewal-detail-service";

export async function getRenewalDetail(subscriptionId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = Number(session.user.id);
  const isAdmin = (session.adminId ?? 0) > 0;
  return fetchRenewalDetail(subscriptionId, userId, isAdmin);
}
