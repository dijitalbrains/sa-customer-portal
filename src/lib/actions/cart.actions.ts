"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  addItemToCart as addItemToCartService,
  applyCartCredits as applyCartCreditsService,
  changeAllCartItemsAddress as changeAllCartItemsAddressService,
  changeCartPaymentMethod as changeCartPaymentMethodService,
  loadCart as loadCartService,
  removeCartCredits as removeCartCreditsService,
  removeItemFromCart as removeItemFromCartService,
  updateCartItemQuantity as updateCartItemQuantityService,
} from "@/lib/services/cart-service";
import { getCreditBalance } from "@/lib/services/user-credits-service";
import type { AddToCartResult, Cart } from "@/lib/types/cart";

export async function getCart(): Promise<Cart | null> {
  const { userId } = await getAuth();
  return loadCartService(userId);
}

export async function updateCartItemQuantity(
  subscriptionItemId: number,
  quantity: number,
): Promise<Cart | null> {
  const { userId } = await getAuth();
  const cart = await updateCartItemQuantityService(userId, subscriptionItemId, quantity);
  revalidatePath("/cart");
  return cart;
}

export async function applyCredits(): Promise<Cart | null> {
  const { userId } = await getAuth();
  const balance = await getCreditBalance(userId);
  const cart = await applyCartCreditsService(userId, balance);
  revalidatePath("/cart");
  return cart;
}

export async function removeCredits(): Promise<Cart | null> {
  const { userId } = await getAuth();
  const cart = await removeCartCreditsService(userId);
  revalidatePath("/cart");
  return cart;
}

export async function updateAllCartItemsAddress(userAddressId: number): Promise<Cart | null> {
  const { userId } = await getAuth();
  const cart = await changeAllCartItemsAddressService(userId, userAddressId);
  revalidatePath("/cart");
  return cart;
}

export async function updateCartPaymentMethod(
  selection: { type: "card" | "bank"; id: number },
): Promise<Cart | null> {
  const { userId } = await getAuth();
  const cart = await changeCartPaymentMethodService(userId, selection);
  revalidatePath("/cart");
  return cart;
}

export async function addToCart(input: {
  subscriptionItemId: number;
  quantity: number;
}): Promise<AddToCartResult> {
  const { userId } = await getAuth();
  const result = await addItemToCartService(
    userId,
    input.subscriptionItemId,
    input.quantity,
  );
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return result;
}

export async function removeFromCart(subscriptionItemId: number): Promise<Cart | null> {
  const { userId } = await getAuth();
  const cart = await removeItemFromCartService(userId, subscriptionItemId);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return cart;
}
