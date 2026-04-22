import { prisma } from "@/lib/prisma";

type BlockableField = "email" | "phone";

interface LogBlockInput {
  userId: number;
  field: BlockableField;
  givenValue: string;
  leadValue: string | null;
  conflictingUserId: number;
  conflictingValue: string | null;
  reason: string;
  location?: string | null;
}

export async function logLeadBlocking({
  userId,
  field,
  givenValue,
  leadValue,
  conflictingUserId,
  conflictingValue,
  reason,
  location,
}: LogBlockInput) {
  const log = {
    lead: { id: userId, [field]: leadValue },
    given_data: { [field]: givenValue },
    conflicting_user: { id: conflictingUserId, [field]: conflictingValue },
  };

  const existing = await prisma.lead_blockings.findFirst({
    where: { user_id: userId, reason },
    select: { id: true },
  });
  if (existing) return;

  const now = new Date();
  await prisma.lead_blockings.create({
    data: {
      user_id: userId,
      reason,
      log,
      location: location ?? null,
      created_at: now,
      updated_at: now,
    },
  });
}
