import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";
import {
  getLinkedProductKey,
  getRenewalFilterKey,
} from "@/lib/services/linked-product-service";
import { processFallback } from "@/lib/services/territory-service";

const P1_FILTER_KEY = "p1-filter";
const SHOWER_FILTER_KEY = "shower-filter";

export interface ZoneSubscriptionData {
  countryId: number;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean;
  hasFiltrationSystem: boolean;
  hasMicronSystem: boolean;
}

export async function getZone(subscriptionData: ZoneSubscriptionData): Promise<number> {
  if (subscriptionData.hasMicronSystem) return 0;
  if (subscriptionData.isWellWater) return subscriptionData.hasFiltrationSystem ? 3 : 5;

  const zoneRow = await processFallback(
    {
      countryId: subscriptionData.countryId,
      stateId: subscriptionData.stateId,
      city: subscriptionData.city,
      zip: subscriptionData.zip,
    },
    "Zone",
  );
  return zoneRow ? zoneRow.zone : -1;
}

interface UpdateSubscriptionZoneInput {
  newZone: number;
  subscriptionId: number;
  userId: number;
  actorId: number;
  subscriptionData: ZoneSubscriptionData;
}

export async function updateSubscriptionZone(input: UpdateSubscriptionZoneInput): Promise<void> {
  const { newZone, subscriptionId, userId, actorId, subscriptionData } = input;

  const subscription = await loadSubscription(subscriptionId);
  if (!subscription) throw new Error("Subscription not found");

  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      country_id: subscriptionData.countryId,
      state_id: subscriptionData.stateId ?? null,
      city: subscriptionData.city,
      zip: subscriptionData.zip,
      household_size: subscriptionData.householdSize,
      is_well_water: subscriptionData.isWellWater,
      has_filtration_system: subscriptionData.isWellWater
        ? subscriptionData.hasFiltrationSystem
        : null,
      has_micron_system: subscriptionData.hasMicronSystem,
    },
  });

  if (subscription.zone === newZone) {
    revalidatePath(`/detail/${subscriptionId}`);
    revalidatePath("/");
    return;
  }

  if (subscription.products.key === SHOWER_FILTER_KEY) {
    await prisma.subscriptions.update({
      where: { id: subscriptionId },
      data: { zone: newZone },
    });

    const subscriptionItem = await prisma.subscription_items.findFirst({
      where: { subscription_id: subscriptionId, deleted_at: null },
      select: { id: true, ends_at: true },
    });
    if (subscriptionItem) {
      await prisma.subscription_items.update({
        where: { id: subscriptionItem.id },
        data: { ends_at: subscriptionItem.ends_at },
      });
    }

    await logActivity({
      userId,
      actorId,
      key: "zone-edited",
      value: `zone ${newZone}`,
      object: "Subscription",
      objectId: subscriptionId,
    });
    revalidatePath(`/detail/${subscriptionId}`);
    revalidatePath("/");
    return;
  }

  const newP1ValidityMonths =
    newZone > 0 ? await fetchP1ValidityMonths(newZone, subscription.household_size ?? 0) : null;

  await updateSubscriptionItemsByZone(subscription, newZone, newP1ValidityMonths);

  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: { zone: newZone },
  });

  await logActivity({
    userId,
    actorId,
    key: "zone-edited",
    value: `zone ${newZone}`,
    object: "Subscription",
    objectId: subscriptionId,
  });

  revalidatePath(`/detail/${subscriptionId}`);
  revalidatePath("/");
}

type LoadedSubscription = NonNullable<Awaited<ReturnType<typeof loadSubscription>>>;

async function loadSubscription(subscriptionId: number) {
  return prisma.subscriptions.findFirst({
    where: { id: subscriptionId, deleted_at: null },
    select: {
      id: true,
      zone: true,
      household_size: true,
      products: { select: { id: true, key: true } },
    },
  });
}

async function fetchP1ValidityMonths(zone: number, householdSize: number): Promise<number | null> {
  const rows = await prisma.$queryRaw<{ months: number }[]>`
    SELECT months FROM p1_validity
    WHERE zone = ${zone} AND household_size = ${householdSize}
    LIMIT 1
  `;
  return rows[0]?.months ?? null;
}

async function updateSubscriptionItemsByZone(
  subscription: LoadedSubscription,
  newZone: number,
  newP1ValidityMonths: number | null,
): Promise<void> {
  const p1Product = await prisma.products.findFirst({
    where: { key: P1_FILTER_KEY },
    select: { id: true },
  });
  if (!p1Product) return;

  const renewalFilter = await prisma.subscription_items.findFirst({
    where: {
      subscription_id: subscription.id,
      product_id: { not: p1Product.id },
      deleted_at: null,
    },
    select: {
      id: true,
      ends_at: true,
      user_stripe_source_id: true,
      user_bank_account_id: true,
      user_address_id: true,
    },
  });
  const p1SubscriptionItem = await prisma.subscription_items.findFirst({
    where: {
      subscription_id: subscription.id,
      product_id: p1Product.id,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (newZone > 0) {
    if (subscription.zone === 0) {
      if (!p1SubscriptionItem) {
        const hasEndsAt = renewalFilter!.ends_at !== null;
        const now = new Date();
        await prisma.subscription_items.create({
          data: {
            subscription_id: subscription.id,
            product_id: p1Product.id,
            user_stripe_source_id: renewalFilter!.user_stripe_source_id,
            user_bank_account_id: renewalFilter!.user_bank_account_id,
            user_address_id: renewalFilter!.user_address_id,
            status: "ACTIVE",
            validity_type: "MONTHS",
            validity_value: newP1ValidityMonths!,
            starts_at: hasEndsAt ? now : null,
            ends_at: hasEndsAt ? addMonths(now, newP1ValidityMonths!) : null,
            upcoming_reminder: hasEndsAt ? addMonths(now, newP1ValidityMonths!) : null,
          },
        });
      }
    } else if (p1SubscriptionItem) {
      await prisma.subscription_items.update({
        where: { id: p1SubscriptionItem.id },
        data: { validity_type: "MONTHS", validity_value: newP1ValidityMonths! },
      });
    }
  } else if (newZone === 0 && p1SubscriptionItem) {
    await prisma.subscription_items.update({
      where: { id: p1SubscriptionItem.id },
      data: { deleted_at: new Date() },
    });
  }

  await updateLinkedProductByZone(Number(subscription.id), subscription.products.key, newZone);
}

async function updateLinkedProductByZone(
  subscriptionId: number,
  waterSystemKey: string,
  zone: number,
): Promise<void> {
  const renewalFilterKey = getRenewalFilterKey(waterSystemKey);
  if (!renewalFilterKey) return;

  const renewalFilterProduct = await prisma.products.findFirst({
    where: { key: renewalFilterKey },
    select: { id: true },
  });
  if (!renewalFilterProduct) return;

  const linkedProductKey = getLinkedProductKey(waterSystemKey, zone);
  const linkedProduct = linkedProductKey
    ? await prisma.products.findFirst({
        where: { key: linkedProductKey },
        select: { id: true },
      })
    : null;

  const subscriptionItem = await prisma.subscription_items.findFirst({
    where: {
      subscription_id: subscriptionId,
      product_id: renewalFilterProduct.id,
      deleted_at: null,
    },
    select: { id: true, ends_at: true },
  });
  if (!subscriptionItem) return;

  await prisma.subscription_items.update({
    where: { id: subscriptionItem.id },
    data: {
      linked_product_id: linkedProduct?.id ?? null,
      ends_at: subscriptionItem.ends_at,
    },
  });
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}
