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

const DEBOUNCE_MS = 300;

export interface ZoneFormState {
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

export interface EditZoneView extends ZoneFormState {
  states: StateOption[];
  loadingStates: boolean;
  preview: ZonePreview;
  loadingPreview: boolean;
  invalidZip: boolean;
  isComplete: boolean;
}

export function useEditZone(subscription: SubscriptionSnapshot) {
  const [form, setForm] = useState<ZoneFormState>(() => initialState(subscription));
  const [states, setStates] = useState<StateOption[]>([]);
  const [loadingStates, startStatesLoad] = useTransition();
  const [preview, setPreview] = useState<ZonePreview>({
    zone: subscription.zone,
    p1ValidityMonths: null,
    linkedProduct: null,
  });
  const [loadingPreview, startPreviewLoad] = useTransition();

  useEffect(() => {
    if (form.countryId === null) {
      setStates([]);
      return;
    }
    startStatesLoad(async () => {
      const next = await getStatesForCountry(form.countryId as number);
      setStates(next);
    });
  }, [form.countryId]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isComplete(form)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startPreviewLoad(async () => {
        try {
          const result = await getZoneChanges({
            subscriptionId: subscription.id,
            ...toServerInput(form),
          });
          setPreview(result);
        } catch (err) {
          console.error("[edit-zone] zone preview failed", err);
        }
      });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, subscription.id]);

  const view: EditZoneView = {
    ...form,
    states,
    loadingStates,
    preview,
    loadingPreview,
    invalidZip: preview.zone === -1,
    isComplete: isComplete(form),
  };

  return {
    view,
    setCountry: (id: number) =>
      setForm((p) => ({ ...p, countryId: id, stateId: null, city: "", zip: "" })),
    setState: (id: number) => setForm((p) => ({ ...p, stateId: id })),
    setCity: (city: string) => setForm((p) => ({ ...p, city })),
    setZip: (zip: string) => setForm((p) => ({ ...p, zip })),
    setHouseholdSize: (n: number) => setForm((p) => ({ ...p, householdSize: n })),
    setIsWellWater: (v: boolean) =>
      setForm((p) => ({ ...p, isWellWater: v, hasFiltrationSystem: v ? p.hasFiltrationSystem : null })),
    setHasFiltrationSystem: (v: boolean) => setForm((p) => ({ ...p, hasFiltrationSystem: v })),
    setHasMicronSystem: (v: boolean) => setForm((p) => ({ ...p, hasMicronSystem: v })),
    toServerInput: () => toServerInput(form),
  };
}

function initialState(subscription: SubscriptionSnapshot): ZoneFormState {
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

function isComplete(form: ZoneFormState): boolean {
  if (form.countryId === null) return false;
  if (!form.city.trim() || !form.zip.trim()) return false;
  if (form.isWellWater === null || form.hasMicronSystem === null) return false;
  if (form.isWellWater && form.hasFiltrationSystem === null) return false;
  return true;
}

type ServerFields = Omit<ZoneFormInput, "subscriptionId">;

function toServerInput(form: ZoneFormState): ServerFields {
  return {
    countryId: form.countryId as number,
    stateId: form.stateId,
    city: form.city.trim(),
    zip: form.zip.trim(),
    householdSize: form.householdSize,
    isWellWater: form.isWellWater === true,
    hasFiltrationSystem: form.hasFiltrationSystem === true,
    hasMicronSystem: form.hasMicronSystem === true,
  };
}
