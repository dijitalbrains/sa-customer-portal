import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { formatShortDate } from "@/lib/utils/date";
import { formatAddress } from "@/lib/utils/address";
import { round2 } from "@/lib/utils/currency";
import { addInterval } from "@/lib/utils/date";
import { getOrderPayment } from "@/lib/utils/payment";
import { applyLoyaltyDiscount, calculateItemSubtotal } from "@/lib/services/pricing-service";
import { calculateShipping } from "@/lib/services/shipping-service";
import { calculateTax } from "@/lib/services/tax-service";
import { chargeCard } from "@/lib/services/stripe/stripe";
import { chargeAch } from "@/lib/services/stripe/stripe-ach";
import { getCreditBalance } from "@/lib/services/user-credits-service";
import { loadCart, clearCart } from "@/lib/services/cart-service";
import type { OrderAddressJson } from "@/lib/types/address";
import type {
  OrderListItem,
  OrderDetail,
  OrderItemGroup,
  OrderRunResult,
} from "@/lib/types/order";
import type { Cart, CartItem } from "@/lib/types/cart";

type RawOrder = Awaited<ReturnType<typeof fetchUserOrders>>[number];
type RawDetailOrder = NonNullable<Awaited<ReturnType<typeof fetchOrder>>>;
type RawOrderItem = NonNullable<Awaited<ReturnType<typeof fetchSubscriptionItemForOrder>>>;
type RawOrderSubscription = NonNullable<RawOrderItem["subscriptions"]>;
type RawOrderUser = RawOrderSubscription["users_subscriptions_user_idTousers"];

interface PricedItem {
  raw: RawOrderItem;
  quantity: number;
  productPrice: number;
  productActualPrice: number | null;
  linkedPrice: number | null;
  linkedActualPrice: number | null;
  subtotal: number;
  shippingPrice: number;
  tax: number;
  taxPercent: number;
  estimatedTax: number;
  taxExempted: number | null;
  total: number;
  creditsUsed: number;
  ccProcessingFee: number;
  currency: { id: number; code: string; symbol: string; exchangeRate: number };
}

export async function getOrders(userId: number): Promise<OrderListItem[]> {
  const orders = await fetchUserOrders(userId);
  return orders.map(toListItem);
}

export async function getOrderDetail(
  orderId: number,
  userId: number,
): Promise<OrderDetail | null> {
  const order = await fetchOrder(orderId, userId);
  if (!order) return null;
  return toDetail(order);
}

