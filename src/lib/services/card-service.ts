import "server-only";
import { prisma } from "@/lib/prisma";
import type { CardPaymentMethod, CardStatus } from "@/lib/types/card";

export async function listUserCards(userId: number): Promise<CardPaymentMethod[]> {
  const cards = await prisma.user_stripe_sources.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { id: "asc" },
    select: cardSelect,
  });

  if (cards.length === 0) return [];

  const ids = cards.map((c) => c.id);
  const [active, expired] = await Promise.all([
    countActiveSubscriptionsPerCard(ids),
    countExpiredSubscriptionsPerCard(ids),
  ]);

  return cards.map((card) =>
    toCardPaymentMethod(
      card,
      active.get(Number(card.id)) ?? 0,
      expired.get(Number(card.id)) ?? 0,
    ),
  );
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

const cardSelect = {
  id: true,
  brand: true,
  last4: true,
  exp_month: true,
  exp_year: true,
  name_on_card: true,
  has_failed: true,
  is_default: true,
} as const;

type CardRow = NonNullable<
  Awaited<ReturnType<typeof prisma.user_stripe_sources.findFirst<{ select: typeof cardSelect }>>>
>;

async function countActiveSubscriptionsPerCard(
  cardIds: bigint[],
): Promise<Map<number, number>> {
  if (cardIds.length === 0) return new Map();
  const rows = await prisma.subscription_items.groupBy({
    by: ["user_stripe_source_id"],
    where: { user_stripe_source_id: { in: cardIds }, deleted_at: null },
    _count: { _all: true },
  });
  const map = new Map<number, number>();
  for (const r of rows) {
    if (r.user_stripe_source_id !== null) {
      map.set(Number(r.user_stripe_source_id), r._count._all);
    }
  }
  return map;
}

async function countExpiredSubscriptionsPerCard(
  cardIds: bigint[],
): Promise<Map<number, number>> {
  if (cardIds.length === 0) return new Map();
  const now = new Date();
  const rows = await prisma.subscription_items.groupBy({
    by: ["user_stripe_source_id"],
    where: {
      user_stripe_source_id: { in: cardIds },
      deleted_at: null,
      ends_at: { lte: now },
    },
    _count: { _all: true },
  });
  const map = new Map<number, number>();
  for (const r of rows) {
    if (r.user_stripe_source_id !== null) {
      map.set(Number(r.user_stripe_source_id), r._count._all);
    }
  }
  return map;
}

function toCardPaymentMethod(
  card: CardRow,
  activeSubscriptions: number,
  expiredSubscriptions: number,
): CardPaymentMethod {
  return {
    id: Number(card.id),
    brand: card.brand,
    last4: card.last4,
    expMonth: card.exp_month,
    expYear: card.exp_year,
    nameOnCard: card.name_on_card,
    hasFailed: card.has_failed,
    isDefault: card.is_default,
    status: computeCardStatus(card.has_failed, card.exp_month, card.exp_year),
    activeSubscriptions,
    expiredSubscriptions,
  };
}

function computeCardStatus(
  hasFailed: boolean,
  expMonth: string,
  expYear: string,
): CardStatus {
  if (hasFailed) return "FAILED";

  const expiresAt = endOfExpiryMonth(expMonth, expYear);
  const now = new Date();
  if (now > expiresAt) return "EXPIRED";

  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  if (expiresAt <= oneMonthFromNow) return "EXPIRING_SOON";

  return "GOOD";
}

function endOfExpiryMonth(expMonth: string, expYear: string): Date {
  const month = Number(expMonth);
  const year = Number(expYear);
  return new Date(year, month, 1);
}
