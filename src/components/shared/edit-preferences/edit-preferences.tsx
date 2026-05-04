"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import DropdownField from "@/components/ui/dropdown-field";
import TabButtonGroup from "@/components/ui/tab-button-group";
import PricingSummary, { type PricingSummaryProps } from "@/components/shared/pricing-summary";
import { useEditPreferences } from "@/lib/hooks/use-edit-preferences";
import { updatePreferences } from "@/lib/actions/preferences.actions";
import { formatNumericDate } from "@/lib/utils/date";
import type { RenewalItem } from "@/lib/types/subscription";
import type { ValidityType } from "@/lib/types/preferences";
import StepSection from "./step-section";
import StepReminder from "./step-reminder";
import StepQuantity from "./step-quantity";

interface EditPreferencesProps {
  open: boolean;
  onClose: () => void;
  item: RenewalItem;
}

const INVENTORY_OPTIONS = Array.from({ length: 21 }, (_, i) => ({
  value: i,
  label: String(i),
}));

const VALIDITY_TYPE_OPTIONS: { label: string; value: ValidityType }[] = [
  { label: "Months", value: "MONTHS" },
  { label: "Weeks", value: "WEEKS" },
];

const MONTH_OPTIONS = buildValidityValueOptions(24, "month");
const WEEK_OPTIONS = buildValidityValueOptions(80, "week");

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
            className={`grid gap-6 px-7 py-4 ${
              isLoyalty ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div className="flex flex-col gap-4">
              <StepSection
                number={1}
                title="Current filter inventory"
                description={`How many unopened/unused ${item.productName} filters do you have?`}
              >
                <DropdownField
                  value={pref.view.unusedItems}
                  onChange={pref.setUnusedItems}
                  options={INVENTORY_OPTIONS}
                />
              </StepSection>

              <StepSection
                number={2}
                title="Renewal frequency"
                description={`How often do you want to change your ${item.productName} filter?`}
              >
                <div className="mb-2.5">
                  <TabButtonGroup
                    options={VALIDITY_TYPE_OPTIONS}
                    value={pref.view.validityType}
                    onChange={pref.setValidityType}
                  />
                </div>
                <DropdownField
                  value={pref.view.validityValue}
                  onChange={pref.setValidityValue}
                  options={pref.view.validityType === "MONTHS" ? MONTH_OPTIONS : WEEK_OPTIONS}
                />
              </StepSection>

              <StepReminder
                value={pref.view.upcomingReminder}
                validityValue={pref.view.validityValue}
                validityType={pref.view.validityType}
                onChange={pref.setUpcomingReminder}
              />

              {!isLoyalty && (
                <ReviewSection
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
                <ReviewSection
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
          <img src="/assets/icons/setup-icon.svg" alt="" />
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
          <img src="/assets/icons/close.svg" alt="" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ReviewSectionProps {
  stepNumber: number;
  unusedItems: number;
  upcomingReminder: Date | null;
  quantity: number;
  showQuantity: boolean;
}

function ReviewSection({
  stepNumber,
  unusedItems,
  upcomingReminder,
  quantity,
  showQuantity,
}: ReviewSectionProps) {
  return (
    <StepSection
      number={stepNumber}
      title="Review & save"
      description="Review your preferences before saving."
    >
      <div className="rounded-lg border border-border-subtle/50 bg-surface-overlay px-2.5 py-2 flex flex-col gap-1 text-[9px]">
        <ReviewRow label="Current Filter Inventory:" value={String(unusedItems)} />
        <ReviewRow
          label="Your next filter change reminder:"
          value={upcomingReminder ? formatNumericDate(upcomingReminder) : "Pending Install"}
        />
        {showQuantity && (
          <ReviewRow label="Quantity on your next shipment:" value={formatPack(quantity)} />
        )}
      </div>
    </StepSection>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-text-muted">{label}</span>
      <span className="font-bold text-text-primary">{value}</span>
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

function buildValidityValueOptions(max: number, unit: "month" | "week") {
  return [
    { value: 0, label: "Select a value" },
    ...Array.from({ length: max }, (_, i) => ({
      value: i + 1,
      label: `${i + 1} ${unit}${i === 0 ? "" : "s"}`,
    })),
  ];
}

function formatPack(quantity: number): string {
  return quantity > 1 ? `Pack of ${quantity}` : String(quantity);
}
