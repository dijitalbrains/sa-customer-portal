"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { listAvailableCountries } from "@/lib/services/country-service";
import { listStatesByCountry } from "@/lib/services/state-service";
import {
  createUserAddress,
  deleteUserAddress,
  listUserAddresses,
  migrateSubscriptionsBetweenAddresses,
  setDefaultUserAddress,
  updateUserAddress,
} from "@/lib/services/user-address-service";
import type { AddressInput, UserAddressView } from "@/lib/types/address";
import type { CountryOption, StateOption } from "@/lib/types/reference";

export async function getAddresses(): Promise<UserAddressView[]> {
  const { userId } = await getAuth();
  return listUserAddresses(userId);
}

export async function getCountries(): Promise<CountryOption[]> {
  return listAvailableCountries();
}

export async function getStatesForCountry(countryId: number): Promise<StateOption[]> {
  return listStatesByCountry(countryId);
}

export async function saveAddress(
  input: AddressInput,
  previousAddressId?: number,
  deletePrevious = false,
): Promise<number> {
  const { userId } = await getAuth();
  const id = await createUserAddress(userId, input);
  if (previousAddressId) {
    await migrateSubscriptionsBetweenAddresses(
      previousAddressId,
      id,
      userId,
      deletePrevious,
    );
  }
  revalidatePath("/addresses");
  revalidatePath("/account");
  return id;
}

export async function migrateSubscriptions(
  fromAddressId: number,
  toAddressId: number,
  deleteFrom = false,
): Promise<void> {
  const { userId } = await getAuth();
  await migrateSubscriptionsBetweenAddresses(fromAddressId, toAddressId, userId, deleteFrom);
  revalidatePath("/addresses");
  revalidatePath("/account");
}

export async function updateAddress(
  addressId: number,
  input: AddressInput,
): Promise<void> {
  const { userId } = await getAuth();
  await updateUserAddress(addressId, userId, input);
  revalidatePath("/addresses");
  revalidatePath("/account");
}

export async function setDefaultAddress(addressId: number): Promise<void> {
  const { userId } = await getAuth();
  await setDefaultUserAddress(addressId, userId);
  revalidatePath("/addresses");
  revalidatePath("/account");
}

export async function deleteAddress(addressId: number): Promise<void> {
  const { userId } = await getAuth();
  await deleteUserAddress(addressId, userId);
  revalidatePath("/addresses");
  revalidatePath("/account");
}
