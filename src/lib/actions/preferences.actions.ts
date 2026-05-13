"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";
import { calculateShipping, type ShippingResult } from "@/lib/services/shipping-service";
import { addInterval } from "@/lib/utils/date";
import type { PreferencesPayload, ValidityType } from "@/lib/types/preferences";

export async function updatePreferences(payload: PreferencesPayload) {
  const { userId, actorId } = await getAuth();

  const item = await fetchPreferenceItem(payload.itemId, userId);
  if (!item) throw new Error("Subscription item not found");

  const upcoming = new Date(payload.upcomingReminder);
  const newEnds = computeNewEndsAt(
    upcoming,
    payload.unusedItems,
    payload.validityValue,
    payload.validityType,
  );

  await applyItemPreferences(payload.itemId, payload, upcoming, newEnds);

  const endsChanged = item.ends_at !== null && item.ends_at.getTime() !== newEnds.getTime();
  if (endsChanged) {
    await handleEndsAtChange(payload.itemId, userId, actorId, newEnds);
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
      linked_product_id: true,
      linked_product_quantity: true,
      user_address_id: true,
      products_subscription_items_product_idToproducts: {
        select: { id: true, key: true, type: true, price: true, requires_shipping: true },
      },
      user_addresses: {
        select: {
          street: true,
          city: true,
          zip: true,
          state_id: true,
          countries: {
            select: {
              id: true,
              code: true,
              hts_code: true,
              shipping_price_source: true,
              currencies: { select: { code: true } },
            },
          },
        },
      },
    },
  });
  if (!item || !item.user_address_id || !item.user_addresses) {
    return { shippingPrice: 0, estimatedTax: 0 };
  }

  return calculateShipping({
    product: item.products_subscription_items_product_idToproducts,
    address: item.user_addresses,
    linkedProductId: item.linked_product_id ?? null,
    linkedProductQuantity: item.linked_product_quantity ?? 1,
    quantity,
  });
}

function fetchPreferenceItem(itemId: number, userId: number) {
  return prisma.subscription_items.findFirst({
    where: { id: itemId, deleted_at: null, subscriptions: { user_id: userId, deleted_at: null } },
    select: { id: true, ends_at: true, subscription_id: true },
  });
}

function computeNewEndsAt(
  upcoming: Date,
  unusedItems: number,
  validityValue: number,
  validityType: ValidityType,
): Date {
  return addInterval(upcoming, unusedItems * validityValue, validityType);
}

async function applyItemPreferences(
  itemId: number,
  payload: PreferencesPayload,
  upcoming: Date,
  endsAt: Date,
): Promise<void> {
  await prisma.subscription_items.update({
    where: { id: itemId },
    data: {
      validity_type: payload.validityType,
      validity_value: payload.validityValue,
      quantity: payload.quantity,
      upcoming_reminder: upcoming,
      ends_at: endsAt,
    },
  });
}

async function handleEndsAtChange(
  itemId: number,
  userId: number,
  actorId: number,
  endsAt: Date,
): Promise<void> {
  if (endsAt > new Date()) {
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
    value: endsAt.toISOString(),
    object: "SubscriptionItem",
    objectId: itemId,
  });
}

async function closeOpenAgentTasks(itemId: number) {
  await prisma.agent_task.updateMany({
    where: { subscription_item_id: itemId, completed_at: null },
    data: { completed_at: new Date() },
  });
}
