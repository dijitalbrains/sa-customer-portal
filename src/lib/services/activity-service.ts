import { prisma } from "@/lib/prisma";

export type ActivityObject =
  | "Subscription"
  | "SubscriptionItem"
  | "Order"
  | "User"
  | "UserAddress";

export interface LogActivityInput {
  userId: number;
  actorId: number;
  key: string;
  object: ActivityObject;
  objectId: number;
  value?: string | null;
  location?: string;
}

export async function logActivity({
  userId,
  actorId,
  key,
  object,
  objectId,
  value,
  location = "portal",
}: LogActivityInput) {
  const now = new Date();
  await prisma.activities.create({
    data: {
      user_id: userId,
      actor_id: actorId,
      key,
      value: value ?? null,
      location,
      object,
      object_id: objectId,
      created_at: now,
      updated_at: now,
    },
  });
}
