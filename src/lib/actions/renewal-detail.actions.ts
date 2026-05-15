"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  getRenewalDetail as fetchRenewalDetail,
  updateSubscriptionItemAddress,
  updateSubscriptionItemPaymentMethod,
} from "@/lib/services/renewal-detail-service";

export async function getRenewalDetail(subscriptionId: number) {
  const { userId, isAdmin } = await getAuth();
  return fetchRenewalDetail(subscriptionId, userId, isAdmin);
}

export type ShippingChangeType =
  | "subscription-detail"
  | "subscription-item"
  | "cart"
  | "overdue";

export async function updateSubscriptionItemShippingAddress(input: {
  subscriptionItemId: number;
  userAddressId: number;
  type: ShippingChangeType;
}): Promise<void> {
  if (input.type === "cart" || input.type === "overdue") {
    throw new Error(`Shipping changes via ${input.type} flow are not yet implemented`);
  }
  const { userId } = await getAuth();
  const { subscriptionId } = await updateSubscriptionItemAddress(
    input.subscriptionItemId,
    userId,
    input.userAddressId,
  );
  revalidatePath(`/detail/${subscriptionId}`);
  revalidatePath("/");
}

export async function updateSubscriptionItemPayment(input: {
  subscriptionItemId: number;
  type: "card" | "bank";
  paymentMethodId: number;
}): Promise<void> {
  const { userId } = await getAuth();
  const { subscriptionId } = await updateSubscriptionItemPaymentMethod(
    input.subscriptionItemId,
    userId,
    input.type,
    input.paymentMethodId,
  );
  revalidatePath(`/detail/${subscriptionId}`);
  revalidatePath("/");
}
