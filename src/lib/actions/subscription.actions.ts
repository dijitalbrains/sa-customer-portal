"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getFilterRenewalOrders } from "@/lib/services/subscription-service";

export async function getRenewals() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return getFilterRenewalOrders(Number(session.user.id));
}

export async function refreshFilterRenewals() {
  revalidatePath("/");
}
