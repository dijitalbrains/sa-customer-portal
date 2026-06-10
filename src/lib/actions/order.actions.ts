"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  getOrders as fetchOrders,
  getOrderDetail as fetchOrderDetail,
  placeOrderFromCart,
  runSubscription as executeSubscription,
} from "@/lib/services/order-service";
import type { OrderRunResult } from "@/lib/types/order";

export async function getOrders() {
  const { userId } = await getAuth();
  return fetchOrders(userId);
}

export async function getOrderDetail(orderId: number) {
  const { userId } = await getAuth();
  return fetchOrderDetail(orderId, userId);
}

export async function runSubscription(input: {
  subscriptionItemId: number;
  quantity: number;
}): Promise<OrderRunResult> {
  const { userId, actorId } = await getAuth();
  const result = await executeSubscription({
    subscriptionItemId: input.subscriptionItemId,
    quantity: input.quantity,
    userId,
    actorId,
  });
  revalidatePath("/");
  revalidatePath(`/detail/${result.subscriptionId}`);
  revalidatePath("/orders");
  return result;
}

export async function placeOrder(): Promise<{ orderId: number }> {
  const { userId, actorId } = await getAuth();
  const result = await placeOrderFromCart({ userId, actorId });
  revalidatePath("/", "layout");
  revalidatePath("/orders");
  return { orderId: result.orderId };
}
