"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";

export interface PauseInput {
  subscriptionItemIds: number[];
  pauseMonths: number;
}

export async function pauseSubscriptionItems({ subscriptionItemIds, pauseMonths }: PauseInput) {
  const { userId, actorId } = await getAuth();
  if (subscriptionItemIds.length === 0) throw new Error("Select at least one item to pause");

  const items = await prisma.subscription_items.findMany({
    where: {
      id: { in: subscriptionItemIds },
      deleted_at: null,
      subscriptions: { user_id: userId, deleted_at: null },
    },
    select: { id: true, ends_at: true, subscription_id: true },
  });

  await Promise.all(
    items.map((item) =>
      prisma.subscription_items.update({
        where: { id: item.id },
        data: { ends_at: addMonths(item.ends_at, pauseMonths) },
      }),
    ),
  );

  await Promise.all(
    items.map((item) =>
      logActivity({
        userId,
        actorId,
        key: "subscription-paused",
        value: `${pauseMonths} Months`,
        object: "SubscriptionItem",
        objectId: Number(item.id),
      }),
    ),
  );

  const subscriptionIds = new Set(items.map((i) => Number(i.subscription_id)));
  for (const id of subscriptionIds) revalidatePath(`/detail/${id}`);
  revalidatePath("/");
}

function addMonths(date: Date | null, months: number): Date {
  const base = date ? new Date(date) : new Date();
  base.setMonth(base.getMonth() + months);
  return base;
}
