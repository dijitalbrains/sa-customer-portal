import "server-only";
import { prisma } from "@/lib/prisma";
import { redis, REDIS_PREFIX, CART_TTL_SECONDS } from "@/lib/redis";
import { round2 } from "@/lib/utils/currency";
import { formatAddress } from "@/lib/utils/address";
import {
  applyLoyaltyDiscount,
  calculateItemSubtotal,
  formatLineLabel,
  type LoyaltyPrice,
} from "@/lib/services/pricing-service";
import { calculateShipping } from "@/lib/services/shipping-service";
import { calculateTax } from "@/lib/services/tax-service";
import { determineProductPackages, type ShipmentPackage } from "@/lib/services/product-service";
import { getRates as getFedexRates } from "@/lib/services/fedex-service";
import type {
  AddToCartResult,
  Cart,
  CartAddressSnapshot,
  CartBankSnapshot,
  CartCardSnapshot,
  CartItem,
  CartProductSnapshot,
} from "@/lib/types/cart";
import type { PriceLine } from "@/lib/types/subscription";

type RawCartItem = NonNullable<Awaited<ReturnType<typeof fetchSubscriptionItemForCart>>>;
type RawProduct = RawCartItem["products_subscription_items_product_idToproducts"];
type RawAddress = NonNullable<RawCartItem["user_addresses"]>;

const FEDEX_RENEWAL_PRODUCT_KEYS = new Set([
  "ultimate-renewal-filters",
  "rv-renewal-filters",
  "wet6-renewal-filters",
  "wet5-renewal-filters",
]);

export async function loadCart(userId: number): Promise<Cart | null> {
  const key = cartKey(userId);
  const raw = await redis.get(key);
  if (!raw) return null;
  await redis.expire(key, CART_TTL_SECONDS);
  return JSON.parse(raw) as Cart;
}

export async function saveCart(userId: number, cart: Cart): Promise<void> {
  await redis.setex(cartKey(userId), CART_TTL_SECONDS, JSON.stringify(cart));
}

export async function clearCart(userId: number): Promise<void> {
  await redis.del(cartKey(userId));
}

export async function addItemToCart(
  userId: number,
  subscriptionItemId: number,
  quantity: number,
): Promise<AddToCartResult> {
  const raw = await fetchSubscriptionItemForCart(subscriptionItemId, userId);
  if (!raw) throw new Error("Subscription item not found");
  if (!raw.subscriptions) throw new Error("Subscription not found");

  const cartItem = await buildCartItem(raw, quantity);

  let cart = await loadCart(userId);
  if (cart && cart.items.length === 0) cart = null;

  if (!cart) {
    cart = await initEmptyCart(userId);
  }

  if (
    cart.items.length > 0 &&
    cart.items[0].userAddress.countryId !== cartItem.userAddress.countryId
  ) {
    throw new Error("Cannot be added to cart");
  }

  cart.currency = cartItem.userAddress.currency;
  cart.country = cartItem.userAddress.country;

  const existingIndex = cart.items.findIndex((i) => i.id === cartItem.id);
  if (existingIndex !== -1) {
    cart.items[existingIndex] = cartItem;
  } else {
    cart.items.push(cartItem);
  }
  cart = await processCart(cart);
  await saveCart(userId, cart);
  return { cart, addedItem: cartItem };
}

export async function updateCartItemQuantity(
  userId: number,
  subscriptionItemId: number,
  quantity: number,
): Promise<Cart | null> {
  const cart = await loadCart(userId);
  if (!cart) return null;

  const index = cart.items.findIndex((i) => i.id === subscriptionItemId);
  if (index === -1) return cart;

  const raw = await fetchSubscriptionItemForCart(subscriptionItemId, userId);
  if (!raw) throw new Error("Subscription item not found");

  cart.items[index] = await buildCartItem(raw, quantity);
  const processed = await processCart(cart);
  await saveCart(userId, processed);
  return processed;
}

export async function getCartItemCount(userId: number): Promise<number> {
  const cart = await loadCart(userId);
  return cart?.items.length ?? 0;
}

export async function applyCartCredits(
  userId: number,
  creditBalanceUsd: number,
): Promise<Cart | null> {
  const cart = await loadCart(userId);
  if (!cart) return null;
  const exchangeRate = cart.currency?.exchangeRate ?? 1;
  const exchanged = round2(creditBalanceUsd * exchangeRate);
  cart.creditsUsed = exchanged >= cart.total ? cart.total : exchanged;
  await saveCart(userId, cart);
  return cart;
}

