import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";
import { listAvailableCountries } from "@/lib/services/country-service";
import {
  getLinkedProductKey,
  getRenewalFilterKey,
} from "@/lib/services/linked-product-service";
import { processFallback } from "@/lib/services/territory-service";
import { addMonths } from "@/lib/utils/date";
import type {
  EditZoneData,
  ProductRef,
  SubscriptionSnapshot,
  ZoneChangesResult,
  ZoneFormInput,
  ZoneSubscriptionData,
} from "@/lib/types/zone";

const P1_FILTER_KEY = "p1-filter";
const SHOWER_FILTER_KEY = "shower-filter";

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

export async function getEditZoneData(
  subscriptionId: number,
  userId: number,
): Promise<EditZoneData> {
  const sub = await prisma.subscriptions.findFirst({
    where: { id: subscriptionId, user_id: userId, deleted_at: null },
    select: {
      id: true,
      zone: true,
      country_id: true,
      state_id: true,
      city: true,
      zip: true,
      household_size: true,
      is_well_water: true,
      has_filtration_system: true,
      has_micron_system: true,
      subscription_items: {
        where: { deleted_at: null },
        select: {
          id: true,
          quantity: true,
          validity_type: true,
          validity_value: true,
          products_subscription_items_product_idToproducts: {
            select: { id: true, key: true, name: true, price: true },
          },
          products_subscription_items_linked_product_idToproducts: {
            select: { id: true, key: true, name: true, price: true },
          },
        },
      },
    },
  });
  if (!sub) throw new Error("Subscription not found");

  const subscription: SubscriptionSnapshot = {
    id: Number(sub.id),
    zone: sub.zone ?? 0,
    countryId: sub.country_id ?? null,
    stateId: sub.state_id ?? null,
    city: sub.city ?? "",
    zip: sub.zip ?? "",
    householdSize: sub.household_size ?? 0,
    isWellWater: sub.is_well_water,
    hasFiltrationSystem: sub.has_filtration_system,
    hasMicronSystem: sub.has_micron_system,
    items: sub.subscription_items.map((item) => ({
      id: Number(item.id),
      product: toProductRef(item.products_subscription_items_product_idToproducts),
      quantity: item.quantity ?? 1,
      validityType: (item.validity_type ?? "MONTHS") as "MONTHS" | "WEEKS",
      validityValue: item.validity_value ?? 0,
      linkedProduct: item.products_subscription_items_linked_product_idToproducts
        ? toProductRef(item.products_subscription_items_linked_product_idToproducts)
        : null,
    })),
  };

  const [p1Product, countries] = await Promise.all([
    prisma.products.findFirst({
      where: { key: P1_FILTER_KEY },
      select: { id: true, key: true, name: true, price: true },
    }),
    listAvailableCountries(),
  ]);

  return {
    subscription,
    p1Filter: p1Product ? toProductRef(p1Product) : null,
    countries,
  };
}

function toProductRef(product: {
  id: number;
  key: string;
  name: string;
  price: number | null;
}): ProductRef {
  return {
    id: product.id,
    key: product.key,
    name: product.name,
    price: product.price ?? 0,
  };
}

export async function getZoneChangePreview(input: ZoneFormInput): Promise<ZoneChangesResult> {
  const zone = await getZone({
    countryId: input.countryId,
    stateId: input.stateId,
    city: input.city,
    zip: input.zip,
    householdSize: input.householdSize,
    isWellWater: input.isWellWater,
    hasFiltrationSystem: input.hasFiltrationSystem,
    hasMicronSystem: input.hasMicronSystem,
  });

  const subscription = await prisma.subscriptions.findFirst({
    where: { id: input.subscriptionId, deleted_at: null },
    select: { zone: true, products: { select: { key: true } } },
  });
  if (!subscription) throw new Error("Subscription not found");

  const p1ValidityMonths =
    zone !== 0 && zone !== -1
      ? await fetchP1ValidityMonths(zone, input.householdSize)
      : null;

  let linkedProduct: ProductRef | null = null;
  if (subscription.zone !== zone && zone !== -1) {
    const linkedKey = getLinkedProductKey(subscription.products.key, zone);
    if (linkedKey) {
      const product = await prisma.products.findFirst({
        where: { key: linkedKey },
        select: { id: true, key: true, name: true, price: true },
      });
      if (product) {
        linkedProduct = {
          id: product.id,
          key: product.key,
          name: product.name,
          price: product.price ?? 0,
        };
      }
    }
  }

  return { zone, p1ValidityMonths, linkedProduct };
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

  await updateSubscription(subscriptionId, subscriptionData);

  if (subscription.zone === newZone) {
    revalidateZonePaths(subscriptionId);
    return;
  }

  if (subscription.products.key === SHOWER_FILTER_KEY) {
    await applySubscriptionZone(subscriptionId, newZone);
    await logZoneChange(userId, actorId, subscriptionId, newZone);
    revalidateZonePaths(subscriptionId);
    return;
  }

  const newP1ValidityMonths =
    newZone > 0 ? await fetchP1ValidityMonths(newZone, subscription.household_size ?? 0) : null;

  await updateSubscriptionItemsByZone(subscription, newZone, newP1ValidityMonths);
  await applySubscriptionZone(subscriptionId, newZone);
  await logZoneChange(userId, actorId, subscriptionId, newZone);
  revalidateZonePaths(subscriptionId);
}

async function updateSubscription(
  subscriptionId: number,
  data: ZoneSubscriptionData,
): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: {
      country_id: data.countryId,
      state_id: data.stateId ?? null,
      city: data.city,
      zip: data.zip,
      household_size: data.householdSize,
      is_well_water: data.isWellWater,
      has_filtration_system: data.isWellWater ? data.hasFiltrationSystem : null,
      has_micron_system: data.hasMicronSystem,
    },
  });
}

async function applySubscriptionZone(
  subscriptionId: number,
  newZone: number,
): Promise<void> {
  await prisma.subscriptions.update({
    where: { id: subscriptionId },
    data: { zone: newZone },
  });
}

async function logZoneChange(
  userId: number,
  actorId: number,
  subscriptionId: number,
  newZone: number,
): Promise<void> {
  await logActivity({
    userId,
    actorId,
    key: "zone-edited",
    value: `zone ${newZone}`,
    object: "Subscription",
    objectId: subscriptionId,
  });
}

function revalidateZonePaths(subscriptionId: number): void {
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
    select: { id: true },
  });
  if (!subscriptionItem) return;

  await prisma.subscription_items.update({
    where: { id: subscriptionItem.id },
    data: { linked_product_id: linkedProduct?.id ?? null },
  });
}
