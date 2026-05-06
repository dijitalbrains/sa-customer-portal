import "server-only";
import { prisma } from "@/lib/prisma";
import {
  attachCardPaymentMethod,
  createCustomer,
  updateCardExpiry as updateCardExpiryOnStripe,
} from "./stripe/stripe-service";
import { getCardStatus } from "@/lib/utils/payment";
import type { CardInput, CardPaymentMethod } from "@/lib/types/card";

export async function listUserCards(userId: number): Promise<CardPaymentMethod[]> {
  const cards = await prisma.user_stripe_sources.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { id: "asc" },
    select: cardSelect,
  });

  return cards.map(toCardPaymentMethod);
}

export async function setDefaultUserCard(
  cardId: number,
  userId: number,
): Promise<void> {
  const owned = await prisma.user_stripe_sources.findFirst({
    where: { id: cardId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!owned) throw new Error("Card not found");

  await prisma.user_stripe_sources.updateMany({
    where: { user_id: userId, is_default: true },
    data: { is_default: false },
  });
  await prisma.user_stripe_sources.update({
    where: { id: cardId },
    data: { is_default: true },
  });
}

export async function createUserCard(
  userId: number,
  input: CardInput,
): Promise<CardPaymentMethod> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      stripe_customer_id: true,
    },
  });
  if (!user) throw new Error("User not found");
  if (!user.email) throw new Error("User email is required to create a Stripe customer");

  const fullName = `${user.firstname} ${user.lastname ?? ""}`.trim();

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await createCustomer({
      paymentMethodId: input.paymentMethodId,
      name: fullName,
      email: user.email,
    });
    customerId = customer.id;
    await prisma.users.update({
      where: { id: userId },
      data: { stripe_customer_id: customerId },
    });
  } else {
    await attachCardPaymentMethod(customerId, input.paymentMethodId);
  }

  const existingDefault = await prisma.user_stripe_sources.findFirst({
    where: { user_id: userId, is_default: true, deleted_at: null },
    select: { id: true },
  });
  const shouldBeDefault = input.isDefault || !existingDefault;

  if (shouldBeDefault && existingDefault) {
    await prisma.user_stripe_sources.updateMany({
      where: { user_id: userId, is_default: true },
      data: { is_default: false },
    });
  }

  const created = await prisma.user_stripe_sources.create({
    data: {
      user_id: userId,
      stripe_source_id: input.paymentMethodId,
      brand: input.brand,
      last4: input.last4,
      exp_month: input.expMonth,
      exp_year: input.expYear,
      name_on_card: input.nameOnCard,
      is_default: shouldBeDefault,
    },
    select: cardSelect,
  });

  return toCardPaymentMethod(created);
}

export async function updateUserCardExpiry(
  cardId: number,
  userId: number,
  expMonth: string,
  expYear: string,
): Promise<void> {
  const card = await prisma.user_stripe_sources.findFirst({
    where: { id: cardId, user_id: userId, deleted_at: null },
    select: { id: true, stripe_source_id: true },
  });
  if (!card) throw new Error("Card not found");

  await updateCardExpiryOnStripe(
    card.stripe_source_id,
    Number(expMonth),
    Number(expYear),
  );

  await prisma.user_stripe_sources.update({
    where: { id: cardId },
    data: { exp_month: expMonth, exp_year: expYear, has_failed: false },
  });
}

export async function replaceCardWithExisting(
  oldCardId: number,
  newCardId: number,
  userId: number,
): Promise<void> {
  if (oldCardId === newCardId) throw new Error("Cannot replace a card with itself");

  const [oldCard, newCard] = await Promise.all([
    prisma.user_stripe_sources.findFirst({
      where: { id: oldCardId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
    prisma.user_stripe_sources.findFirst({
      where: { id: newCardId, user_id: userId, deleted_at: null },
      select: { id: true },
    }),
  ]);
  if (!oldCard) throw new Error("Original card not found");
  if (!newCard) throw new Error("Replacement card not found");

  await prisma.subscription_items.updateMany({
    where: { user_stripe_source_id: oldCardId },
    data: { user_stripe_source_id: newCardId },
  });
}

export async function replaceCardWithNew(
  oldCardId: number,
  userId: number,
  input: CardInput,
): Promise<CardPaymentMethod> {
  const oldCard = await prisma.user_stripe_sources.findFirst({
    where: { id: oldCardId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!oldCard) throw new Error("Original card not found");

  const newCard = await createUserCard(userId, input);

  await prisma.subscription_items.updateMany({
    where: { user_stripe_source_id: oldCardId },
    data: { user_stripe_source_id: newCard.id },
  });

  return newCard;
}

export async function removeCardFromLoyalty(cardId: number, userId: number): Promise<void> {
  const card = await prisma.user_stripe_sources.findFirst({
    where: { id: cardId, user_id: userId, deleted_at: null },
    select: { id: true, is_default: true },
  });
  if (!card) throw new Error("Card not found");
  if (card.is_default) throw new Error("Cannot remove default card");

  const items = await prisma.subscription_items.findMany({
    where: { user_stripe_source_id: cardId },
    select: { subscription_id: true },
  });
  const subscriptionIds = Array.from(
    new Set(
      items
        .map((i) => i.subscription_id)
        .filter((id): id is bigint => id !== null),
    ),
  );

  if (subscriptionIds.length > 0) {
    await prisma.subscriptions.updateMany({
      where: { id: { in: subscriptionIds } },
      data: { is_loyalty_enabled: false },
    });
  }

  await prisma.subscription_items.updateMany({
    where: { user_stripe_source_id: cardId },
    data: { user_stripe_source_id: null },
  });

  await prisma.user_stripe_sources.update({
    where: { id: cardId },
    data: { deleted_at: new Date() },
  });
}

export async function deleteUserCard(cardId: number, userId: number): Promise<void> {
  const owned = await prisma.user_stripe_sources.findFirst({
    where: { id: cardId, user_id: userId, deleted_at: null },
    select: { id: true, is_default: true },
  });
  if (!owned) throw new Error("Card not found");
  if (owned.is_default) throw new Error("Cannot remove default card");

  await prisma.user_stripe_sources.update({
    where: { id: cardId },
    data: { deleted_at: new Date() },
  });
}

function toCardPaymentMethod(card: CardRow): CardPaymentMethod {
  return {
    id: Number(card.id),
    brand: card.brand,
    last4: card.last4,
    expMonth: card.exp_month,
    expYear: card.exp_year,
    nameOnCard: card.name_on_card,
    hasFailed: card.has_failed,
    isDefault: card.is_default,
    status: getCardStatus(card),
    activeSubscriptions: card._count.subscription_items,
  };
}

const cardSelect = {
  id: true,
  brand: true,
  last4: true,
  exp_month: true,
  exp_year: true,
  name_on_card: true,
  has_failed: true,
  is_default: true,
  _count: {
    select: {
      subscription_items: { where: { deleted_at: null } },
    },
  },
} as const;

type CardRow = NonNullable<
  Awaited<ReturnType<typeof prisma.user_stripe_sources.findFirst<{ select: typeof cardSelect }>>>
>;