export async function removeCartCredits(userId: number): Promise<Cart | null> {
  const cart = await loadCart(userId);
  if (!cart) return null;
  cart.creditsUsed = 0;
  await saveCart(userId, cart);
  return cart;
}

export async function changeAllCartItemsAddress(
  userId: number,
  userAddressId: number,
): Promise<Cart | null> {
  const cart = await loadCart(userId);
  if (!cart) return null;

  const newAddress = await prisma.user_addresses.findFirst({
    where: { id: userAddressId, user_id: userId, deleted_at: null },
    include: {
      states: true,
      countries: { include: { currencies: true } },
    },
  });
  if (!newAddress) throw new Error("Address not found");

  const updatedItems: CartItem[] = [];
  for (const item of cart.items) {
    const raw = await fetchSubscriptionItemForCart(item.id, userId);
    if (!raw) continue;
    updatedItems.push(await buildCartItem(raw, item.quantity, newAddress));
  }

  cart.items = updatedItems;
  if (updatedItems.length > 0) {
    cart.currency = updatedItems[0].userAddress.currency;
    cart.country = updatedItems[0].userAddress.country;
  }

  const processed = await processCart(cart);
  await saveCart(userId, processed);
  return processed;
}

export async function changeCartPaymentMethod(
  userId: number,
  selection: { type: "card" | "bank"; id: number },
): Promise<Cart | null> {
  const cart = await loadCart(userId);
  if (!cart) return null;

  if (selection.type === "card") {
    const card = await prisma.user_stripe_sources.findFirst({
      where: { id: selection.id, user_id: userId, deleted_at: null },
    });
    if (!card) throw new Error("Card not found");
    cart.userStripeSource = toCardSnapshot(card);
    cart.userBankAccount = null;
  } else {
    const bank = await prisma.user_bank_accounts.findFirst({
      where: { id: selection.id, user_id: userId, deleted_at: null },
    });
    if (!bank) throw new Error("Bank account not found");
    cart.userBankAccount = toBankSnapshot(bank);
    cart.userStripeSource = null;
  }

  const processed = await processCart(cart);
  await saveCart(userId, processed);
  return processed;
}

export async function removeItemFromCart(
  userId: number,
  subscriptionItemId: number,
): Promise<Cart | null> {
  const cart = await loadCart(userId);
  if (!cart) return null;

  cart.items = cart.items.filter((i) => i.id !== subscriptionItemId);
  if (cart.items.length === 0) {
    await clearCart(userId);
    return null;
  }

  const processed = await processCart(cart);
  await saveCart(userId, processed);
  return processed;
}

export async function processCart(cart: Cart): Promise<Cart> {
  if (cart.items.length === 0) {
    cart.subtotal = 0;
    cart.shippingPrice = 0;
    cart.tax = 0;
    cart.taxExempted = null;
    cart.estimatedTax = 0;
    cart.ccProcessingFee = 0;
    cart.total = 0;
    return cart;
  }

  const subtotal = round2(cart.items.reduce((s, i) => s + i.subtotal, 0));
  cart.subtotal = subtotal;

  const country = cart.items[0].userAddress.country;
  if (country.shippingPriceSource === "FEDEX") {
    const rates = await getFedexRatesForCart(cart);
    const hasShippingPriceChanged = cart.items.some((i) => i.shippingPriceChanged);
    cart.shippingPrice = hasShippingPriceChanged
      ? round2(cart.items.reduce((s, i) => s + i.shippingPrice, 0))
      : rates.shippingPrice;
    cart.estimatedTax = rates.estimatedDutiesAndTax;
    cart.tax = 0;
    cart.taxExempted = null;
    cart.total = round2(subtotal + cart.shippingPrice);
  } else {
    cart.tax = round2(cart.items.reduce((s, i) => s + i.tax, 0));
    const taxExempted = round2(
      cart.items.reduce((s, i) => s + (i.taxExempted ?? 0), 0),
    );
    cart.taxExempted = taxExempted === 0 ? null : taxExempted;
    cart.shippingPrice = round2(cart.items.reduce((s, i) => s + i.shippingPrice, 0));
    cart.estimatedTax = 0;
    cart.total = round2(subtotal + cart.shippingPrice + cart.tax);
  }

  cart.ccProcessingFee = 0;
  if (cart.userStripeSource && !cart.userBankAccount) {
    cart.ccProcessingFee = round2(cart.total * 0.03);
    cart.total = round2(cart.total + cart.ccProcessingFee);
  }

  return cart;
}

