"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";
import { calculateShipping, type ShippingResult } from "@/lib/services/shipping-service";
import type { PreferencesPayload, ValidityType } from "@/lib/types/preferences";

export async function updatePreferences(payload: PreferencesPayload) {
  const { userId, actorId } = await getAuth();
  const { itemId, validityType, validityValue, quantity } = payload;

  const item = await prisma.subscription_items.findFirst({
    where: { id: itemId, deleted_at: null, subscriptions: { user_id: userId, deleted_at: null } },
    select: { id: true, ends_at: true, subscription_id: true },
  });
  if (!item) throw new Error("Subscription item not found");

  const upcoming = new Date(payload.upcomingReminder);
  const ends = addInterval(upcoming, payload.unusedItems * validityValue, validityType);

  await prisma.subscription_items.update({
    where: { id: itemId },
    data: {
      validity_type: validityType,
      validity_value: validityValue,
      quantity,
      upcoming_reminder: upcoming,
      ends_at: ends,
    },
  });

  const oldEnds = item.ends_at;
  const endsChanged = oldEnds !== null && oldEnds.getTime() !== ends.getTime();

  if (endsChanged) {
    if (ends > new Date()) {
      await closeOpenAgentTasks(itemId);
      await prisma.subscription_items.update({
        where: { id: itemId },
        data: { is_task_created: false },
      });
    }
    await logActivity({
      userId,
      actorId,
      key: "renewal-updated",
      value: ends.toISOString(),
      object: "SubscriptionItem",
      objectId: itemId,
    });
  }

  if (item.subscription_id) revalidatePath(`/detail/${Number(item.subscription_id)}`);
  revalidatePath("/");
}

export async function getShippingPriceForItem(
  itemId: number,
  quantity: number,
): Promise<ShippingResult> {
  const { userId } = await getAuth();
  const item = await prisma.subscription_items.findFirst({
    where: { id: itemId, deleted_at: null, subscriptions: { user_id: userId, deleted_at: null } },
    select: {
      product_id: true,
      linked_product_id: true,
      linked_product_quantity: true,
      user_address_id: true,
    },
  });
  if (!item || !item.user_address_id) return { shippingPrice: 0, estimatedTax: 0 };

  return calculateShipping({
    productId: item.product_id,
    linkedProductId: item.linked_product_id ?? null,
    linkedProductQuantity: item.linked_product_quantity ?? 1,
    quantity,
    userAddressId: Number(item.user_address_id),
  });
}

async function closeOpenAgentTasks(itemId: number) {
  await prisma.agent_task.updateMany({
    where: { subscription_item_id: itemId, completed_at: null },
    data: { completed_at: new Date() },
  });
}

function addInterval(date: Date, value: number, unit: ValidityType): Date {
  const out = new Date(date);
  if (value <= 0) return out;
  if (unit === "MONTHS") out.setMonth(out.getMonth() + value);
  else out.setDate(out.getDate() + value * 7);
  return out;
}
