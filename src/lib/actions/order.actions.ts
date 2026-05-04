"use server";

import { getAuth } from "@/lib/auth";
import { getOrders as fetchOrders, getOrderDetail as fetchOrderDetail } from "@/lib/services/order-service";

export async function getOrders() {
  const { userId } = await getAuth();
  return fetchOrders(userId);
}

export async function getOrderDetail(orderId: number) {
  const { userId } = await getAuth();
  return fetchOrderDetail(orderId, userId);
}