interface EnrichedPackage {
  package: ShipmentPackage;
  productKey: string;
  p1AndShowerFiltersAdded: number;
}

async function getFedexRatesForCart(cart: Cart): Promise<{
  shippingPrice: number;
  estimatedDutiesAndTax: number;
}> {
  const groups = new Map<number, CartItem[]>();
  for (const item of cart.items) {
    const list = groups.get(item.userAddress.id) ?? [];
    list.push(item);
    groups.set(item.userAddress.id, list);
  }

  let shippingPrice = 0;
  let estimatedDutiesAndTax = 0;

  for (const groupItems of groups.values()) {
    const enriched: EnrichedPackage[] = [];
    const address = groupItems[0].userAddress;
    const amount = groupItems.reduce((s, i) => s + i.subtotal, 0);

    const p1AndShowerItems = groupItems.filter(
      (i) => i.product.key === "p1-filter" || i.product.key === "shower-filter",
    );
    const fullRenewalItems = groupItems.filter((i) => i.product.type === "RENEWAL_FILTER");
    const otherItems = groupItems.filter(
      (i) =>
        i.product.key !== "p1-filter" &&
        i.product.key !== "shower-filter" &&
        i.product.type !== "RENEWAL_FILTER",
    );

    for (const item of fullRenewalItems) {
      const pkgs = await packagesFor(item);
      for (const pkg of pkgs) {
        enriched.push({ package: pkg, productKey: item.product.key, p1AndShowerFiltersAdded: 0 });
      }
    }

    let p1AndShowerCount = 0;
    for (const item of p1AndShowerItems) {
      p1AndShowerCount += item.quantity;
      const p1Pkgs = await packagesFor(item);
      const p1Pkg = p1Pkgs[0];
      if (!p1Pkg) continue;

      for (const slot of enriched) {
        if (
          p1AndShowerCount > 0 &&
          FEDEX_RENEWAL_PRODUCT_KEYS.has(slot.productKey) &&
          slot.p1AndShowerFiltersAdded + item.quantity < 4
        ) {
          slot.package.weight_lbs += p1Pkg.weight_lbs;
          slot.p1AndShowerFiltersAdded = item.quantity;
          p1AndShowerCount -= item.quantity;
        }
      }
    }

    if (p1AndShowerCount > 0 && p1AndShowerItems.length > 0) {
      const last = p1AndShowerItems[p1AndShowerItems.length - 1];
      for (const pkg of await packagesFor(last)) {
        enriched.push({ package: pkg, productKey: last.product.key, p1AndShowerFiltersAdded: 0 });
      }
    }

    for (const item of otherItems) {
      for (const pkg of await packagesFor(item)) {
        enriched.push({ package: pkg, productKey: item.product.key, p1AndShowerFiltersAdded: 0 });
      }
    }

    const rates = await getFedexRates(
      amount,
      addressForFedex(address),
      enriched.map((e) => e.package),
    );
    shippingPrice += rates.shippingPrice;
    estimatedDutiesAndTax += rates.estimatedTax;
  }

  return {
    shippingPrice: round2(shippingPrice),
    estimatedDutiesAndTax: round2(estimatedDutiesAndTax),
  };
}

function packagesFor(item: CartItem): Promise<ShipmentPackage[]> {
  return determineProductPackages({
    product: { id: item.product.id, key: item.product.key, type: item.product.type },
    quantity: item.quantity,
    linkedProductId: item.linkedProduct?.id ?? null,
    linkedProductQuantity: (item.linkedProductQuantity ?? 1) * item.quantity,
  });
}

function cartKey(userId: number): string {
  return `${REDIS_PREFIX}cart:user:${userId}`;
}

