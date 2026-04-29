"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  getStatesForCountry,
  getZoneChanges,
  type ProductRef,
  type StateOption,
  type SubscriptionSnapshot,
  type ZoneFormInput,
} from "@/lib/actions/zone.actions";

const PREVIEW_DEBOUNCE_MS = 300;

export interface ZoneFormFields {
  countryId: number | null;
  stateId: number | null;
  city: string;
  zip: string;
  householdSize: number;
  isWellWater: boolean | null;
  hasFiltrationSystem: boolean | null;
  hasMicronSystem: boolean | null;
}

export interface ZonePreview {
  zone: number;
  p1ValidityMonths: number | null;
  linkedProduct: ProductRef | null;
}

export interface EditZoneView extends ZoneFormFields {
  states: StateOption[];
  loadingStates: boolean;
  preview: ZonePreview;
  loadingPreview: boolean;
  invalidZip: boolean;
  isComplete: boolean;
}

export function useEditZone(subscription: SubscriptionSnapshot) {
  const [fields, setFields] = useState<ZoneFormFields>(() => initialFields(subscription));
  const [states, setStates] = useState<StateOption[]>([]);
  const [loadingStates, startStatesLoad] = useTransition();
  const [preview, setPreview] = useState<ZonePreview>({
    zone: subscription.zone,
    p1ValidityMonths: null,
    linkedProduct: null,
  });
  const [loadingPreview, startPreviewLoad] = useTransition();

  useEffect(() => {
    if (fields.countryId === null) {
      setStates([]);
      return;
    }
    startStatesLoad(async () => {
      const next = await getStatesForCountry(fields.countryId as number);
      setStates(next);
    });
  }, [fields.countryId]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isComplete(fields)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startPreviewLoad(async () => {
        try {
          const result = await getZoneChanges({
            subscriptionId: subscription.id,
            ...buildZoneInput(fields),
          });
          setPreview(result);
        } catch (err) {
          console.error("[edit-zone] zone preview failed", err);
        }
      });
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fields, subscription.id]);

  const view: EditZoneView = {
    ...fields,
    states,
    loadingStates,
    preview,
    loadingPreview,
    invalidZip: preview.zone === -1,
    isComplete: isComplete(fields),
  };

  return {
    view,
    setCountry: (id: number) =>
      setFields((p) => ({ ...p, countryId: id, stateId: null, city: "", zip: "" })),
    setState: (id: number) => setFields((p) => ({ ...p, stateId: id })),
    setCity: (city: string) => setFields((p) => ({ ...p, city })),
    setZip: (zip: string) => setFields((p) => ({ ...p, zip })),
    setHouseholdSize: (n: number) => setFields((p) => ({ ...p, householdSize: n })),
    setIsWellWater: (v: boolean) =>
      setFields((p) => ({
        ...p,
        isWellWater: v,
        hasFiltrationSystem: v ? p.hasFiltrationSystem : null,
      })),
    setHasFiltrationSystem: (v: boolean) => setFields((p) => ({ ...p, hasFiltrationSystem: v })),
    setHasMicronSystem: (v: boolean) => setFields((p) => ({ ...p, hasMicronSystem: v })),
    buildZoneInput: () => buildZoneInput(fields),
  };
}

function initialFields(subscription: SubscriptionSnapshot): ZoneFormFields {
  return {
    countryId: subscription.countryId,
    stateId: subscription.stateId,
    city: subscription.city,
    zip: subscription.zip,
    householdSize: subscription.householdSize,
    isWellWater: subscription.isWellWater,
    hasFiltrationSystem: subscription.hasFiltrationSystem,
    hasMicronSystem: subscription.hasMicronSystem,
  };
}

function isComplete(fields: ZoneFormFields): boolean {
  if (fields.countryId === null) return false;
  if (!fields.city.trim() || !fields.zip.trim()) return false;
  if (fields.isWellWater === null || fields.hasMicronSystem === null) return false;
  if (fields.isWellWater && fields.hasFiltrationSystem === null) return false;
  return true;
}

type ZoneInputFields = Omit<ZoneFormInput, "subscriptionId">;

function buildZoneInput(fields: ZoneFormFields): ZoneInputFields {
  return {
    countryId: fields.countryId as number,
    stateId: fields.stateId,
    city: fields.city.trim(),
    zip: fields.zip.trim(),
    householdSize: fields.householdSize,
    isWellWater: fields.isWellWater === true,
    hasFiltrationSystem: fields.hasFiltrationSystem === true,
    hasMicronSystem: fields.hasMicronSystem === true,
  };
}
