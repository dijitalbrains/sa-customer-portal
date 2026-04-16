"use server";

import { requireUserId } from "@/lib/auth";
import { getOrders as fetchOrders, getOrderDetail as fetchOrderDetail } from "@/lib/services/order-service";

export async function getOrders() {
  const userId = await requireUserId();
  return fetchOrders(userId);
}

export async function getOrderDetail(orderId: number) {
  const userId = await requireUserId();
  return fetchOrderDetail(orderId, userId);
}
