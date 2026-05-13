import "server-only";
import { prisma } from "@/lib/prisma";
import { formatAddress } from "@/lib/utils/address";
import type { AddressInput, UserAddressView } from "@/lib/types/address";

export async function listUserAddresses(userId: number): Promise<UserAddressView[]> {
  const user_addresses = await prisma.user_addresses.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { id: "asc" },
    select: addressSelect,
  });
  return user_addresses.map(toView);
}

export async function findUserAddress(
  addressId: number,
  userId: number,
): Promise<UserAddressView | null> {
  const r = await prisma.user_addresses.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
    select: addressSelect,
  });
  return r ? toView(r) : null;
}

export async function migrateSubscriptionsBetweenAddresses(
  fromAddressId: number,
  toAddressId: number,
  userId: number,
  deleteFrom = false,
): Promise<void> {
  const [from, to] = await Promise.all([
    prisma.user_addresses.findFirst({
      where: { id: fromAddressId, user_id: userId, deleted_at: null },
      select: { id: true, is_default: true },
    }),
    prisma.user_addresses.findFirst({
      where: { id: toAddressId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
  ]);
  if (!from || !to) throw new Error("Address not found");
  if (deleteFrom && from.is_default) throw new Error("Cannot remove default address");

  await prisma.subscription_items.updateMany({
    where: { user_address_id: fromAddressId, deleted_at: null },
    data: { user_address_id: toAddressId },
  });

  if (deleteFrom) {
    await prisma.user_addresses.update({
      where: { id: fromAddressId },
      data: { deleted_at: new Date() },
    });
  }
}

export async function createUserAddress(
  userId: number,
  input: AddressInput,
): Promise<number> {
  if (input.isDefault) {
    await clearDefaultAddress(userId);
  }
  const created = await prisma.user_addresses.create({
    data: {
      user_id: userId,
      country_id: input.countryId,
      state_id: input.stateId,
      name: input.name,
      phone: input.phone,
      street: input.street,
      apartment: input.apartment,
      city: input.city,
      zip: input.zip,
      is_default: input.isDefault,
      delivery_instructions: input.deliveryInstructions,
    },
    select: { id: true },
  });
  return Number(created.id);
}

export async function updateUserAddress(
  addressId: number,
  userId: number,
  input: AddressInput,
): Promise<void> {
  const existing = await prisma.user_addresses.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!existing) throw new Error("Address not found");

  await prisma.user_addresses.update({
    where: { id: addressId },
    data: {
      country_id: input.countryId,
      state_id: input.stateId,
      name: input.name,
      phone: input.phone,
      street: input.street,
      apartment: input.apartment,
      city: input.city,
      zip: input.zip,
      delivery_instructions: input.deliveryInstructions,
    },
  });
}

export async function setDefaultUserAddress(
  addressId: number,
  userId: number,
): Promise<void> {
  const owned = await prisma.user_addresses.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!owned) throw new Error("Address not found");

  await clearDefaultAddress(userId);
  await prisma.user_addresses.update({
    where: { id: addressId },
    data: { is_default: true },
  });
}

export async function deleteUserAddress(
  addressId: number,
  userId: number,
): Promise<void> {
  const owned = await prisma.user_addresses.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
    select: { id: true, is_default: true },
  });
  if (!owned) throw new Error("Address not found");
  if (owned.is_default) throw new Error("Cannot remove default address");

  await prisma.user_addresses.update({
    where: { id: addressId },
    data: { deleted_at: new Date() },
  });
}

async function clearDefaultAddress(userId: number): Promise<void> {
  await prisma.user_addresses.updateMany({
    where: { user_id: userId, is_default: true },
    data: { is_default: false },
  });
}

const addressSelect = {
  id: true,
  name: true,
  phone: true,
  street: true,
  apartment: true,
  city: true,
  zip: true,
  state_id: true,
  country_id: true,
  is_default: true,
  delivery_instructions: true,
  states: { select: { id: true, name: true, abbr: true } },
  countries: { select: { id: true, name: true } },
  _count: {
    select: {
      subscription_items: { where: { deleted_at: null } },
    },
  },
} as const;

type AddressRow = NonNullable<
  Awaited<ReturnType<typeof prisma.user_addresses.findFirst<{ select: typeof addressSelect }>>>
>;

function toView(r: AddressRow): UserAddressView {
  return {
    id: Number(r.id),
    name: r.name,
    phone: r.phone,
    street: r.street,
    apartment: r.apartment,
    city: r.city,
    zip: r.zip,
    stateId: r.state_id,
    stateName: r.states.name,
    stateAbbr: r.states.abbr,
    countryId: r.country_id,
    countryName: r.countries?.name ?? null,
    isDefault: r.is_default,
    deliveryInstructions: r.delivery_instructions,
    activeSubscriptions: r._count.subscription_items,
    formatted: formatAddress(r),
  };
}
