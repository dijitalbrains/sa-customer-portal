import "server-only";
import { prisma } from "@/lib/prisma";
import type { AlertChannel, ReminderSettings } from "@/lib/types/alert";

export async function getReminderSettings(userId: number): Promise<ReminderSettings> {
  const [user, orders] = await Promise.all([
    prisma.users.findFirst({
      where: { id: userId },
      select: { email: true, phone: true },
    }),
    prisma.orders.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        subscriptions: { some: { deleted_at: null } },
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        subscriptions: {
          where: { deleted_at: null },
          orderBy: { id: "asc" },
          select: {
            id: true,
            nickname: true,
            products: { select: { key: true, name: true, technology: true } },
            subscription_items: {
              where: { deleted_at: null },
              orderBy: { id: "asc" },
              select: {
                id: true,
                validity_value: true,
                validity_type: true,
                text_alerts: true,
                email_alerts: true,
                notification_alerts: true,
                products_subscription_items_product_idToproducts: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    hasPhone: Boolean(user?.phone),
    hasEmail: Boolean(user?.email),
    orders: orders.map((order) => ({
      id: Number(order.id),
      subscriptions: order.subscriptions.map((s) => ({
        id: Number(s.id),
        title: buildSubscriptionTitle(s.products.technology || s.products.name, s.nickname),
        productKey: s.products.key,
        items: s.subscription_items.map((i) => ({
          id: Number(i.id),
          productName: i.products_subscription_items_product_idToproducts.name,
          validityValue: i.validity_value,
          validityType: i.validity_type as "MONTHS" | "WEEKS",
          textAlerts: i.text_alerts,
          emailAlerts: i.email_alerts,
          notificationAlerts: i.notification_alerts,
        })),
      })),
    })),
  };
}

export async function setItemAlert(
  itemId: number,
  channel: AlertChannel,
  value: boolean,
  userId: number,
): Promise<void> {
  const owned = await prisma.subscription_items.findFirst({
    where: {
      id: itemId,
      deleted_at: null,
      subscriptions: { user_id: userId, deleted_at: null },
    },
    select: { id: true },
  });
  if (!owned) throw new Error("Subscription item not found");

  const user = await prisma.users.findFirst({
    where: { id: userId },
    select: { email: true, phone: true },
  });

  if (channel === "email_alerts" && value && !user?.email) {
    throw new Error("No email on file");
  }
  if (channel === "text_alerts" && value && !user?.phone) {
    throw new Error("No phone on file");
  }

  await prisma.subscription_items.update({
    where: { id: itemId },
    data: { [channel]: value },
  });
}

function buildSubscriptionTitle(productName: string, nickname: string | null): string {
  return nickname ? `${productName} | ${nickname}` : productName;
}
