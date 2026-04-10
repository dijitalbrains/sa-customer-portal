import { prisma } from "@/lib/prisma";
import { formatLongDate, formatShortDateTime, getMonthsRemaining } from "@/lib/utils/date";
import { formatAddress } from "@/lib/utils/address";
import { formatPrice } from "@/lib/utils/currency";
import {
  getValidityStatus,
  getValidityTypeText,
  getProgressPercent,
  getRemainingMonthsText,
} from "@/lib/utils/subscription";
import type {
  OrderView,
  SubscriptionView,
  SubscriptionItemView,
} from "@/lib/types/subscription";


type RawSubscription = Awaited<ReturnType<typeof fetchUserSubscriptions>>[number];
type RawSubscriptionItem = RawSubscription["subscription_items"][number];

export async function getFilterRenewalOrders(userId: number): Promise<OrderView[]> {
  const subscriptions = await fetchUserSubscriptions(userId);
  return groupSubscriptionsByOrder(subscriptions);
}

async function fetchUserSubscriptions(userId: number) {
  return prisma.subscriptions.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
    include: {
      products: true,
      orders: true,
      subscription_items: {
        where: { deleted_at: null },
        include: {
          products_subscription_items_product_idToproducts: true,
          user_addresses: { include: { states: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}


function groupSubscriptionsByOrder(subscriptions: RawSubscription[]): OrderView[] {
  const orderMap = new Map<string, OrderView>();

  for (const subscription of subscriptions) {
    const orderId = subscription.order_id
      ? String(subscription.order_id)
      : `no-order-${subscription.id}`;

    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        orderNumber: `SA-${subscription.order_id || subscription.id}`,
        placedDate: formatShortDateTime(subscription.orders?.created_at ?? null),
        subscriptions: [],
      });
    }

    orderMap.get(orderId)!.subscriptions.push(transformSubscription(subscription));
  }

  return Array.from(orderMap.values());
}


function transformSubscription(subscription: RawSubscription): SubscriptionView {
  return {
    title: getSubscriptionTitle(subscription),
    isLoyaltyEnabled: subscription.is_loyalty_enabled,
    hasPendingInstall: hasPendingInstall(subscription),
    subscriptionItems: subscription.subscription_items.map((item) =>
      transformSubscriptionItem(item, subscription)
    ),
  };
}

function transformSubscriptionItem(
  item: RawSubscriptionItem,
  subscription: RawSubscription
): SubscriptionItemView {
  const product = item.products_subscription_items_product_idToproducts;
  const status = getValidityStatus(item.ends_at, item.starts_at);
  const isExpired = status === "EXPIRED";
  const monthsRemaining = getMonthsRemaining(item.ends_at);

  return {
    productName: product.name,
    nickname: subscription.nickname || "",
    price: formatPrice(product.price),
    status: isExpired ? "expired" : "active",
    frequency: getValidityTypeText(item.validity_value, item.validity_type),
    remaining: isExpired ? null : getRemainingMonthsText(monthsRemaining),
    nextDate: formatLongDate(item.ends_at),
    shipTo: formatAddress(item.user_addresses),
    isLoyaltyEnabled: subscription.is_loyalty_enabled,
    productType: product.type || "",
    progress: getProgressPercent(item.starts_at, item.ends_at),
  };
}


function getSubscriptionTitle(subscription: RawSubscription): string {
  const name = subscription.products.technology || subscription.products.name;
  return subscription.nickname ? `${name} | ${subscription.nickname}` : name;
}

function hasPendingInstall(subscription: RawSubscription): boolean {
  return subscription.subscription_items.some(
    (item) => getValidityStatus(item.ends_at, item.starts_at) === "PENDING"
  );
}
