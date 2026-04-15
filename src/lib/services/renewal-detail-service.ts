import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils/date";
import { formatAddress } from "@/lib/utils/address";
import { getValidityStatus } from "@/lib/utils/subscription";
import { getPaymentMethod } from "@/lib/utils/payment";
import type {
  SubscriptionDetail,
  RenewalItem,
  PriceLine,
  LinkedProductOption,
} from "@/lib/types/subscription";

type RawSubscription = NonNullable<Awaited<ReturnType<typeof fetchSubscription>>>;
type RawSubscriptionItem = RawSubscription["subscription_items"][number];

const SHOWER_FILTER_KEY = "shower-filter";
const P1_INELIGIBLE_PRODUCT_KEYS = new Set([
  "shower-filter",
  "me-shower-adaptor",
  "me-hygiene-adaptor",
]);
const LINKED_PRODUCT_KEYS = [
  "p1-filter",
  "p2-p3-filters",
  "p2-p3-p3-p4-filters",
  "p3-filter",
  "p3-p4-filters",
  "p4-filter",
];

export async function getRenewalDetail(
  subscriptionId: number,
  userId: number,
  isAdmin: boolean,
): Promise<SubscriptionDetail | null> {
  const [sub, availableLinkedProducts] = await Promise.all([
    fetchSubscription(subscriptionId, userId),
    isAdmin ? fetchAvailableLinkedProducts() : Promise.resolve([]),
  ]);
  if (!sub) return null;
  return toDetail(sub, availableLinkedProducts);
}

async function fetchAvailableLinkedProducts(): Promise<LinkedProductOption[]> {
  const rows = await prisma.products.findMany({
    where: { key: { in: LINKED_PRODUCT_KEYS }, deleted_at: null },
    select: { id: true, key: true, name: true, price: true },
    orderBy: { name: "asc" },
  });

  const noFilter: LinkedProductOption = { id: null, key: null, name: "No Zone Filter", price: 0 };
  return [noFilter, ...rows.map((r) => ({ id: r.id, key: r.key, name: r.name, price: r.price ?? 0 }))];
}

async function fetchSubscription(subscriptionId: number, userId: number) {
  return prisma.subscriptions.findFirst({
    where: { id: subscriptionId, user_id: userId, deleted_at: null },
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
  });
}

function toDetail(
  sub: RawSubscription,
  availableLinkedProducts: LinkedProductOption[],
): SubscriptionDetail {
  const items = sub.subscription_items.map((item) => toRenewalItem(item, sub));
  const hasP1Filter = items.some((i) => i.isP1Filter);
  const baseProductKey = sub.products.key ?? "";

  return {
    id: Number(sub.id),
    technology: sub.products.technology || sub.products.name,
    nickname: sub.nickname ?? "",
    zone: sub.zone,
    isLoyaltyEnabled: sub.is_loyalty_enabled,
    canAddP1Filter: !hasP1Filter && !P1_INELIGIBLE_PRODUCT_KEYS.has(baseProductKey),
    isShowerFilter: baseProductKey === SHOWER_FILTER_KEY,
    availableLinkedProducts,
    items,
  };
}

function toRenewalItem(item: RawSubscriptionItem, sub: RawSubscription): RenewalItem {
  const product = item.products_subscription_items_product_idToproducts;
  const linked = item.products_subscription_items_linked_product_idToproducts;
  const status = getValidityStatus(item.ends_at);
  const isPending = status === "PENDING";
  const isExpired = status === "EXPIRED";

  const subTotal = calcSubTotal(item);
  const shipping = product.renewal_shipping_price ?? product.shipping_price ?? 0;
  const taxPercent = 0;
  const tax = Math.round(subTotal * taxPercent) / 100;
  const total = Math.round((subTotal + shipping + tax) * 100) / 100;

  return {
    id: Number(item.id),
    productName: product.name,
    productType: product.type ?? "",
    technology: sub.products.technology || sub.products.name,
    zone: sub.zone,
    status: isExpired ? "expired" : isPending ? "pending" : "active",
    isPending,
    nextReminderDate: isPending
      ? "Pending Install"
      : formatShortDate(sub.is_loyalty_enabled ? item.ends_at : item.upcoming_reminder),
    shipTo: formatAddress(item.user_addresses),
    pricingLines: buildPricingLines(item, product, linked, sub.zone),
    subTotal,
    shipping,
    taxPercent,
    tax,
    total,
    isP1Filter: product.key === "p1-filter",
    payment: getPaymentMethod(item),
    quantity: item.quantity,
    linkedProductName: linked?.name ?? null,
    linkedProductPrice: linked?.price ?? null,
    linkedProductQuantity: item.linked_product_quantity ?? null,
  };
}

function calcSubTotal(item: RawSubscriptionItem): number {
  const product = item.products_subscription_items_product_idToproducts;
  const linked = item.products_subscription_items_linked_product_idToproducts;
  const main = (product.price ?? 0) * item.quantity;
  const linkedQty = (item.linked_product_quantity ?? 1) * item.quantity;
  const linkedTotal = linked ? (linked.price ?? 0) * linkedQty : 0;
  return Math.round((main + linkedTotal) * 100) / 100;
}

function buildPricingLines(
  item: RawSubscriptionItem,
  product: RawSubscriptionItem["products_subscription_items_product_idToproducts"],
  linked: RawSubscriptionItem["products_subscription_items_linked_product_idToproducts"],
  zone: number,
): PriceLine[] {
  const lines: PriceLine[] = [
    { label: product.name, amount: (product.price ?? 0) * item.quantity },
  ];

  if (linked) {
    const linkedQty = (item.linked_product_quantity ?? 1) * item.quantity;
    lines.push({
      label: `Zone ${zone} (${linked.name})`,
      amount: (linked.price ?? 0) * linkedQty,
    });
  }

  return lines;
}