async function initEmptyCart(userId: number): Promise<Cart> {
  const [bank, card] = await Promise.all([
    prisma.user_bank_accounts.findFirst({
      where: { user_id: userId, is_default: true, deleted_at: null },
    }),
    prisma.user_stripe_sources.findFirst({
      where: { user_id: userId, is_default: true, deleted_at: null },
    }),
  ]);

  const userBankAccount = bank ? toBankSnapshot(bank) : null;
  const userStripeSource = !bank && card ? toCardSnapshot(card) : null;

  return {
    items: [],
    subtotal: 0,
    shippingPrice: 0,
    tax: 0,
    taxExempted: null,
    estimatedTax: 0,
    ccProcessingFee: 0,
    creditsUsed: 0,
    total: 0,
    notes: "",
    chargeFailed: false,
    currency: null,
    country: null,
    userStripeSource,
    userBankAccount,
  };
}

function fetchSubscriptionItemForCart(subscriptionItemId: number, userId: number) {
  return prisma.subscription_items.findFirst({
    where: {
      id: subscriptionItemId,
      deleted_at: null,
      subscriptions: { user_id: userId, deleted_at: null },
    },
    include: {
      products_subscription_items_product_idToproducts: {
        select: {
          id: true,
          image: true,
          key: true,
          loyalty_discount_unit: true,
          loyalty_discount_value: true,
          name: true,
          price: true,
          requires_shipping: true,
          type: true,
        },
      },
      products_subscription_items_linked_product_idToproducts: {
        select: {
          id: true,
          image: true,
          key: true,
          loyalty_discount_unit: true,
          loyalty_discount_value: true,
          name: true,
          price: true,
          requires_shipping: true,
          type: true,
        },
      },
      user_addresses: {
        include: {
          states: true,
          countries: {
            include: {
              currencies: true,
            },
          },
        },
      },
      subscriptions: true,
    },
  });
}

async function buildCartItem(
  raw: RawCartItem,
  quantity: number,
  addressOverride?: RawAddress,
): Promise<CartItem> {
  const subscription = raw.subscriptions!;
  const product = raw.products_subscription_items_product_idToproducts;
  const linked = raw.products_subscription_items_linked_product_idToproducts;
  const address = addressOverride ?? raw.user_addresses;
  if (!address) throw new Error("Cart item missing shipping address");

  const isLoyaltyEnabled = subscription.is_loyalty_enabled;
  const productPricing = priceWithLoyalty(product, isLoyaltyEnabled);
  const linkedPricing = linked ? priceWithLoyalty(linked, isLoyaltyEnabled) : null;

  const subtotal = calculateItemSubtotal({
    quantity,
    linkedQuantity: raw.linked_product_quantity ?? null,
    productPrice: productPricing.price,
    linkedPrice: linkedPricing ? linkedPricing.price : null,
  });

  const shippingResult = await calculateShipping({
    product,
    address,
    linkedProductId: raw.linked_product_id ?? null,
    linkedProductQuantity: (raw.linked_product_quantity ?? 1) * quantity,
    quantity,
  });

  const isUserTaxExempted = await prisma.users.findFirst({
    where: { id: subscription.user_id },
    select: { is_tax_exempted: true },
  }).then((u) => u?.is_tax_exempted ?? false);

  const taxBreakdown = await calculateTax({
    subtotal,
    address: {
      zip: address.zip,
      city: address.city,
      street: address.street,
      countries: address.countries,
    },
    isUserTaxExempted,
  });

  const productOfSub = await prisma.products.findFirst({
    where: { id: subscription.product_id },
    select: { name: true, technology: true },
  });
  const subscriptionTechnology = productOfSub?.technology || productOfSub?.name || "";

  return {
    id: Number(raw.id),
    subscriptionId: Number(raw.subscription_id ?? 0),
    productId: raw.product_id,
    product: toProductSnapshot(product, productPricing),
    linkedProduct: linked && linkedPricing ? toProductSnapshot(linked, linkedPricing) : null,
    linkedProductQuantity: raw.linked_product_quantity ?? null,
    quantity,
    userAddressId: Number(raw.user_address_id ?? address.id),
    userAddress: toAddressSnapshot(address),
    subscriptionNickname: subscription.nickname,
    subscriptionTechnology,
    subscriptionZone: subscription.zone,
    isLoyaltyEnabled,
    pricingLines: buildPricingLines(quantity, product, linked, subscription.zone, productPricing, linkedPricing, raw.linked_product_quantity ?? null),
    subtotal,
    shippingPrice: shippingResult.shippingPrice,
    tax: taxBreakdown.tax,
    taxPercent: taxBreakdown.taxPercent,
    estimatedTax: taxBreakdown.estimatedTax || shippingResult.estimatedTax,
    taxExempted: taxBreakdown.taxExempted,
    total: round2(subtotal + shippingResult.shippingPrice + taxBreakdown.tax),
    shippingPriceChanged: false,
  };
}

