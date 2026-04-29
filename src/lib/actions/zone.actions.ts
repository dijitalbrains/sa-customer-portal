"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";
import { getZone } from "@/lib/services/zone-service";
import {
  getLinkedProductKey,
  getRenewalFilterKey,
} from "@/lib/services/linked-product-service";

const P1_FILTER_KEY = "p1-filter";

export interface ZoneFormInput {
  subscriptionId: number;
  countryId: number;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean;
  hasFiltrationSystem: boolean;
  hasMicronSystem: boolean;
}

export interface CountryOption {
  id: number;
  code: string;
  name: string;
}

export interface StateOption {
  id: number;
  name: string;
}

export interface ProductRef {
  id: number;
  key: string;
  name: string;
  price: number;
}

export interface SubscriptionItemSnapshot {
  id: number;
  product: ProductRef;
  quantity: number;
  validityType: "MONTHS" | "WEEKS";
  validityValue: number;
  linkedProduct: ProductRef | null;
}

export interface SubscriptionSnapshot {
  id: number;
  zone: number;
  countryId: number | null;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean | null;
  hasFiltrationSystem: boolean | null;
  hasMicronSystem: boolean | null;
  items: SubscriptionItemSnapshot[];
}

export interface EditZoneData {
  subscription: SubscriptionSnapshot;
  p1Filter: ProductRef | null;
  countries: CountryOption[];
}

export interface ZoneChangesResult {
  zone: number;
  p1ValidityMonths: number | null;
  linkedProduct: ProductRef | null;
}

export async function getEditZoneData(subscriptionId: number): Promise<EditZoneData> {
  const { userId } = await requireSession();

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

  const items: SubscriptionItemSnapshot[] = sub.subscription_items.map((item) => ({
    id: Number(item.id),
    product: toProductRef(item.products_subscription_items_product_idToproducts),
    quantity: item.quantity ?? 1,
    validityType: (item.validity_type ?? "MONTHS") as "MONTHS" | "WEEKS",
    validityValue: item.validity_value ?? 0,
    linkedProduct: item.products_subscription_items_linked_product_idToproducts
      ? toProductRef(item.products_subscription_items_linked_product_idToproducts)
      : null,
  }));

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
    items,
  };

  const p1Product = await prisma.products.findFirst({
    where: { key: P1_FILTER_KEY, deleted_at: null },
    select: { id: true, key: true, name: true, price: true },
  });

  const countryRows = await prisma.countries.findMany({
    where: { available_in_country: true, deleted_at: null },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    subscription,
    p1Filter: p1Product ? toProductRef(p1Product) : null,
    countries: countryRows.map((c) => ({ id: c.id, code: c.code, name: c.name })),
  };
}

