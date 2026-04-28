import { prisma } from "@/lib/prisma";
import { formatShortDate, formatShortDateTime, getMonthsRemaining } from "@/lib/utils/date";
import { formatAddress } from "@/lib/utils/address";
import { formatPrice } from "@/lib/utils/currency";
import {
  getValidityStatus,
  getValidityTypeText,
  getProgressPercent,
  getRemainingMonthsText,
} from "@/lib/utils/subscription";
import { getPaymentMethod } from "@/lib/utils/payment";
import type {
  RenewalOrder,
  RenewalListGroup,
  RenewalListItem,
} from "@/lib/types/subscription";

type RawOrder = Awaited<ReturnType<typeof fetchUserOrders>>[number];
type RawSubscription = RawOrder["subscriptions"][number];
type RawSubscriptionItem = RawSubscription["subscription_items"][number];

export async function getRenewals(userId: number): Promise<RenewalOrder[]> {
  const orders = await fetchUserOrders(userId);
  return orders.map(toRenewalOrder);
}

async function fetchUserOrders(userId: number) {
  return prisma.orders.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      subscriptions: { some: { deleted_at: null } },
    },
    include: {
      subscriptions: {
        where: { deleted_at: null },
        include: {
          products: true,
          subscription_items: {
            where: { deleted_at: null },
            include: {
              products_subscription_items_product_idToproducts: true,
              products_subscription_items_linked_product_idToproducts: true,
              user_addresses: { include: { states: true } },
              user_stripe_sources: true,
              user_bank_accounts: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

function toRenewalOrder(order: RawOrder): RenewalOrder {
  const subscriptions = order.subscriptions.map(toListGroup);

  return {
    placedDate: formatShortDateTime(order.created_at),
    subscriptions,
    hasExpiredItem: subscriptions.some((g) =>
      g.subscriptionItems.some((i) => i.status === "expired"),
    ),
    hasFailedCard: subscriptions.some(
      (g) =>
        g.isLoyaltyEnabled &&
        g.subscriptionItems.some((i) => i.payment?.type === "card" && i.payment.isFailed),
    ),
  };
}

function toListGroup(sub: RawSubscription): RenewalListGroup {
  const technology = sub.products.technology || sub.products.name;

  return {
    title: sub.nickname ? `${technology} | ${sub.nickname}` : technology,
    isLoyaltyEnabled: sub.is_loyalty_enabled,
    hasPendingInstall: sub.subscription_items.some(
      (i) => getValidityStatus(i.ends_at) === "PENDING",
    ),
    subscriptionItems: sub.subscription_items.map((item) => toListItem(item, sub)),
  };
}

function toListItem(item: RawSubscriptionItem, sub: RawSubscription): RenewalListItem {
  const product = item.products_subscription_items_product_idToproducts;
  const status = getValidityStatus(item.ends_at);
  const isExpired = status === "EXPIRED";
  const isPending = status === "PENDING";

  return {
    id: Number(item.id),
    subscriptionId: Number(sub.id),
    productName: product.name,
    nickname: sub.nickname || "",
    price: formatPrice(calcSubtotal(item)),
    status: isExpired ? "expired" : "active",
    frequency: getValidityTypeText(item.validity_value, item.validity_type),
    remaining:
      isPending || isExpired
        ? null
        : getRemainingMonthsText(getMonthsRemaining(item.ends_at)),
    nextDate: isPending
      ? "Pending Install"
      : formatShortDate(sub.is_loyalty_enabled ? item.ends_at : item.upcoming_reminder),
    shipTo: formatAddress(item.user_addresses),
    isLoyaltyEnabled: sub.is_loyalty_enabled,
    productType: product.type || "",
    progress: getProgressPercent(item.starts_at, item.ends_at),
    payment: getPaymentMethod(item),
  };
}

function calcSubtotal(item: RawSubscriptionItem): number {
  const product = item.products_subscription_items_product_idToproducts;
  const linkedProduct = item.products_subscription_items_linked_product_idToproducts;

  const main = (product.price ?? 0) * item.quantity;
  const linkedQty = (item.linked_product_quantity ?? 1) * item.quantity;
  const linked = linkedProduct ? (linkedProduct.price ?? 0) * linkedQty : 0;

  return Math.round((main + linked) * 100) / 100;
}
