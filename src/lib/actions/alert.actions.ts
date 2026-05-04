"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  getReminderSettings as fetchReminderSettings,
  setItemAlert,
} from "@/lib/services/alert-service";
import type { AlertChannel, ReminderSettings } from "@/lib/types/alert";

export async function getReminderSettings(): Promise<ReminderSettings> {
  const { userId } = await getAuth();
  return fetchReminderSettings(userId);
}

export async function toggleAlertSetting(
  itemId: number,
  channel: AlertChannel,
  value: boolean,
): Promise<void> {
  const { userId } = await getAuth();
  await setItemAlert(itemId, channel, value, userId);
  revalidatePath("/alerts");
}
