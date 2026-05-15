import "server-only";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/activity-service";
import { round2 } from "@/lib/utils/currency";

export async function getCreditBalance(userId: number): Promise<number> {
  const rows = await prisma.user_credits.findMany({
    where: { user_id: userId, deleted_at: null },
    select: { credit: true, debit: true },
  });
  const total = rows.reduce(
    (sum, r) => sum + Number(r.credit ?? 0) - Number(r.debit ?? 0),
    0,
  );
  return round2(total);
}

export async function updateUserCredits(
  userId: number,
  adminId: number,
  newCredits: number,
  notes: string | null,
): Promise<number> {
  const current = await getCreditBalance(userId);
  if (newCredits === current) return current;

  const delta = Math.abs(current - newCredits);
  const isCredit = newCredits > current;

  const created = await prisma.user_credits.create({
    data: {
      user_id: userId,
      actor_id: adminId,
      object_type: "ADMIN",
      object_id: adminId,
      notes,
      credit: isCredit ? delta : 0,
      debit: isCredit ? 0 : delta,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: { id: true, credit: true, debit: true },
  });

  const newBalance = round2(
    current + Number(created.credit ?? 0) - Number(created.debit ?? 0),
  );

  await logActivity({
    userId,
    actorId: adminId,
    key: "credits-updated",
    value: String(newBalance),
    object: "UserCredit",
    objectId: Number(created.id),
  });

  return newBalance;
}
