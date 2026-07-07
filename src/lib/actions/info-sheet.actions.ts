"use server";

import { getAuth } from "@/lib/auth";
import { sendInfoSheetEmail as sendInfoSheetEmailApi } from "@/lib/services/info-sheet-service";

export async function sendInfoSheetEmail(): Promise<{ ok: boolean }> {
  const { userId, isAdmin } = await getAuth();
  if (!isAdmin) throw new Error("Unauthorized");

  const ok = await sendInfoSheetEmailApi(userId);
  return { ok };
}
