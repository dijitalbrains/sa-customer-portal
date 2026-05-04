"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Breadcrumb from "@/components/ui/breadcrumb";
import EmptyState from "@/components/ui/empty-state";
import { toggleAlertSetting } from "@/lib/actions/alert.actions";
import type { AlertChannel, AlertOrder, ReminderSettings } from "@/lib/types/alert";
import SubscriptionCard from "./subscription-card";

interface RemindersListProps {
  settings: ReminderSettings;
}

export default function RemindersList({ settings }: RemindersListProps) {
  const [orders, setOrders] = useState<AlertOrder[]>(settings.orders);

  const handleToggle = async (
    itemId: number,
    channel: AlertChannel,
    nextValue: boolean,
  ) => {
    if (channel === "text_alerts" && !settings.hasPhone) {
      toast.error("Add a phone number in your profile to enable text alerts");
      return;
    }
    if (channel === "email_alerts" && !settings.hasEmail) {
      toast.error("Add an email address in your profile to enable email alerts");
      return;
    }

    const previous = orders;
    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        subscriptions: order.subscriptions.map((sub) => ({
          ...sub,
          items: sub.items.map((item) =>
            item.id === itemId ? { ...item, ...mapChannelValue(channel, nextValue) } : item,
          ),
        })),
      })),
    );

    try {
      await toggleAlertSetting(itemId, channel, nextValue);
    } catch (e) {
      setOrders(previous);
      toast.error(e instanceof Error ? e.message : "Failed to update reminder");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb page="manage-reminders" current="Manage Reminders" />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-heading">Manage Reminders</h1>
        <p className="text-[13px] text-text-muted">
          Choose how you want to be reminded about each filter renewal.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No subscriptions to manage yet"
          message="Add a renewal to start receiving change reminders."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-[15px] bg-[#f0f8ff] p-4 flex flex-col gap-3"
            >
              {order.subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  hasPhone={settings.hasPhone}
                  hasEmail={settings.hasEmail}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function mapChannelValue(channel: AlertChannel, value: boolean) {
  if (channel === "text_alerts") return { textAlerts: value };
  if (channel === "email_alerts") return { emailAlerts: value };
  return { notificationAlerts: value };
}
