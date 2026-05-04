"use server";

import { getAuth } from "@/lib/auth";
import { listStatesByCountry } from "@/lib/services/state-service";
import { getEditZoneData } from "@/lib/services/renewal-service";
import {
  getZoneChangePreview,
  updateSubscriptionZone,
} from "@/lib/services/zone-service";
import type { StateOption } from "@/lib/types/reference";
import type {
  EditZoneData,
  ZoneChangesResult,
  ZoneFormInput,
} from "@/lib/types/zone";

export async function EditZone(subscriptionId: number): Promise<EditZoneData> {
  const { userId } = await getAuth();
  return getEditZoneData(subscriptionId, userId);
}

export async function getStatesForCountry(countryId: number): Promise<StateOption[]> {
  await getAuth();
  return listStatesByCountry(countryId);
}

export async function getZoneChanges(input: ZoneFormInput): Promise<ZoneChangesResult> {
  return getZoneChangePreview(input);
}

export async function updateZone(input: ZoneFormInput & { zone: number }) {
  const { userId, actorId } = await getAuth();

  await updateSubscriptionZone({
    newZone: input.zone,
    subscriptionId: input.subscriptionId,
    userId,
    actorId,
    subscriptionData: {
      countryId: input.countryId,
      stateId: input.stateId,
      city: input.city,
      zip: input.zip,
      householdSize: input.householdSize,
      isWellWater: input.isWellWater,
      hasFiltrationSystem: input.hasFiltrationSystem,
      hasMicronSystem: input.hasMicronSystem,
    },
  });
}
