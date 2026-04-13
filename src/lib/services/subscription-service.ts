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

export async function getFilterRenewal(userId: number): Promise<Order[]> {
  const subscriptions = await fetchUserSubscriptions(userId);
  return groupSubscriptionsByOrder(subscriptions);
}

async function fetchUserSubscriptions(userId: number) {
  return prisma.subscriptions.findMany({
    where: { user_id: userId, deleted_at: null },
    include: {
      products: true,
      orders: true,
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
    orderBy: { created_at: "desc" },
  });
}

function groupSubscriptionsByOrder(subscriptions: RawSubscription[]): Order[] {
  const map = new Map<string, Order>();

  for (const sub of subscriptions) {
    const key = sub.order_id ? String(sub.order_id) : `no-order-${sub.id}`;

    if (!map.has(key)) {
      map.set(key, {
        placedDate: formatShortDateTime(sub.orders?.created_at ?? null),
        hasExpiredItem: false,
        hasFailedCard: false,
        subscriptions: [],
      });
    }

    const transformed = transformSubscription(sub);
    const order = map.get(key)!;
    order.subscriptions.push(transformed);

    if (transformed.subscriptionItems.some((i) => i.status === "expired")) {
      order.hasExpiredItem = true;
    }

    if (
      transformed.isLoyaltyEnabled &&
      transformed.subscriptionItems.some(
        (i) => i.payment?.type === "card" && i.payment.isFailed
      )
    ) {
      order.hasFailedCard = true;
    }
  }

  return Array.from(map.values());
}

function transformSubscription(sub: RawSubscription): Subscription {
  return {
    title: getTitle(sub),
    isLoyaltyEnabled: sub.is_loyalty_enabled,
    hasPendingInstall: sub.subscription_items.some(
      (i) => getValidityStatus(i.ends_at) === "PENDING"
    ),
    subscriptionItems: sub.subscription_items.map((item) =>
      transformSubscriptionItem(item, sub)
    ),
  };
}

function transformSubscriptionItem(
  item: RawSubscriptionItem,
  sub: RawSubscription
): SubscriptionItem {
  const product = item.products_subscription_items_product_idToproducts;
  const status = getValidityStatus(item.ends_at);
  const isExpired = status === "EXPIRED";
  const isPending = status === "PENDING";

  return {
    detailUrl: getDetailUrl(item, sub, product.type),
    productName: product.name,
    nickname: sub.nickname || "",
    price: formatPrice(getSubtotal(item)),
    status: isExpired ? "expired" : "active",
    frequency: getValidityTypeText(item.validity_value, item.validity_type),
    remaining: isPending || isExpired ? null : getRemainingMonthsText(getMonthsRemaining(item.ends_at)),
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

function getSubtotal(item: RawSubscriptionItem): number {
  const product = item.products_subscription_items_product_idToproducts;
  const linkedProduct = item.products_subscription_items_linked_product_idToproducts;

  const main = (product.price ?? 0) * item.quantity;
  const linkedQty = (item.linked_product_quantity ?? 1) * item.quantity;
  const linked = linkedProduct ? (linkedProduct.price ?? 0) * linkedQty : 0;

  return Math.round((main + linked) * 100) / 100;
}

function getPaymentMethod(item: RawSubscriptionItem): PaymentMethod {
  if (item.user_bank_accounts) {
    return {
      type: "bank",
      bankName: item.user_bank_accounts.bank_name || "",
      last4: item.user_bank_accounts.last4 || "",
    };
  }

  if (!item.user_stripe_sources) return null;

  const card = item.user_stripe_sources;
  const status = getCardStatus(card);

  return {
    type: "card",
    brandImage: getCardBrandImage(card.brand),
    last4: card.last4,
    statusText: getCardStatusText(status),
    isFailed: status === "FAILED" || status === "EXPIRED",
    isExpiringSoon: status === "EXPIRING_SOON",
  };
}

function getTitle(sub: RawSubscription): string {
  const name = sub.products.technology || sub.products.name;
  return sub.nickname ? `${name} | ${sub.nickname}` : name;
}

function getDetailUrl(
  item: RawSubscriptionItem,
  sub: RawSubscription,
  productType: string | null
): string {
  const base = `/detail/${sub.id}`;
  return productType === "PRESET_FILTER" ? `${base}?id=${item.id}` : base;
}
