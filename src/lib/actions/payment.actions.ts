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
import {
  createUserBank,
  deleteUserBank,
  getAchSessionContextForUser,
  isUserAchEligible,
  listUserBanks,
  removeBankFromLoyalty,
  replaceBankWithExistingBank,
  replaceBankWithExistingCard,
  replaceBankWithNewBank,
  setDefaultUserBank,
} from "@/lib/services/bank-service";
import type {
  CardFormContext,
  CardInput,
  CardPaymentMethod,
} from "@/lib/types/card";
import type {
  AchSessionContext,
  BankInput,
  BankPaymentMethod,
} from "@/lib/types/bank";

export interface PaymentMethods {
  cards: CardPaymentMethod[];
  banks: BankPaymentMethod[];
}

export async function getPaymentMethods(): Promise<PaymentMethods> {
  const { userId } = await getAuth();
  const [cards, banks] = await Promise.all([
    listUserCards(userId),
    listUserBanks(userId),
  ]);
  return { cards, banks };
}

export async function setDefaultPaymentMethod(input:
  | { type: "card"; id: number }
  | { type: "bank"; id: number }
): Promise<void> {
  const { userId } = await getAuth();
  if (input.type === "card") {
    await setDefaultUserCard(input.id, userId);
  } else {
    await setDefaultUserBank(input.id, userId);
  }
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function removePaymentMethod(input:
  | { type: "card"; id: number }
  | { type: "bank"; id: number }
): Promise<void> {
  const { userId } = await getAuth();
  if (input.type === "card") {
    await deleteUserCard(input.id, userId);
  } else {
    await deleteUserBank(input.id, userId);
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

export async function addBankPaymentMethod(input: BankInput): Promise<BankPaymentMethod> {
  const { userId } = await getAuth();
  if (!(await isUserAchEligible(userId))) {
    throw new Error("ACH is only available for US users");
  }
  const bank = await createUserBank(userId, input);
  revalidatePath("/payments");
  revalidatePath("/account");
  return bank;
}

export async function removeBankFromLoyaltyAction(input: { bankId: number }): Promise<void> {
  const { userId } = await getAuth();
  await removeBankFromLoyalty(input.bankId, userId);
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function replaceBankWithExistingPaymentMethodAction(input:
  | { oldBankId: number; targetType: "card"; newId: number }
  | { oldBankId: number; targetType: "bank"; newId: number }
): Promise<void> {
  const { userId } = await getAuth();
  if (input.targetType === "card") {
    await replaceBankWithExistingCard(input.oldBankId, input.newId, userId);
  } else {
    await replaceBankWithExistingBank(input.oldBankId, input.newId, userId);
  }
  revalidatePath("/payments");
  revalidatePath("/account");
}

export async function replaceBankWithNewBankAction(input: {
  oldBankId: number;
  bank: BankInput;
}): Promise<BankPaymentMethod> {
  const { userId } = await getAuth();
  if (!(await isUserAchEligible(userId))) {
    throw new Error("ACH is only available for US users");
  }
  const bank = await replaceBankWithNewBank(input.oldBankId, userId, input.bank);
  revalidatePath("/payments");
  revalidatePath("/account");
  return bank;
}

export async function getAchEligibility(): Promise<boolean> {
  const { userId } = await getAuth();
  return isUserAchEligible(userId);
}

export async function getAchSessionContext(): Promise<AchSessionContext> {
  const { userId } = await getAuth();
  if (!(await isUserAchEligible(userId))) {
    throw new Error("ACH is only available for US users");
  }
  return getAchSessionContextForUser(userId);
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
