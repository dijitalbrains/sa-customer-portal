"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Session = {
  userId: number;
  adminId: number;
  actorId: number;
  isAdmin: boolean;
};

async function getSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = Number(session.user.id);
  const adminId = session.adminId ?? 0;
  return { userId, adminId, actorId: adminId > 0 ? adminId : userId, isAdmin: adminId > 0 };
}

interface ActivityLog {
  userId: number;
  actorId: number;
  key: string;
  object: "Subscription" | "SubscriptionItem";
  objectId: number;
  value?: string | null;
}

async function logActivity({ userId, actorId, key, object, objectId, value }: ActivityLog) {
  await prisma.activities.create({
    data: {
      user_id: userId,
      actor_id: actorId,
      key,
      value: value ?? null,
      location: "portal",
      object,
      object_id: objectId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

async function ensureOwnsSubscription(subscriptionId: number, userId: number) {
  const sub = await prisma.subscriptions.findFirst({
    where: { id: subscriptionId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!sub) throw new Error("Subscription not found");
}

async function ensureOwnsItem(itemId: number, userId: number) {
  const item = await prisma.subscription_items.findFirst({
    where: {
      id: itemId,
      deleted_at: null,
      subscriptions: { user_id: userId, deleted_at: null },
    },
    select: { id: true },
  });
  if (!item) throw new Error("Subscription item not found");
}

export async function updateNickname(subscriptionId: number, nickname: string) {
  const { userId } = await getSession();
  await ensureOwnsSubscription(subscriptionId, userId);

  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: { nickname: nickname.trim() || null },
  });

  revalidatePath(`/detail/${subscriptionId}`);
}

interface AdminUpdatePayload {
  itemId: number;
  linkedProductId: number | null;
  linkedProductQuantity: number;
}

export async function updateItemAdmin({
  itemId,
  linkedProductId,
  linkedProductQuantity,
}: AdminUpdatePayload) {
  const { userId, isAdmin } = await getSession();
  if (!isAdmin) throw new Error("Admin only");

  await ensureOwnsItem(itemId, userId);

  if (linkedProductId !== null) {
    const product = await prisma.products.findFirst({
      where: { id: linkedProductId, deleted_at: null },
      select: { id: true },
    });
    if (!product) throw new Error("Invalid linked product");
  }

  const qty = Math.max(1, Math.floor(linkedProductQuantity || 1));

  const updated = await prisma.subscription_items.update({
    where: { id: itemId },
    data: {
      linked_product_id: linkedProductId,
      linked_product_quantity: linkedProductId ? qty : null,
    },
    select: { subscription_id: true },
  });

  if (updated.subscription_id) {
    revalidatePath(`/detail/${Number(updated.subscription_id)}`);
  }
}

export async function removeSubscription(subscriptionId: number) {
  const { userId, actorId } = await getSession();
  await ensureOwnsSubscription(subscriptionId, userId);

  const now = new Date();

  await prisma.$transaction([
    prisma.subscription_items.updateMany({
      where: { subscription_id: subscriptionId, deleted_at: null },
      data: { deleted_at: now },
    }),
    prisma.subscriptions.update({
      where: { id: subscriptionId },
      data: { deleted_at: now },
    }),
  ]);

  await logActivity({
    userId,
    actorId,
    key: "renewal-removed",
    object: "Subscription",
    objectId: subscriptionId,
  });

  revalidatePath("/");
  redirect("/");
}

export async function removeSubscriptionItem(itemId: number) {
  const { userId, actorId, isAdmin } = await getSession();
  if (!isAdmin) throw new Error("Admin only");
  await ensureOwnsItem(itemId, userId);

  const item = await prisma.subscription_items.findFirst({
    where: { id: itemId, deleted_at: null },
    select: {
      subscription_id: true,
      products_subscription_items_product_idToproducts: { select: { key: true } },
    },
  });
  if (!item) throw new Error("Subscription item not found");

  if (item.products_subscription_items_product_idToproducts.key !== "p1-filter") {
    throw new Error("This is not a P1 filter");
  }

  await prisma.subscription_items.update({
    where: { id: itemId },
    data: { deleted_at: new Date() },
  });

  await logActivity({
    userId,
    actorId,
    key: "p1-filter-removed",
    object: "SubscriptionItem",
    objectId: itemId,
  });

  if (item.subscription_id) {
    revalidatePath(`/detail/${Number(item.subscription_id)}`);
  }
}

export async function addP1Filter(subscriptionId: number) {
  const { userId, actorId, isAdmin } = await getSession();
  if (!isAdmin) throw new Error("Admin only");
  await ensureOwnsSubscription(subscriptionId, userId);

  const subscription = await prisma.subscriptions.findFirst({
    where: { id: subscriptionId, deleted_at: null },
    select: { id: true, zone: true, household_size: true },
  });
  if (!subscription) throw new Error("Subscription not found");

  const p1Filter = await prisma.products.findFirst({
    where: { key: "p1-filter", deleted_at: null },
    select: { id: true },
  });
  if (!p1Filter) throw new Error("P1 filter product not found");

  const existingP1 = await prisma.subscription_items.findFirst({
    where: { subscription_id: subscriptionId, product_id: p1Filter.id, deleted_at: null },
    select: { id: true },
  });
  if (existingP1) throw new Error("P1 filter already exists for this subscription");

  const renewalFilter = await prisma.subscription_items.findFirst({
    where: { subscription_id: subscriptionId, deleted_at: null },
    select: {
      user_stripe_source_id: true,
      user_bank_account_id: true,
      user_address_id: true,
      ends_at: true,
    },
  });
  if (!renewalFilter) throw new Error("No renewal filter found for this subscription");

  const validityRows = await prisma.$queryRaw<{ months: number }[]>`
    SELECT months FROM p1_validity
    WHERE zone = ${subscription.zone} AND household_size = ${subscription.household_size}
    LIMIT 1
  `;
  const validityMonths = validityRows[0]?.months;
  if (!validityMonths) throw new Error("P1 validity not found for zone and household size");

  const now = new Date();
  const hasRenewalEndsAt = renewalFilter.ends_at !== null;
  const startsAt = hasRenewalEndsAt ? now : null;
  const endsAt = hasRenewalEndsAt ? addMonths(now, validityMonths) : null;
  const upcomingReminder = hasRenewalEndsAt ? addMonths(now, validityMonths) : null;

  await prisma.subscription_items.create({
    data: {
      subscription_id: subscriptionId,
      product_id: p1Filter.id,
      user_stripe_source_id: renewalFilter.user_stripe_source_id,
      user_bank_account_id: renewalFilter.user_bank_account_id,
      user_address_id: renewalFilter.user_address_id,
      status: "ACTIVE",
      validity_type: "MONTHS",
      validity_value: validityMonths,
      starts_at: startsAt,
      ends_at: endsAt,
      upcoming_reminder: upcomingReminder,
    },
  });

  await logActivity({
    userId,
    actorId,
    key: "p1-filter-added",
    object: "Subscription",
    objectId: subscriptionId,
  });

  revalidatePath(`/detail/${subscriptionId}`);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