async function fetchUserOrders(userId: number) {
  return prisma.orders.findMany({
    where: { user_id: userId, deleted_at: null },
    include: {
      currencies: { select: { code: true } },
      order_items: {
        include: {
          order_item_details: {
            include: { products: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

async function fetchOrder(orderId: number, userId: number) {
  return prisma.orders.findFirst({
    where: { id: orderId, user_id: userId, deleted_at: null },
    include: {
      currencies: { select: { code: true } },
      users_orders_user_idTousers: { select: { firstname: true, lastname: true } },
      order_items: {
        include: {
          order_item_details: {
            include: { products: { select: { name: true } } },
          },
        },
      },
    },
  });
}

function toListItem(order: RawOrder): OrderListItem {
  return {
    id: Number(order.id),
    placedDate: formatShortDate(order.created_at),
    total: order.total,
    currencyCode: order.currencies.code,
    payment: getOrderPayment(order),
    productSummary: order.order_items
      .flatMap((oi) => oi.order_item_details.map((d) => d.products.name))
      .join(", "),
  };
}

function toDetail(order: RawDetailOrder): OrderDetail {
  const user = order.users_orders_user_idTousers;

  const totals = order.order_items.reduce(
    (acc, oi) => ({
      subtotal: acc.subtotal + (oi.subtotal ?? 0),
      shipping: acc.shipping + (oi.shipping_price ?? 0),
      tax: acc.tax + (oi.tax ?? 0),
      estimatedTax: acc.estimatedTax + (oi.estimated_tax ?? 0),
    }),
    { subtotal: 0, shipping: 0, tax: 0, estimatedTax: 0 },
  );

  return {
    placedDate: formatShortDate(order.created_at),
    placedBy: `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim(),
    currencyCode: order.currencies.code,
    subtotal: round2(totals.subtotal),
    shippingPrice: round2(totals.shipping),
    ccProcessingFee: Number(order.cc_processing_fee),
    tax: round2(totals.tax),
    estimatedTax: round2(totals.estimatedTax),
    total: order.total,
    payment: getOrderPayment(order),
    itemGroups: buildItemGroups(order),
  };
}

function buildItemGroups(order: RawDetailOrder): OrderItemGroup[] {
  const groupMap = new Map<string, OrderItemGroup>();

  for (const oi of order.order_items) {
    for (const detail of oi.order_item_details) {
      const addr = detail.user_address as OrderAddressJson | null;
      const key = addr?.id ? String(addr.id) : "no-address";

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          name: addr?.name ?? "",
          phone: addr?.phone ?? "",
          address: formatAddress(addr as Parameters<typeof formatAddress>[0]),
          products: [],
        });
      }

      groupMap.get(key)!.products.push(detail.products.name);
    }
  }

  return Array.from(groupMap.values());
}

export async function runSubscription(input: {
  subscriptionItemId: number;
  quantity: number;
  userId: number;
  actorId: number;
}): Promise<OrderRunResult> {
  const raw = await fetchSubscriptionItemForOrder(input.subscriptionItemId, input.userId);
  if (!raw) throw new Error("Subscription item not found");

  const subscription = raw.subscriptions;
  if (!subscription) throw new Error("Subscription not found");

  const user = subscription.users_subscriptions_user_idTousers;
  const priced = await computePricedItem(raw, input.quantity, subscription.is_loyalty_enabled, user.is_tax_exempted);

  const result = await processItem(subscription, priced, user, input.actorId);

  await prisma.agent_task.updateMany({
    where: { subscription_item_id: BigInt(input.subscriptionItemId), completed_at: null },
    data: { completed_at: new Date() },
  });
  await prisma.subscription_items.update({
    where: { id: BigInt(input.subscriptionItemId) },
    data: { is_task_created: false },
  });

  return result;
}

async function processItem(
  subscription: RawOrderSubscription,
  item: PricedItem,
  user: RawOrderUser,
  actorId: number,
): Promise<OrderRunResult> {
  const hasACH = Boolean(item.raw.user_bank_accounts?.stripe_payment_method_id);
  const hasCard = Boolean(item.raw.user_stripe_sources?.stripe_source_id);

  if (!user.stripe_customer_id || (!hasACH && !hasCard) || !item.raw.user_addresses) {
    throw new Error("Missing payment method or shipping address");
  }

  const creditBalance = await getCreditBalance(Number(user.id));
  if (creditBalance > 0) {
    const exchanged = exchangeCredits(creditBalance, item.currency.exchangeRate);
    item.creditsUsed = item.total >= exchanged ? exchanged : item.total;
    item.total = round2(item.total - item.creditsUsed);
  }

  if (item.total > 0 && hasCard && !hasACH) {
    item.ccProcessingFee = round2(item.total * 0.03);
    item.total = round2(item.total + item.ccProcessingFee);
  }

  let paymentMethod: "CARD" | "ACH" = "CARD";
  let isACHPending = false;
  let paymentIntentId: string | null = null;

  if (item.total > 0) {
    const description = getDescription(user, [item]);
    if (hasACH) {
      const bank = item.raw.user_bank_accounts!;
      const intent = await chargeAch({
        customerId: user.stripe_customer_id,
        paymentMethodId: bank.stripe_payment_method_id,
        amount: item.total,
        description,
      });
      paymentIntentId = intent.id;
      paymentMethod = "ACH";
      isACHPending = intent.status !== "succeeded";
    } else {
      const card = item.raw.user_stripe_sources!;
      const intent = await chargeCard({
        customerId: user.stripe_customer_id,
        paymentMethodId: card.stripe_source_id,
        amount: item.total,
        description,
      });
      paymentIntentId = intent.id;
    }
  }

  const orderId = await prisma.$transaction(async (tx) => {
    const order = await saveOrder(tx, {
      userId: user.id,
      actorId,
      currencyId: item.currency.id,
      paymentMethod,
      paymentIntentId,
      isACHPending,
      subtotal: item.subtotal,
      shippingPrice: item.shippingPrice,
      tax: item.tax,
      estimatedTax: item.estimatedTax,
      taxExempted: item.taxExempted,
      ccProcessingFee: item.ccProcessingFee,
      creditsUsed: item.creditsUsed,
      total: item.total,
      stripeSnapshot: item.raw.user_stripe_sources ?? null,
      bankSnapshot: item.raw.user_bank_accounts
        ? { ...item.raw.user_bank_accounts, payment_intent_id: paymentMethod === "ACH" ? paymentIntentId : null }
        : null,
    });

    const orderItem = await saveOrderItem(tx, {
      orderId: order.id,
      subscriptionId: subscription.id,
      productId: subscription.product_id,
      userAddressId: item.raw.user_address_id,
      nickname: subscription.nickname,
      zone: subscription.zone,
      subtotal: item.subtotal,
      tax: item.tax,
      estimatedTax: item.estimatedTax,
      shippingPrice: item.shippingPrice,
      taxExempted: item.taxExempted,
    });

    await saveOrderItemDetail(tx, {
      orderItemId: orderItem.id,
      productId: item.raw.product_id,
      price: item.productPrice,
      shippingPrice: item.shippingPrice,
      userAddressJson: item.raw.user_addresses ?? null,
      quantity: item.quantity,
      userStripeSourceId: item.raw.user_stripe_sources?.id ?? null,
      linked:
        item.raw.linked_product_id != null && item.linkedPrice !== null
          ? {
              productId: item.raw.linked_product_id,
              price: item.linkedPrice,
              quantity: (item.raw.linked_product_quantity ?? 1) * item.quantity,
            }
          : undefined,
    });

    if (item.creditsUsed > 0) {
      await saveCreditDebit(tx, {
        userId: user.id,
        actorId,
        amount: revertExchange(item.creditsUsed, item.currency.exchangeRate),
        userStripeSourceId: item.raw.user_stripe_sources?.id ?? null,
        orderId: order.id,
      });
    }

    if (!isACHPending) {
      await renewSubscriptionItem(tx, {
        itemId: item.raw.id,
        validityType: item.raw.validity_type,
        validityValue: item.raw.validity_value,
        quantity: item.quantity,
        currentStartsAt: item.raw.starts_at,
      });
    }

    await logOrderPlaced(tx, { userId: user.id, actorId, orderId: order.id });

    return Number(order.id);
  });

  await sendOrderNotification();

  return {
    orderId,
    subscriptionId: Number(subscription.id),
    paymentMethod,
    isACHPending,
  };
}

function fetchSubscriptionItemForOrder(subscriptionItemId: number, userId: number) {
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
      user_stripe_sources: true,
      user_bank_accounts: true,
      subscriptions: {
        include: {
          users_subscriptions_user_idTousers: true,
        },
      },
    },
  });
}

async function computePricedItem(
  raw: RawOrderItem,
  quantity: number,
  isLoyaltyEnabled: boolean,
  isUserTaxExempted: boolean,
): Promise<PricedItem> {
  const product = raw.products_subscription_items_product_idToproducts;
  const linked = raw.products_subscription_items_linked_product_idToproducts;

  const productPricing = applyLoyaltyDiscount({
    rawPrice: product.price,
    loyaltyDiscountUnit: product.loyalty_discount_unit,
    loyaltyDiscountValue:
      product.loyalty_discount_value !== null ? Number(product.loyalty_discount_value) : null,
    isLoyaltyEnabled,
  });
  
  const linkedPricing = linked
    ? applyLoyaltyDiscount({
        rawPrice: linked.price,
        loyaltyDiscountUnit: linked.loyalty_discount_unit,
        loyaltyDiscountValue:
          linked.loyalty_discount_value !== null ? Number(linked.loyalty_discount_value) : null,
        isLoyaltyEnabled,
      })
    : null;

  const subtotal = calculateItemSubtotal({
    quantity,
    linkedQuantity: raw.linked_product_quantity ?? null,
    productPrice: productPricing.price,
    linkedPrice: linkedPricing ? linkedPricing.price : null,
  });

  const shippingResult = raw.user_address_id && raw.user_addresses
    ? await calculateShipping({
        product,
        address: raw.user_addresses,
        linkedProductId: raw.linked_product_id ?? null,
        linkedProductQuantity: (raw.linked_product_quantity ?? 1) * quantity,
        quantity,
      })
    : { shippingPrice: 0, estimatedTax: 0 };

  const taxBreakdown = await calculateTax({
    subtotal,
    address: raw.user_addresses
      ? {
          zip: raw.user_addresses.zip,
          city: raw.user_addresses.city,
          street: raw.user_addresses.street,
          countries: raw.user_addresses.countries,
        }
      : null,
    isUserTaxExempted,
  });

  const total = round2(subtotal + shippingResult.shippingPrice + taxBreakdown.tax);
  const currencyRow = raw.user_addresses?.countries?.currencies ?? null;

  return {
    raw,
    quantity,
    productPrice: productPricing.price,
    productActualPrice: productPricing.actualPrice,
    linkedPrice: linkedPricing?.price ?? null,
    linkedActualPrice: linkedPricing?.actualPrice ?? null,
    subtotal,
    shippingPrice: shippingResult.shippingPrice,
    tax: taxBreakdown.tax,
    taxPercent: taxBreakdown.taxPercent,
    estimatedTax: taxBreakdown.estimatedTax || shippingResult.estimatedTax,
    taxExempted: taxBreakdown.taxExempted,
    total,
    creditsUsed: 0,
    ccProcessingFee: 0,
    currency: {
      id: currencyRow ? Number(currencyRow.id) : 0,
      code: currencyRow?.code ?? "USD",
      symbol: currencyRow?.symbol ?? "$",
      exchangeRate: currencyRow?.exchange_rate ? Number(currencyRow.exchange_rate) : 1,
    },
  };
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

interface SaveOrderInput {
  userId: bigint;
  actorId: number;
  currencyId: number;
  paymentMethod: "CARD" | "ACH";
  paymentIntentId: string | null;
  isACHPending: boolean;
  subtotal: number;
  shippingPrice: number;
  tax: number;
  estimatedTax: number;
  taxExempted: number | null;
  ccProcessingFee: number;
  creditsUsed: number;
  total: number;
  stripeSnapshot: unknown;
  bankSnapshot: unknown;
}

async function saveOrder(tx: TxClient, input: SaveOrderInput) {
  const status =
    input.paymentMethod === "ACH" && input.isACHPending ? "ACH_PENDING" : "PACKING";

  return tx.orders.create({
    data: {
      user_id: input.userId,
      actor_id: BigInt(input.actorId),
      currency_id: input.currencyId,
      payment_method: input.paymentMethod,
      payment_intent_id: input.paymentIntentId,
      status,
      type: "SUBSCRIPTION",
      subtotal: input.subtotal,
      shipping_price: input.shippingPrice,
      tax: input.tax,
      estimated_tax: input.estimatedTax || null,
      tax_exempted: input.taxExempted,
      cc_processing_fee: input.ccProcessingFee,
      credits_used: input.creditsUsed > 0 ? input.creditsUsed : null,
      total: input.total,
      user_stripe_source: toJsonSafe(input.stripeSnapshot),
      user_bank_account: toJsonSafe(input.bankSnapshot),
      log: {},
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

interface SaveOrderItemInput {
  orderId: bigint;
  subscriptionId: bigint;
  productId: number;
  userAddressId: bigint | null;
  nickname: string | null;
  zone: number | null;
  subtotal: number;
  tax: number;
  estimatedTax: number;
  shippingPrice: number;
  taxExempted: number | null;
}

async function saveOrderItem(tx: TxClient, input: SaveOrderItemInput) {
  return tx.order_items.create({
    data: {
      order_id: input.orderId,
      subscription_id: input.subscriptionId,
      product_id: input.productId,
      user_address_id: input.userAddressId,
      nickname: input.nickname,
      zone: input.zone,
      subtotal: input.subtotal,
      tax: input.tax,
      estimated_tax: input.estimatedTax || null,
      shipping_price: input.shippingPrice,
      tax_exempted: input.taxExempted,
    },
  });
}

interface SaveOrderItemDetailInput {
  orderItemId: bigint;
  productId: number;
  price: number;
  shippingPrice: number | null;
  userAddressJson: unknown;
  quantity: number;
  userStripeSourceId: bigint | null;
  linked?: { productId: number; price: number; quantity: number };
}

async function saveOrderItemDetail(tx: TxClient, input: SaveOrderItemDetailInput) {
  const addressJson = toJsonSafe(input.userAddressJson);

  await tx.order_item_details.create({
    data: {
      order_item_id: input.orderItemId,
      product_id: input.productId,
      price: input.price,
      shipping_price: input.shippingPrice,
      user_address: addressJson,
      quantity: input.quantity,
      user_stripe_source_id: input.userStripeSourceId,
    },
  });

  if (input.linked) {
    await tx.order_item_details.create({
      data: {
        order_item_id: input.orderItemId,
        product_id: input.linked.productId,
        price: input.linked.price,
        shipping_price: null,
        user_address: addressJson,
        quantity: input.linked.quantity,
        user_stripe_source_id: input.userStripeSourceId,
      },
    });
  }
}

interface RenewSubscriptionItemInput {
  itemId: bigint;
  validityType: "MONTHS" | "WEEKS";
  validityValue: number;
  quantity: number;
  currentStartsAt: Date | null;
}

async function renewSubscriptionItem(tx: TxClient, input: RenewSubscriptionItemInput) {
  const endsAt = addInterval(
    new Date(),
    input.validityValue * input.quantity,
    input.validityType,
  );
  await tx.subscription_items.update({
    where: { id: input.itemId },
    data: {
      ends_at: endsAt,
      starts_at: input.currentStartsAt ?? new Date(),
    },
  });
}

interface SaveCreditDebitInput {
  userId: bigint;
  actorId: number;
  amount: number;
  userStripeSourceId: bigint | null;
  orderId: bigint;
}

async function saveCreditDebit(tx: TxClient, input: SaveCreditDebitInput) {
  await tx.user_credits.create({
    data: {
      user_id: input.userId,
      actor_id: BigInt(input.actorId),
      credit: 0,
      debit: input.amount,
      user_stripe_source_id: input.userStripeSourceId,
      object_type: "ORDER",
      object_id: input.orderId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

async function logOrderPlaced(
  tx: TxClient,
  input: { userId: bigint; actorId: number; orderId: bigint },
) {
  await tx.activities.create({
    data: {
      user_id: input.userId,
      actor_id: BigInt(input.actorId),
      key: "order-placed",
      value: null,
      location: "portal",
      object: "Order",
      object_id: input.orderId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

function getDescription(user: RawOrderUser, items: PricedItem[]): string {
  const name = `${user.firstname} ${user.lastname ?? ""}`.trim();
  const products = items
    .map((i) => {
      const main = i.raw.products_subscription_items_product_idToproducts.name;
      const linked = i.raw.products_subscription_items_linked_product_idToproducts?.name;
      return linked ? `${main} + ${linked}` : main;
    })
    .join(", ");
  return `Charge for ${name} - ${products}`;
}

async function sendOrderNotification(): Promise<void> {
  // TODO: implement Mailjet alerts/emails (port AlertService::send from legacy)
}

function toJsonSafe<T>(value: T): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? Number(v) : v)),
  );
}

function exchangeCredits(amountUsd: number, exchangeRate: number): number {
  return round2(amountUsd * exchangeRate);
}

function revertExchange(amountLocal: number, exchangeRate: number): number {
  return exchangeRate > 0 ? round2(amountLocal / exchangeRate) : amountLocal;
}

export async function placeOrderFromCart(input: {
  userId: number;
  actorId: number;
}): Promise<{ orderId: number; paymentMethod: "CARD" | "ACH"; isACHPending: boolean }> {
  const cart = await loadCart(input.userId);
  if (!cart || cart.items.length === 0) throw new Error("Cart is empty");
  if (!cart.currency) throw new Error("Cart has no currency");

  const hasACH = !!cart.userBankAccount;
  const hasCard = !!cart.userStripeSource;
  if (!hasACH && !hasCard) throw new Error("Missing payment method");

  const user = await prisma.users.findFirst({
    where: { id: input.userId },
    select: { id: true, firstname: true, lastname: true, stripe_customer_id: true, is_test: true },
  });
  if (!user?.stripe_customer_id) throw new Error("Stripe customer not found");

  const creditsUsed = cart.creditsUsed;
  const total = creditsUsed > 0 ? round2(cart.total - creditsUsed) : cart.total;

  let paymentMethod: "CARD" | "ACH" = "CARD";
  let isACHPending = false;
  let paymentIntentId: string | null = null;

  if (total > 0) {
    const description = buildCartDescription(user, cart);
    if (hasACH && !hasCard) {
      const intent = await chargeAch({
        customerId: user.stripe_customer_id,
        paymentMethodId: cart.userBankAccount!.stripePaymentMethodId,
        amount: total,
        description,
      });
      paymentIntentId = intent.id;
      paymentMethod = "ACH";
      isACHPending = intent.status !== "succeeded";
    } else {
      const intent = await chargeCard({
        customerId: user.stripe_customer_id,
        paymentMethodId: cart.userStripeSource!.stripePaymentMethodId,
        amount: total,
        description,
      });
      paymentIntentId = intent.id;
    }
  }

  const subItemIds = cart.items.map((i) => BigInt(i.id));
  const subItems = await prisma.subscription_items.findMany({
    where: { id: { in: subItemIds } },
    select: { id: true, validity_value: true, validity_type: true, starts_at: true },
  });
  const subItemMap = new Map(subItems.map((s) => [Number(s.id), s]));

  const grouped = new Map<number, CartItem[]>();
  for (const item of cart.items) {
    const list = grouped.get(item.subscriptionId) ?? [];
    list.push(item);
    grouped.set(item.subscriptionId, list);
  }

  const orderId = await prisma.$transaction(async (tx) => {
    const order = await saveOrder(tx, {
      userId: user.id,
      actorId: input.actorId,
      currencyId: cart.currency!.id,
      paymentMethod,
      paymentIntentId,
      isACHPending,
      subtotal: cart.subtotal,
      shippingPrice: cart.shippingPrice,
      tax: cart.tax,
      estimatedTax: cart.estimatedTax,
      taxExempted: cart.taxExempted,
      ccProcessingFee: cart.ccProcessingFee,
      creditsUsed,
      total,
      stripeSnapshot: cart.userStripeSource,
      bankSnapshot: cart.userBankAccount
        ? {
            ...cart.userBankAccount,
            payment_intent_id: paymentMethod === "ACH" ? paymentIntentId : null,
          }
        : null,
    });

    for (const [subscriptionId, items] of grouped) {
      const subscription = await tx.subscriptions.findFirst({
        where: { id: BigInt(subscriptionId) },
        select: { id: true, product_id: true, nickname: true, zone: true },
      });
      if (!subscription) continue;

      const subtotal = round2(items.reduce((s, i) => s + i.subtotal, 0));
      const tax = round2(items.reduce((s, i) => s + i.tax, 0));
      const estimatedTax = round2(items.reduce((s, i) => s + i.estimatedTax, 0));
      const shippingPrice = round2(items.reduce((s, i) => s + i.shippingPrice, 0));
      const taxExempted = items.reduce<number | null>(
        (s, i) => (i.taxExempted == null ? s : round2((s ?? 0) + i.taxExempted)),
        null,
      );

      const orderItem = await saveOrderItem(tx, {
        orderId: order.id,
        subscriptionId: subscription.id,
        productId: subscription.product_id,
        userAddressId: BigInt(items[0].userAddress.id),
        nickname: subscription.nickname,
        zone: subscription.zone,
        subtotal,
        tax,
        estimatedTax,
        shippingPrice,
        taxExempted,
      });

      for (const item of items) {
        await saveOrderItemDetail(tx, {
          orderItemId: orderItem.id,
          productId: item.product.id,
          price: item.product.price,
          shippingPrice: item.shippingPrice,
          userAddressJson: item.userAddress,
          quantity: item.quantity,
          userStripeSourceId: cart.userStripeSource ? BigInt(cart.userStripeSource.id) : null,
          linked: item.linkedProduct
            ? {
                productId: item.linkedProduct.id,
                price: item.linkedProduct.price,
                quantity: (item.linkedProductQuantity ?? 1) * item.quantity,
              }
            : undefined,
        });

        if (!isACHPending) {
          const subItem = subItemMap.get(item.id);
          if (subItem) {
            await renewSubscriptionItem(tx, {
              itemId: subItem.id,
              validityType: subItem.validity_type,
              validityValue: subItem.validity_value,
              quantity: item.quantity,
              currentStartsAt: subItem.starts_at,
            });
          }
        }
      }
    }

    if (creditsUsed > 0) {
      await saveCreditDebit(tx, {
        userId: user.id,
        actorId: input.actorId,
        amount: revertExchange(creditsUsed, cart.currency!.exchangeRate),
        userStripeSourceId: cart.userStripeSource ? BigInt(cart.userStripeSource.id) : null,
        orderId: order.id,
      });
    }

    await logOrderPlaced(tx, { userId: user.id, actorId: input.actorId, orderId: order.id });

    return Number(order.id);
  });

  await prisma.agent_task.updateMany({
    where: { subscription_item_id: { in: subItemIds }, completed_at: null },
    data: { completed_at: new Date() },
  });
  await prisma.subscription_items.updateMany({
    where: { id: { in: subItemIds } },
    data: { is_task_created: false },
  });

  await clearCart(input.userId);
  await sendOrderNotification();

  return { orderId, paymentMethod, isACHPending };
}

function buildCartDescription(
  user: { firstname: string; lastname: string | null },
  cart: Cart,
): string {
  const name = `${user.firstname} ${user.lastname ?? ""}`.trim();
  const products = cart.items
    .map((i) => (i.linkedProduct ? `${i.product.name} + ${i.linkedProduct.name}` : i.product.name))
    .join(", ");
  return `Charge for ${name} - ${products}`;
}
