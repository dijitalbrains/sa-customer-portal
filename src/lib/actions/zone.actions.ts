"use server";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLinkedProductKey } from "@/lib/services/linked-product-service";
import { getZone, updateSubscriptionZone } from "@/lib/services/zone-service";

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

export async function EditZone(subscriptionId: number): Promise<EditZoneData> {
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

  const p1Product = await prisma.products.findFirst({
    where: { key: P1_FILTER_KEY },
    select: { id: true, key: true, name: true, price: true },
  });

  const countryRows = await prisma.countries.findMany({
    where: { available_in_country: true },
    select: { id: true, code: true, name: true },
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
    where: { country_id: countryId },
    select: { id: true, name: true },
  });
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

/** Port of legacy RenewalsController::getZoneChanges */
export async function getZoneChanges(input: ZoneFormInput): Promise<ZoneChangesResult> {
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
      if (product) linkedProduct = toProductRef(product);
    }
  }

  return { zone, p1ValidityMonths, linkedProduct };
}

/** Port of legacy RenewalsController::updateZone */
export async function updateZone(input: ZoneFormInput & { zone: number }) {
  const { userId, actorId } = await requireSession();

  await updateSubscriptionZone({
    newZone: input.zone,
    subscriptionId: input.subscriptionId,
    userId,
    actorId,
    subscriptionData: {
      countryId: input.countryId,
      stateId: input.stateId,
      city: input.city,
      zip: input.zip,
      householdSize: input.householdSize,
      isWellWater: input.isWellWater,
      hasFiltrationSystem: input.hasFiltrationSystem,
      hasMicronSystem: input.hasMicronSystem,
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
