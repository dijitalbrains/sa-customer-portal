"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { PriceLine, RenewalItem } from "@/lib/types/subscription";
import {
  getShippingPriceForItem,
  type ValidityType,
} from "@/lib/actions/preferences.actions";

export interface PreferencesState {
  unusedItems: number;
  validityType: ValidityType;
  validityValue: number;
  quantity: number;
  upcomingReminder: Date;
}

export interface PreferencesView extends PreferencesState {
  endsAt: Date;
  shipping: number;
  estimatedTax: number;
  refreshingShipping: boolean;
  pricingLines: PriceLine[];
  subTotal: number;
  tax: number;
  total: number;
}

export function useEditPreferences(item: RenewalItem) {
  const [prefs, setPrefs] = useState<PreferencesState>(() => initialState(item));
  const [shipping, setShipping] = useState(item.shipping);
  const [estimatedTax, setEstimatedTax] = useState(item.estimatedTax);
  const [refreshingShipping, startShippingTransition] = useTransition();

  const endsAt = useMemo(
    () =>
      addInterval(
        prefs.upcomingReminder,
        prefs.unusedItems * prefs.validityValue,
        prefs.validityType,
      ),
    [prefs.upcomingReminder, prefs.unusedItems, prefs.validityValue, prefs.validityType],
  );

  const isFirstShippingFetch = useRef(true);
  useEffect(() => {
    if (isFirstShippingFetch.current) {
      isFirstShippingFetch.current = false;
      return;
    }
    startShippingTransition(async () => {
      try {
        const res = await getShippingPriceForItem(item.id, prefs.quantity);
        setShipping(res.shippingPrice);
        setEstimatedTax(res.estimatedTax);
      } catch (err) {
        console.error("[edit-preferences] shipping fetch failed", err);
      }
    });
  }, [prefs.quantity, item.id]);

  const pricing = useMemo(
    () => computeLivePricing(item, prefs.quantity, shipping),
    [item, prefs.quantity, shipping],
  );

  const view: PreferencesView = {
    ...prefs,
    endsAt,
    shipping,
    estimatedTax,
    refreshingShipping,
    ...pricing,
  };

  return {
    view,
    setUnusedItems: (n: number) => setPrefs((p) => ({ ...p, unusedItems: n })),
    setValidityType: (t: ValidityType) =>
      setPrefs((p) => (p.validityType === t ? p : { ...p, validityType: t, validityValue: 0 })),
    setValidityValue: (n: number) => setPrefs((p) => ({ ...p, validityValue: n })),
    setUpcomingReminder: (d: Date) => setPrefs((p) => ({ ...p, upcomingReminder: d })),
    setQuantity: (n: number) => setPrefs((p) => ({ ...p, quantity: n })),
  };
}

function initialState(item: RenewalItem): PreferencesState {
  return {
    unusedItems: 0,
    validityType: item.validityType,
    validityValue: item.validityValue,
    quantity: item.quantity,
    upcomingReminder: item.upcomingReminder ? new Date(item.upcomingReminder) : new Date(),
  };
}

function addInterval(date: Date, value: number, unit: ValidityType): Date {
  const out = new Date(date);
  if (value <= 0) return out;
  if (unit === "MONTHS") out.setMonth(out.getMonth() + value);
  else out.setDate(out.getDate() + value * 7);
  return out;
}

function computeLivePricing(item: RenewalItem, quantity: number, shipping: number) {
  const baseQty = Math.max(1, item.quantity);
  const productUnit = (item.pricingLines[0]?.amount ?? 0) / baseQty;
  const productOriginalUnit = unitOf(item.pricingLines[0]?.originalAmount, baseQty);

  const lines: PriceLine[] = [
    {
      label: item.productName,
      amount: round2(productUnit * quantity),
      originalAmount: productOriginalUnit !== null ? round2(productOriginalUnit * quantity) : null,
    },
  ];

  let linkedAmount = 0;
  if (item.linkedProductName && item.linkedProductPrice !== null) {
    const linkedQtyBase = item.linkedProductQuantity ?? 1;
    const linkedQty = linkedQtyBase * quantity;
    const linkedOriginalLineBase = baseQty * linkedQtyBase;
    const linkedOriginalUnit = unitOf(item.pricingLines[1]?.originalAmount, linkedOriginalLineBase);

    linkedAmount = round2(item.linkedProductPrice * linkedQty);
    lines.push({
      label: `Zone ${item.subscription.zone} (${item.linkedProductName})`,
      amount: linkedAmount,
      originalAmount:
        linkedOriginalUnit !== null ? round2(linkedOriginalUnit * linkedQty) : null,
    });
  }

  const subTotal = round2((lines[0]?.amount ?? 0) + linkedAmount);
  const isFedex = item.taxSource === "FEDEX";
  const tax = isFedex ? 0 : round2((subTotal * item.taxPercent) / 100);
  const total = round2(subTotal + shipping + tax);

  return { pricingLines: lines, subTotal, tax, total };
}

function unitOf(amount: number | null | undefined, quantity: number): number | null {
  if (amount == null || quantity <= 0) return null;
  return amount / quantity;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
