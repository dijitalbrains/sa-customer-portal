"use server";

import { getAuth } from "@/lib/auth";
import { sendInfoSheetEmail } from "@/lib/services/info-sheet-service";

export async function sendEmail(): Promise<{ ok: boolean }> {
  const { userId, isAdmin } = await getAuth();
  if (!isAdmin) throw new Error("Unauthorized");

  const ok = await sendInfoSheetEmail(userId);
  return { ok };
}
