import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils/date";
import { formatAddress } from "@/lib/utils/address";
import { round2 } from "@/lib/utils/currency";
import { getOrderPayment } from "@/lib/utils/payment";
import type { OrderAddressJson } from "@/lib/types/address";
import type { OrderListItem, OrderDetail, OrderItemGroup } from "@/lib/types/order";

type RawOrder = Awaited<ReturnType<typeof fetchUserOrders>>[number];
type RawDetailOrder = NonNullable<Awaited<ReturnType<typeof fetchOrder>>>;

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
