"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import {
  getCreditBalance,
  updateUserCredits,
} from "@/lib/services/user-credits-service";

export async function getCredits(): Promise<number> {
  const { userId } = await getAuth();
  return getCreditBalance(userId);
}

export async function updateCredits(input: {
  newCredits: number;
  notes: string | null;
}): Promise<number> {
  const { userId, adminId, isAdmin } = await getAuth();
  if (!isAdmin) throw new Error("Only admins can update credits");
  const balance = await updateUserCredits(
    userId,
    adminId,
    input.newCredits,
    input.notes,
  );
  revalidatePath("/", "layout");
  return balance;
}