function priceWithLoyalty(product: RawProduct, isLoyaltyEnabled: boolean): LoyaltyPrice {
  return applyLoyaltyDiscount({
    rawPrice: product.price,
    loyaltyDiscountUnit: product.loyalty_discount_unit,
    loyaltyDiscountValue:
      product.loyalty_discount_value !== null ? Number(product.loyalty_discount_value) : null,
    isLoyaltyEnabled,
  });
}

function buildPricingLines(
  quantity: number,
  product: RawProduct,
  linked: RawProduct | null,
  zone: number,
  productPricing: LoyaltyPrice,
  linkedPricing: LoyaltyPrice | null,
  linkedProductQuantity: number | null,
): PriceLine[] {
  const lines: PriceLine[] = [
    {
      label: formatLineLabel(product.name, quantity),
      amount: round2(productPricing.price * quantity),
      originalAmount:
        productPricing.actualPrice !== null
          ? round2(productPricing.actualPrice * quantity)
          : null,
    },
  ];

  if (linked && linkedPricing) {
    const linkedQty = (linkedProductQuantity ?? 1) * quantity;
    lines.push({
      label: formatLineLabel(`Zone ${zone} (${linked.name})`, linkedQty),
      amount: round2(linkedPricing.price * linkedQty),
      originalAmount:
        linkedPricing.actualPrice !== null
          ? round2(linkedPricing.actualPrice * linkedQty)
          : null,
    });
  }

  return lines;
}

function toProductSnapshot(product: RawProduct, pricing: LoyaltyPrice): CartProductSnapshot {
  return {
    id: product.id,
    key: product.key,
    name: product.name,
    type: product.type,
    price: pricing.price,
    actualPrice: pricing.actualPrice,
    imageUrl: buildImageUrl(product.image),
  };
}

function toAddressSnapshot(address: RawAddress): CartAddressSnapshot {
  const country = address.countries;
  const currency = country?.currencies;

  return {
    id: Number(address.id),
    name: address.name,
    phone: address.phone,
    street: address.street,
    apartment: address.apartment,
    city: address.city,
    zip: address.zip,
    stateId: address.state_id,
    stateName: address.states?.name ?? null,
    countryId: country?.id ?? 0,
    formatted: formatAddress(address),
    country: {
      id: country?.id ?? 0,
      code: country?.code ?? "",
      htsCode: country?.hts_code ?? null,
      shippingPriceSource: (country?.shipping_price_source ?? "TIER") as "FEDEX" | "TIER",
      taxSource: (country?.tax_source ?? "STATE") as "FEDEX" | "STATE",
    },
    currency: {
      id: currency ? Number(currency.id) : 0,
      code: currency?.code ?? "USD",
      symbol: currency?.symbol ?? "$",
      exchangeRate: currency?.exchange_rate ? Number(currency.exchange_rate) : 1,
    },
  };
}

function toCardSnapshot(row: {
  id: bigint;
  brand: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  stripe_source_id: string;
}): CartCardSnapshot {
  return {
    id: Number(row.id),
    brand: row.brand,
    last4: row.last4,
    expMonth: row.exp_month,
    expYear: row.exp_year,
    stripePaymentMethodId: row.stripe_source_id,
  };
}

function toBankSnapshot(row: {
  id: bigint;
  bank_name: string | null;
  last4: string | null;
  stripe_payment_method_id: string;
}): CartBankSnapshot {
  return {
    id: Number(row.id),
    bankName: row.bank_name ?? "",
    last4: row.last4 ?? "",
    stripePaymentMethodId: row.stripe_payment_method_id,
  };
}

function buildImageUrl(filename: string | null): string {
  if (!filename) return "/assets/images/product-placeholder.svg";
  const base = process.env.LANDING_URL ?? "";
  return `${base}/images/${filename}`;
}

function addressForFedex(address: CartAddressSnapshot) {
  return {
    street: address.street,
    zip: address.zip,
    countries: {
      code: address.country.code,
      hts_code: address.country.htsCode,
      currencies: { code: address.currency.code },
    },
  };
}
