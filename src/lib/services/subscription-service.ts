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
import {
  getCardStatus,
  getCardStatusText,
  getCardBrandImage,
} from "@/lib/utils/payment";
import type {
  Order,
  Subscription,
  SubscriptionItem,
  PaymentMethod,
} from "@/lib/types/subscription";


type RawSubscription = Awaited<ReturnType<typeof fetchUserSubscriptions>>[number];
type RawSubscriptionItem = RawSubscription["subscription_items"][number];

export async function getFilterRenewalOrders(userId: number): Promise<Order[]> {
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
          user_stripe_sources: true,
          user_bank_accounts: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}


function groupSubscriptionsByOrder(subscriptions: RawSubscription[]): Order[] {
  const orderMap = new Map<string, Order>();

  for (const subscription of subscriptions) {
    const orderId = subscription.order_id
      ? String(subscription.order_id)
      : `no-order-${subscription.id}`;

    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        placedDate: formatShortDateTime(subscription.orders?.created_at ?? null),
        hasExpiredItem: false,
        hasFailedCard: false,
        subscriptions: [],
      });
    }

    const transformedSubscription = transformSubscription(subscription);
    const order = orderMap.get(orderId)!;
    order.subscriptions.push(transformedSubscription);

    if (transformedSubscription.subscriptionItems.some((item) => item.status === "expired")) {
      order.hasExpiredItem = true;
    }

    if (
      transformedSubscription.isLoyaltyEnabled &&
      transformedSubscription.subscriptionItems.some(
        (item) => item.payment?.type === "card" && item.payment.isFailed
      )
    ) {
      order.hasFailedCard = true;
    }
  }

  return Array.from(orderMap.values());
}


function transformSubscription(subscription: RawSubscription): Subscription {
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
): SubscriptionItem {
  const product = item.products_subscription_items_product_idToproducts;
  const status = getValidityStatus(item.ends_at, item.starts_at);
  const isExpired = status === "EXPIRED";
  const monthsRemaining = getMonthsRemaining(item.ends_at);

  return {
    detailUrl: getDetailUrl(item, subscription, product.type),
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
    payment: getPaymentMethod(item),
  };
}

function getPaymentMethod(item: RawSubscriptionItem): PaymentMethod {
  if (item.user_bank_accounts) {
    return {
      type: "bank",
      bankName: item.user_bank_accounts.bank_name || "",
      last4: item.user_bank_accounts.last4 || "",
    };
  }

  if (item.user_stripe_sources) {
    const card = item.user_stripe_sources;
    const cardStatus = getCardStatus({
      has_failed: card.has_failed,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
    });

    return {
      type: "card",
      brandImage: getCardBrandImage(card.brand),
      last4: card.last4,
      statusText: getCardStatusText(cardStatus),
      isFailed: cardStatus === "FAILED" || cardStatus === "EXPIRED",
      isExpiringSoon: cardStatus === "EXPIRING_SOON",
    };
  }

  return null;
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

function getDetailUrl(
  item: RawSubscriptionItem,
  subscription: RawSubscription,
  productType: string | null
): string {
  const base = `/detail/${subscription.id}`;
  return productType === "PRESET_FILTER" ? `${base}?id=${item.id}` : base;
}
