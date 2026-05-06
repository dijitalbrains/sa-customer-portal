"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import {
  createUserCard,
  deleteUserCard,
  listUserCards,
  removeCardFromLoyalty,
  replaceCardWithExisting,
  replaceCardWithNew,
  setDefaultUserCard,
  updateUserCardExpiry,
} from "@/lib/services/card-service";
import type {
  CardFormContext,
  CardInput,
  CardPaymentMethod,
} from "@/lib/types/card";

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

export async function addCardPaymentMethod(input: CardInput): Promise<CardPaymentMethod> {
  const { userId } = await getAuth();
  const card = await createUserCard(userId, input);
  revalidatePath("/payments");
  revalidatePath("/account");
  return card;
}

export async function removeCardFromLoyaltyAction(input: { cardId: number }): Promise<void> {
  const { userId } = await getAuth();
  await removeCardFromLoyalty(input.cardId, userId);
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function updateCardExpiry(input: {
  cardId: number;
  expMonth: string;
  expYear: string;
}): Promise<void> {
  const { userId } = await getAuth();
  await updateUserCardExpiry(input.cardId, userId, input.expMonth, input.expYear);
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function replaceCardWithExistingAction(input: {
  oldCardId: number;
  newCardId: number;
}): Promise<void> {
  const { userId } = await getAuth();
  await replaceCardWithExisting(input.oldCardId, input.newCardId, userId);
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function replaceCardWithNewAction(input: {
  oldCardId: number;
  card: CardInput;
}): Promise<CardPaymentMethod> {
  const { userId } = await getAuth();
  const card = await replaceCardWithNew(input.oldCardId, userId, input.card);
  revalidatePath("/payments");
  revalidatePath("/account");
  return card;
}

export async function getCardFormContext(): Promise<CardFormContext> {
  const { userId } = await getAuth();
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { firstname: true, lastname: true, email: true },
  });
  if (!user) throw new Error("User not found");
  return {
    name: `${user.firstname} ${user.lastname ?? ""}`.trim(),
    email: user.email ?? "",
  };
}
