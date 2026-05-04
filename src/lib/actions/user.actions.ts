"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountSummary } from "@/lib/services/user-service";
import { logLeadBlocking } from "@/lib/services/lead-blocking-service";
import {
  personalInfoSchema,
  changePasswordSchema,
  type PersonalInfoInput,
  type ChangePasswordInput,
} from "@/lib/validation/account";

export async function getAccount() {
  const { userId } = await getAuth();
  return getAccountSummary(userId);
}

export async function updatePersonalInfo(input: PersonalInfoInput) {
  const { userId } = await getAuth();
  const data = personalInfoSchema.parse(input);

  const currentUser = await prisma.users.findFirst({
    where: { id: userId },
    select: { email: true, phone: true },
  });

  if (data.email !== currentUser?.email) {
    const emailConflict = await prisma.users.findFirst({
      where: { id: { not: userId }, email: data.email },
      select: { id: true, email: true },
    });
    if (emailConflict) {
      await logConflict({
        userId,
        field: "email",
        givenValue: data.email,
        leadValue: currentUser?.email ?? null,
        conflictingUserId: Number(emailConflict.id),
        conflictingValue: emailConflict.email,
        reason: "This email already exist.",
      });
      throw new Error("This email already exist.");
    }
  }

  if (data.phone !== currentUser?.phone) {
    const phoneConflict = await prisma.users.findFirst({
      where: { id: { not: userId }, phone: { endsWith: data.phone } },
      select: { id: true, phone: true },
    });
    if (phoneConflict) {
      await logConflict({
        userId,
        field: "phone",
        givenValue: data.phone,
        leadValue: currentUser?.phone ?? null,
        conflictingUserId: Number(phoneConflict.id),
        conflictingValue: phoneConflict.phone,
        reason: "This phone already exist.",
      });
      throw new Error("This phone already exist.");
    }
  }

  await prisma.users.update({
    where: { id: userId },
    data,
  });

  revalidatePath("/account");
}

export async function updatePassword(input: ChangePasswordInput) {
  const { userId } = await getAuth();
  const data = changePasswordSchema.parse(input);

  const user = await prisma.users.findFirst({
    where: { id: userId },
    select: { password: true },
  });
  if (!user?.password) throw new Error("Account has no password set");

  const ok = await bcrypt.compare(data.oldPassword, user.password);
  if (!ok) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(data.newPassword, 10);
  await prisma.users.update({
    where: { id: userId },
    data: { password: hashed },
  });

  revalidatePath("/account");
}

async function logConflict(params: Omit<Parameters<typeof logLeadBlocking>[0], "location">) {
  const hdrs = await headers();
  const location = hdrs.get("referer");
  await logLeadBlocking({ ...params, location });
}
