"use client";

import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import InvalidZipcode from "@/components/error/invalid-zipcode";
import { formatPrice } from "@/lib/utils/currency";
import type {
  ProductRef,
  SubscriptionItemSnapshot,
  SubscriptionSnapshot,
} from "@/lib/types/zone";

const P1_FILTER_KEY = "p1-filter";
const SHOWER_FILTER_KEY = "shower-filter";

interface ZoneSummaryProps {
  subscription: SubscriptionSnapshot;
  p1Filter: ProductRef | null;
  newZone: number;
  newLinkedFilter: ProductRef | null;
  newP1ValidityMonths: number | null;
  loading: boolean;
  invalidZip: boolean;
  zipValue: string;
}

export default function ZoneSummary({
  subscription,
  p1Filter,
  newZone,
  newLinkedFilter,
  newP1ValidityMonths,
  loading,
  invalidZip,
  zipValue,
}: ZoneSummaryProps) {
  if (invalidZip) return <InvalidZipcode zip={zipValue} />;

  const renewalItem = subscription.items.find((item) => item.product.key !== P1_FILTER_KEY) ?? null;
  const existingP1Item = subscription.items.find((item) => item.product.key === P1_FILTER_KEY) ?? null;

  const linkedFilter =
    newZone !== subscription.zone ? newLinkedFilter : renewalItem?.linkedProduct ?? null;
  const renewalTotal = computeRenewalTotal(renewalItem, linkedFilter);

  const showP1Row = shouldShowP1Row({
    existingP1Item,
    renewalItem,
    newZone,
    originalZone: subscription.zone,
  });
  const p1ValidityMonths = newP1ValidityMonths ?? existingP1Item?.validityValue ?? null;

  const grandTotal = renewalTotal + (showP1Row && p1Filter ? p1Filter.price : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-base text-text-heading">Zone {newZone}:</h3>
        {loading && <span className="text-[11px] text-text-muted">Calculating…</span>}
      </div>

      <div className="rounded-[8px] border border-border-subtle bg-[#eef6fc] p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-bold text-brand-primary">
            Filter renewal pricing for your zone
          </h4>
          <p className="text-[11px] text-text-muted leading-snug">
            Based on your water consumption and the quality of the water in your area, we
            recommend a Zone {newZone} filter setup.
          </p>
        </div>

        <div className="flex items-center justify-between text-[13px] font-bold text-text-heading">
          <span>Zone {newZone}:</span>
          <span>Total: {formatPrice(grandTotal)}</span>
        </div>

        <div className="flex flex-col gap-2">
          {renewalItem && (
            <RenewalFilterLine
              renewalItem={renewalItem}
              linkedFilter={linkedFilter}
              newZone={newZone}
              total={renewalTotal}
            />
          )}
          {showP1Row && p1Filter && (
            <P1FilterLine product={p1Filter} validityMonths={p1ValidityMonths} />
          )}
        </div>

        <p className="text-[11px] text-text-muted leading-snug">
          Zone and pricing are calculated based on your location.
        </p>
      </div>
    </div>
  );
}

function computeRenewalTotal(
  renewalItem: SubscriptionItemSnapshot | null,
  linkedFilter: ProductRef | null,
): number {
  if (!renewalItem) return 0;
  const unitPrice = renewalItem.product.price + (linkedFilter?.price ?? 0);
  return unitPrice * renewalItem.quantity;
}

function shouldShowP1Row({
  existingP1Item,
  renewalItem,
  newZone,
  originalZone,
}: {
  existingP1Item: SubscriptionItemSnapshot | null;
  renewalItem: SubscriptionItemSnapshot | null;
  newZone: number;
  originalZone: number;
}): boolean {
  if (newZone === 0) return false;
  if (existingP1Item) return true;
  return (
    originalZone === 0 &&
    renewalItem !== null &&
    renewalItem.product.key !== SHOWER_FILTER_KEY
  );
}

interface RenewalFilterLineProps {
  renewalItem: SubscriptionItemSnapshot;
  linkedFilter: ProductRef | null;
  newZone: number;
  total: number;
}

function RenewalFilterLine({ renewalItem, linkedFilter, newZone, total }: RenewalFilterLineProps) {
  const validityLabel = `Change out every ${renewalItem.validityValue} ${renewalItem.validityType.toLowerCase()}.`;
  const linkedHint = linkedFilter ? `All filters + Zone (${newZone}) ${linkedFilter.name}.` : null;

  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <RenewalIconWithHint hint={linkedHint} />
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-text-heading">{renewalItem.product.name}</span>
          <span className="text-[11px] text-text-muted">{validityLabel}</span>
        </div>
      </div>
      <span className="text-[13px] font-bold text-text-heading shrink-0">{formatPrice(total)}</span>
    </div>
  );
}

interface P1FilterLineProps {
  product: ProductRef;
  validityMonths: number | null;
}

function P1FilterLine({ product, validityMonths }: P1FilterLineProps) {
  const subtitle = validityMonths
    ? `Suggested to change out every ${validityMonths} months.`
    : "Suggested P1 filter.";

  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-9 h-9 rounded-lg bg-[#eef6fc] flex items-center justify-center shrink-0">
          <img src="/assets/icons/filter-icon.svg" alt="" className="w-5 h-5" />
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-text-heading">{product.name}</span>
          <span className="text-[11px] text-text-muted">{subtitle}</span>
        </div>
      </div>
      <span className="text-[13px] font-bold text-text-heading shrink-0">
        {formatPrice(product.price)}
      </span>
    </div>
  );
}

function RenewalIconWithHint({ hint }: { hint: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const iconSrc = "/assets/icons/renewal-icon.svg";

  if (!hint) {
    return (
      <span className="w-9 h-9 rounded-lg bg-[#eef6fc] flex items-center justify-center shrink-0">
        <img src={iconSrc} alt="" className="w-5 h-5" />
      </span>
    );
  }

  return (
    <Popover className="relative shrink-0">
      <PopoverButton
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-9 h-9 rounded-lg bg-[#eef6fc] flex items-center justify-center cursor-pointer focus:outline-none"
      >
        <img src={iconSrc} alt="" className="w-5 h-5" />
      </PopoverButton>
      {isOpen && (
        <PopoverPanel
          static
          anchor={{ to: "top start", gap: 8 }}
          className="z-50 rounded-lg bg-text-heading text-white text-xs px-3 py-2 shadow-lg max-w-xs"
        >
          {hint}
        </PopoverPanel>
      )}
    </Popover>
  );
}

