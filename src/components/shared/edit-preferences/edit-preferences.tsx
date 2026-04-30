"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import PricingSummary, { type PricingSummaryProps } from "@/components/shared/pricing-summary";
import { useEditPreferences } from "@/app/(portal)/detail/_hooks/use-edit-preferences";
import { updatePreferences } from "@/lib/actions/preferences.actions";
import type { RenewalItem } from "@/lib/types/subscription";
import StepInventory from "./step-inventory";
import StepFrequency from "./step-frequency";
import StepReminder from "./step-reminder";
import StepQuantity from "./step-quantity";
import StepReview from "./step-review";

interface EditPreferencesProps {
  open: boolean;
  onClose: () => void;
  item: RenewalItem;
}

export default function EditPreferences({ open, onClose, item }: EditPreferencesProps) {
  const pref = useEditPreferences(item);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLoyalty = item.subscription.isLoyaltyEnabled;
  const reviewStepNumber = isLoyalty ? 5 : 4;

  const submit = () => {
    setError(null);
    if (!pref.view.validityValue) return setError("Choose a validity value.");

    startTransition(async () => {
      try {
        await updatePreferences({
          itemId: item.id,
          unusedItems: pref.view.unusedItems,
          validityType: pref.view.validityType,
          validityValue: pref.view.validityValue,
          quantity: pref.view.quantity,
          upcomingReminder: pref.view.upcomingReminder.toISOString(),
        });
        toast.success("Preferences updated");
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to update preferences";
        toast.error(message);
        setError(message);
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-text-heading/50 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <DialogPanel
          className={`relative bg-white rounded-3xl shadow-[0px_0px_0px_1px_rgba(55,146,222,0.08),0px_32px_80px_-8px_rgba(8,20,40,0.5)] w-full ${
            isLoyalty ? "max-w-[1020px]" : "max-w-[540px]"
          }`}
        >
          <Header onClose={onClose} />

          <div
            className={`grid gap-6 px-7 py-6 ${
              isLoyalty ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div className="flex flex-col gap-5">
              <StepInventory
                productName={item.productName}
                value={pref.view.unusedItems}
                onChange={pref.setUnusedItems}
              />
              <StepFrequency
                productName={item.productName}
                validityType={pref.view.validityType}
                validityValue={pref.view.validityValue}
                onValidityType={pref.setValidityType}
                onValidityValue={pref.setValidityValue}
              />
              <StepReminder
                value={pref.view.upcomingReminder}
                validityValue={pref.view.validityValue}
                validityType={pref.view.validityType}
                onChange={pref.setUpcomingReminder}
              />
              {!isLoyalty && (
                <StepReview
                  stepNumber={reviewStepNumber}
                  unusedItems={pref.view.unusedItems}
                  upcomingReminder={pref.view.upcomingReminder}
                  quantity={pref.view.quantity}
                  showQuantity={false}
                />
              )}
            </div>

            {isLoyalty && (
              <div className="flex flex-col gap-5">
                <StepQuantity
                  productKey={item.productKey}
                  value={pref.view.quantity}
                  onChange={pref.setQuantity}
                />
                <StepReview
                  stepNumber={reviewStepNumber}
                  unusedItems={pref.view.unusedItems}
                  upcomingReminder={pref.view.upcomingReminder}
                  quantity={pref.view.quantity}
                  showQuantity
                />
                <PricingSummary {...buildSummaryProps(item, pref.view)} />
              </div>
            )}
          </div>

          {error && <p className="px-7 text-xs text-status-error-text">{error}</p>}

          <div className="px-7 pb-7 pt-2 flex justify-center">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="h-11 w-[458px] max-w-full rounded-pill bg-brand-gradient shadow-[0px_6px_18px_0px_rgba(55,146,222,0.35)] text-white font-bold text-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
            >
              {pending ? "Saving…" : "Update and Save"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="border-b border-border-subtle/50">
      <div className="flex items-center justify-between gap-3 px-7 py-3">
        <div className="flex items-center gap-3">
            <img src="/assets/icons/figma/setup-icon.svg" alt="" />
          <h3 className="font-bold text-[17px] text-text-heading leading-tight">
            Edit Preferences
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-overlay cursor-pointer"
        >
          <img src="/assets/icons/figma/close.svg" alt="" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function buildSummaryProps(
  item: RenewalItem,
  view: ReturnType<typeof useEditPreferences>["view"],
): PricingSummaryProps {
  const isFedex = item.taxSource === "FEDEX";
  return {
    lines: view.pricingLines,
    taxSource: item.taxSource,
    taxPercent: item.taxPercent,
    tax: view.tax,
    estimatedTax: isFedex ? view.estimatedTax : item.estimatedTax,
    taxExempted: item.taxExempted,
    shipping: view.shipping,
    total: view.total,
    fillParent: true,
  };
}
