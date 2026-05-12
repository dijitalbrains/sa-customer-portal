import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils/date";
import { formatAddress } from "@/lib/utils/address";
import { getValidityStatus } from "@/lib/utils/subscription";
import { getPaymentMethod } from "@/lib/utils/payment";
import { calculateTax } from "@/lib/services/tax-service";
import { calculateShipping } from "@/lib/services/shipping-service";
import { getAvailableLinkedProducts } from "@/lib/services/linked-product-service";
import { applyLoyaltyDiscount, type LoyaltyPrice } from "@/lib/services/pricing-service";
import type {
  PriceLine,
  RenewalDetailResponse,
  RenewalItem,
  RenewalSubscription,
} from "@/lib/types/subscription";

type RawSubscription = NonNullable<Awaited<ReturnType<typeof fetchSubscription>>>;
type RawSubscriptionItem = RawSubscription["subscription_items"][number];
type RawProduct = RawSubscriptionItem["products_subscription_items_product_idToproducts"];

const SHOWER_FILTER_KEY = "shower-filter";
const P1_FILTER_KEY = "p1-filter";
const P1_INELIGIBLE_PRODUCT_KEYS = new Set([
  "shower-filter",
  "me-shower-adaptor",
  "me-hygiene-adaptor",
]);

export async function getRenewalDetail(
  subscriptionId: number,
  userId: number,
  isAdmin: boolean,
): Promise<RenewalDetailResponse | null> {
  const [sub, availableLinkedProducts, isUserTaxExempted] = await Promise.all([
    fetchSubscription(subscriptionId, userId),
    isAdmin ? getAvailableLinkedProducts() : Promise.resolve([]),
    fetchUserExemption(userId),
  ]);
  if (!sub) return null;

  const subscription = toSubscription(sub);
  const subscriptionItems = await Promise.all(
    sub.subscription_items.map((item) => toRenewalItem(item, subscription, isUserTaxExempted)),
  );

  return {
    subscriptionItems,
    subscriptionFlash: false,
    availableLinkedProducts,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

function fetchSubscription(subscriptionId: number, userId: number) {
  return prisma.subscriptions.findFirst({
    where: { id: subscriptionId, user_id: userId, deleted_at: null },
    include: {
      products: true,
      subscription_items: {
        where: { deleted_at: null },
        include: {
          products_subscription_items_product_idToproducts: true,
          products_subscription_items_linked_product_idToproducts: true,
          user_addresses: {
            include: {
              states: true,
              countries: { select: { code: true, tax_source: true, tax_percent: true } },
            },
          },
          user_stripe_sources: true,
          user_bank_accounts: true,
        },
      },
    },
  });
}

async function fetchUserExemption(userId: number): Promise<boolean> {
  const user = await prisma.users.findFirst({
    where: { id: userId },
    select: { is_tax_exempted: true },
  });
  return user?.is_tax_exempted ?? false;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function toSubscription(sub: RawSubscription): RenewalSubscription {
  const baseProductKey = sub.products.key ?? "";
  const hasP1Filter = sub.subscription_items.some(
    (i) => i.products_subscription_items_product_idToproducts.key === P1_FILTER_KEY,
  );

  return {
    id: Number(sub.id),
    nickname: sub.nickname ?? "",
    technology: sub.products.technology || sub.products.name,
    zone: sub.zone,
    isLoyaltyEnabled: sub.is_loyalty_enabled,
    isShowerFilter: baseProductKey === SHOWER_FILTER_KEY,
    canAddP1Filter: !hasP1Filter && !P1_INELIGIBLE_PRODUCT_KEYS.has(baseProductKey),
    productKey: baseProductKey,
    countryId: sub.country_id ?? null,
    stateId: sub.state_id ?? null,
    city: sub.city ?? "",
    zip: sub.zip ?? "",
    householdSize: sub.household_size,
    isWellWater: sub.is_well_water,
    hasFiltrationSystem: sub.has_filtration_system,
    hasMicronSystem: sub.has_micron_system,
  };
}

async function toRenewalItem(
  item: RawSubscriptionItem,
  subscription: RenewalSubscription,
  isUserTaxExempted: boolean,
): Promise<RenewalItem> {
  const product = item.products_subscription_items_product_idToproducts;
  const linked = item.products_subscription_items_linked_product_idToproducts;

  const productPricing = priceWithLoyalty(product, subscription.isLoyaltyEnabled);
  const linkedPricing = linked ? priceWithLoyalty(linked, subscription.isLoyaltyEnabled) : null;

  const subTotal = calcSubTotal(item, productPricing, linkedPricing);

  const shippingResult = item.user_address_id
    ? await calculateShipping({
        productId: item.product_id,
        linkedProductId: item.linked_product_id ?? null,
        linkedProductQuantity: item.linked_product_quantity ?? 1,
        quantity: item.quantity,
        userAddressId: Number(item.user_address_id),
      })
    : { shippingPrice: 0, estimatedTax: 0 };
  const shipping = shippingResult.shippingPrice;

  const taxBreakdown = await calculateTax({
    subtotal: subTotal,
    address: item.user_addresses
      ? {
          zip: item.user_addresses.zip,
          city: item.user_addresses.city,
          street: item.user_addresses.street,
          countries: item.user_addresses.countries,
        }
      : null,
    isUserTaxExempted,
  });

  const status = getValidityStatus(item.ends_at);
  const isPending = status === "PENDING";
  const isExpired = status === "EXPIRED";

  return {
    id: Number(item.id),
    productName: product.name,
    productKey: product.key,
    productImage: buildImageUrl(product.image),
    productType: product.type ?? "",
    status: isExpired ? "expired" : isPending ? "pending" : "active",
    isPending,
    isP1Filter: product.key === P1_FILTER_KEY,
    validityType: item.validity_type,
    validityValue: item.validity_value,
    endsAt: item.ends_at ? item.ends_at.toISOString() : null,
    upcomingReminder: item.upcoming_reminder ? item.upcoming_reminder.toISOString() : null,
    nextReminderDate: isPending
      ? "Pending Install"
      : formatShortDate(subscription.isLoyaltyEnabled ? item.ends_at : item.upcoming_reminder),
    shipTo: formatAddress(item.user_addresses),
    userAddressId: item.user_address_id ? Number(item.user_address_id) : null,
    payment: getPaymentMethod(item),
    quantity: item.quantity,
    linkedProductName: linked?.name ?? null,
    linkedProductPrice: linkedPricing?.price ?? null,
    linkedProductQuantity: item.linked_product_quantity ?? null,

    pricingLines: buildPricingLines(item, product, linked, subscription.zone, productPricing, linkedPricing),
    subTotal,
    shipping,
    taxPercent: taxBreakdown.taxPercent,
    tax: taxBreakdown.tax,
    estimatedTax: taxBreakdown.estimatedTax,
    taxExempted: taxBreakdown.taxExempted,
    taxSource: taxBreakdown.source,
    total: round2(subTotal + shipping + taxBreakdown.tax),

    subscription,
  };
}

// ─── Calculations ────────────────────────────────────────────────────────────

function calcSubTotal(
  item: RawSubscriptionItem,
  product: LoyaltyPrice,
  linked: LoyaltyPrice | null,
): number {
  const main = product.price * item.quantity;
  const linkedQty = (item.linked_product_quantity ?? 1) * item.quantity;
  const linkedTotal = linked ? linked.price * linkedQty : 0;
  return round2(main + linkedTotal);
}

function buildPricingLines(
  item: RawSubscriptionItem,
  product: RawProduct,
  linked: RawProduct | null,
  zone: number,
  productPricing: LoyaltyPrice,
  linkedPricing: LoyaltyPrice | null,
): PriceLine[] {
  const lines: PriceLine[] = [linePrice(product.name, productPricing, item.quantity)];

  if (linked && linkedPricing) {
    const linkedQty = (item.linked_product_quantity ?? 1) * item.quantity;
    lines.push(linePrice(`Zone ${zone} (${linked.name})`, linkedPricing, linkedQty));
  }

  return lines;
}

function linePrice(label: string, pricing: LoyaltyPrice, quantity: number): PriceLine {
  return {
    label,
    amount: round2(pricing.price * quantity),
    originalAmount:
      pricing.actualPrice !== null ? round2(pricing.actualPrice * quantity) : null,
  };
}

function priceWithLoyalty(product: RawProduct, isLoyaltyEnabled: boolean): LoyaltyPrice {
  return applyLoyaltyDiscount({
    rawPrice: product.price ?? null,
    loyaltyDiscountUnit: product.loyalty_discount_unit ?? null,
    loyaltyDiscountValue:
      product.loyalty_discount_value !== null ? Number(product.loyalty_discount_value) : null,
    isLoyaltyEnabled,
  });
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildImageUrl(filename: string | null): string {
  if (!filename) return "/assets/images/product-placeholder.svg";
  const base = process.env.LANDING_URL ?? "";
  return `${base}/images/${filename}`;
}


export async function updateSubscriptionItemAddress(
  itemId: number,
  userId: number,
  addressId: number,
): Promise<{ subscriptionId: number }> {
  const item = await prisma.subscription_items.findFirst({
    where: {
      id: itemId,
      subscriptions: { is: { user_id: userId } },
    },
    select: { id: true, subscription_id: true },
  });
  if (!item || item.subscription_id === null) {
    throw new Error("Subscription item not found");
  }

  const address = await prisma.user_addresses.findFirst({
    where: { id: addressId, user_id: userId, deleted_at: null },
    select: { id: true },
  });
  if (!address) throw new Error("Address not found");

  await prisma.subscription_items.update({
    where: { id: itemId },
    data: { user_address_id: addressId },
  });

  return { subscriptionId: Number(item.subscription_id) };
}