export async function getStatesForCountry(countryId: number): Promise<StateOption[]> {
  await requireSession();
  const rows = await prisma.states.findMany({
    where: { country_id: countryId, deleted_at: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function getZoneChanges(input: ZoneFormInput): Promise<ZoneChangesResult> {
  const { userId } = await requireSession();
  const subscription = await loadOwnedSubscription(input.subscriptionId, userId);

  const zone = await getZone({
    countryId: input.countryId,
    stateId: input.stateId,
    city: input.city,
    zip: input.zip,
    isWellWater: input.isWellWater,
    hasFiltrationSystem: input.hasFiltrationSystem,
    hasMicronSystem: input.hasMicronSystem,
  });

  const p1ValidityMonths =
    zone > 0 ? await fetchP1ValidityMonths(zone, input.householdSize) : null;

  let linkedProduct: ProductRef | null = null;
  if (zone !== -1) {
    const linkedKey = getLinkedProductKey(subscription.products.key, zone);
    if (linkedKey) {
      const product = await prisma.products.findFirst({
        where: { key: linkedKey, deleted_at: null },
        select: { id: true, key: true, name: true, price: true },
      });
      if (product) linkedProduct = toProductRef(product);
    }
  }

  return { zone, p1ValidityMonths, linkedProduct };
}

export async function updateZone(input: ZoneFormInput & { zone: number }) {
  const { userId, actorId } = await requireSession();
  const subscription = await loadOwnedSubscription(input.subscriptionId, userId);

  await prisma.subscriptions.update({
    where: { id: input.subscriptionId },
    data: {
      country_id: input.countryId,
      state_id: input.stateId ?? null,
      city: input.city,
      zip: input.zip,
      household_size: input.householdSize,
      is_well_water: input.isWellWater,
      has_filtration_system: input.isWellWater ? input.hasFiltrationSystem : null,
      has_micron_system: input.hasMicronSystem,
    },
  });

  if (subscription.zone === input.zone) return;

  if (subscription.products.key === "shower-filter") {
    await prisma.subscriptions.update({
      where: { id: input.subscriptionId },
      data: { zone: input.zone },
    });
    await logActivity({
      userId,
      actorId,
      key: "zone-edited",
      value: `zone ${input.zone}`,
      object: "Subscription",
      objectId: input.subscriptionId,
    });
    revalidatePath(`/detail/${input.subscriptionId}`);
    revalidatePath("/");
    return;
  }

  const newP1ValidityMonths =
    input.zone > 0 ? await fetchP1ValidityMonths(input.zone, input.householdSize) : null;

  await syncP1Filter(subscription, input.zone, newP1ValidityMonths);
  await syncLinkedProduct(subscription, input.zone);

  await prisma.subscriptions.update({
    where: { id: input.subscriptionId },
    data: { zone: input.zone },
  });

  await logActivity({
    userId,
    actorId,
    key: "zone-edited",
    value: `zone ${input.zone}`,
    object: "Subscription",
    objectId: input.subscriptionId,
  });

  revalidatePath(`/detail/${input.subscriptionId}`);
  revalidatePath("/");
}

type OwnedSubscription = NonNullable<Awaited<ReturnType<typeof loadOwnedSubscription>>>;

async function loadOwnedSubscription(subscriptionId: number, userId: number) {
  const sub = await prisma.subscriptions.findFirst({
    where: { id: subscriptionId, user_id: userId, deleted_at: null },
    select: {
      id: true,
      zone: true,
      household_size: true,
      products: { select: { id: true, key: true } },
    },
  });
  if (!sub) throw new Error("Subscription not found");
  return sub;
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

async function fetchP1ValidityMonths(zone: number, householdSize: number): Promise<number | null> {
  const rows = await prisma.$queryRaw<{ months: number }[]>`
    SELECT months FROM p1_validity
    WHERE zone = ${zone} AND household_size = ${householdSize}
    LIMIT 1
  `;
  return rows[0]?.months ?? null;
}

async function syncP1Filter(
  subscription: OwnedSubscription,
  newZone: number,
  newP1ValidityMonths: number | null,
) {
  const p1Product = await prisma.products.findFirst({
    where: { key: P1_FILTER_KEY, deleted_at: null },
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
  const p1Item = await prisma.subscription_items.findFirst({
    where: {
      subscription_id: subscription.id,
      product_id: p1Product.id,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (newZone === 0) {
    if (p1Item) {
      await prisma.subscription_items.update({
        where: { id: p1Item.id },
        data: { deleted_at: new Date() },
      });
    }
    return;
  }

  if (subscription.zone === 0 && !p1Item && renewalFilter && newP1ValidityMonths) {
    const hasEndsAt = renewalFilter.ends_at !== null;
    const now = new Date();
    await prisma.subscription_items.create({
      data: {
        subscription_id: subscription.id,
        product_id: p1Product.id,
        user_stripe_source_id: renewalFilter.user_stripe_source_id,
        user_bank_account_id: renewalFilter.user_bank_account_id,
        user_address_id: renewalFilter.user_address_id,
        status: "ACTIVE",
        validity_type: "MONTHS",
        validity_value: newP1ValidityMonths,
        starts_at: hasEndsAt ? now : null,
        ends_at: hasEndsAt ? addMonths(now, newP1ValidityMonths) : null,
        upcoming_reminder: hasEndsAt ? addMonths(now, newP1ValidityMonths) : null,
      },
    });
    return;
  }

  if (p1Item && newP1ValidityMonths) {
    await prisma.subscription_items.update({
      where: { id: p1Item.id },
      data: { validity_type: "MONTHS", validity_value: newP1ValidityMonths },
    });
  }
}

async function syncLinkedProduct(subscription: OwnedSubscription, newZone: number) {
  const renewalFilterKey = getRenewalFilterKey(subscription.products.key);
  if (!renewalFilterKey) return;

  const renewalFilterProduct = await prisma.products.findFirst({
    where: { key: renewalFilterKey, deleted_at: null },
    select: { id: true },
  });
  if (!renewalFilterProduct) return;

  const linkedKey = getLinkedProductKey(subscription.products.key, newZone);
  const linkedProduct = linkedKey
    ? await prisma.products.findFirst({
        where: { key: linkedKey, deleted_at: null },
        select: { id: true },
      })
    : null;

  await prisma.subscription_items.updateMany({
    where: {
      subscription_id: subscription.id,
      product_id: renewalFilterProduct.id,
      deleted_at: null,
    },
    data: { linked_product_id: linkedProduct?.id ?? null },
  });
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}
