"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  deleteUserCard,
  listUserCards,
  setDefaultUserCard,
} from "@/lib/services/card-service";
import type { CardPaymentMethod } from "@/lib/types/card";

export interface PaymentMethods {
  cards: CardPaymentMethod[];
}

export async function getPaymentMethods(): Promise<PaymentMethods> {
  const { userId } = await getAuth();
  const cards = await listUserCards(userId);
  return { cards };
}

export async function setDefaultPaymentMethod(input: {
  type: "card";
  id: number;
}): Promise<void> {
  const { userId } = await getAuth();
  if (input.type === "card") {
    await setDefaultUserCard(input.id, userId);
  }
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function removePaymentMethod(input: {
  type: "card";
  id: number;
}): Promise<void> {
  const { userId } = await getAuth();
  if (input.type === "card") {
    await deleteUserCard(input.id, userId);
  }
  revalidatePath("/payments");
  revalidatePath("/account");
}
