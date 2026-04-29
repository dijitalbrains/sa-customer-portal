"use client";

import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { formatPrice } from "@/lib/utils/currency";
import type {
  ProductRef,
  SubscriptionItemSnapshot,
  SubscriptionSnapshot,
} from "@/lib/actions/zone.actions";

const P1_FILTER_KEY = "p1-filter";
const SHOWER_FILTER_KEY = "shower-filter";

interface ZoneSummaryProps {
  subscription: SubscriptionSnapshot;
  p1Filter: ProductRef | null;
  newZone: number;
  newLinkedProduct: ProductRef | null;
  newP1ValidityMonths: number | null;
  loading: boolean;
  invalidZip: boolean;
  zipValue: string;
}

export default function ZoneSummary({
  subscription,
  p1Filter,
  newZone,
  newLinkedProduct,
  newP1ValidityMonths,
  loading,
  invalidZip,
  zipValue,
}: ZoneSummaryProps) {
  if (invalidZip) return <InvalidZip zip={zipValue} />;

  const rows = buildRows({
    subscription,
    p1Filter,
    newZone,
    newLinkedProduct,
    newP1ValidityMonths,
  });
  const total = rows.reduce((sum, row) => sum + row.price, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-base text-text-heading">Zone {newZone}:</h3>
        {loading && <span className="text-[11px] text-text-muted">Calculating…</span>}
      </div>

      <div className="rounded-2xl bg-[#eef6fc] p-5 flex flex-col gap-4">
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
          <span>Total: {formatPrice(total)}</span>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <ProductRow key={row.key} row={row} />
          ))}
        </div>

        <p className="text-[11px] text-text-muted leading-snug">
          Zone and pricing are calculated based on your location.
        </p>
      </div>
    </div>
  );
}

interface SummaryRow {
  key: string;
  icon: string;
  name: string;
  iconHint?: string;
  subtitle: string;
  price: number;
}

function buildRows({
  subscription,
  p1Filter,
  newZone,
  newLinkedProduct,
  newP1ValidityMonths,
}: {
  subscription: SubscriptionSnapshot;
  p1Filter: ProductRef | null;
  newZone: number;
  newLinkedProduct: ProductRef | null;
  newP1ValidityMonths: number | null;
}): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const mainItem = findMainItem(subscription.items);
  const existingP1Item = findP1Item(subscription.items);

  if (mainItem) {
    const linked =
      newZone !== subscription.zone ? newLinkedProduct : mainItem.linkedProduct;
    const unitPrice = mainItem.product.price + (linked?.price ?? 0);
    const total = unitPrice * mainItem.quantity;

    rows.push({
      key: "renewal",
      icon: "/assets/icons/figma/renewal-icon.svg",
      name: mainItem.product.name,
      iconHint: linked ? `All filters + Zone (${newZone}) ${linked.name}.` : undefined,
      subtitle: `Change out every ${mainItem.validityValue} ${mainItem.validityType.toLowerCase()}.`,
      price: total,
    });
  }

  const showP1 = shouldShowP1({
    existingP1Item,
    mainItem,
    newZone,
    originalZone: subscription.zone,
  });

  if (showP1 && p1Filter) {
    const validityMonths = newP1ValidityMonths ?? existingP1Item?.validityValue ?? null;
    rows.push({
      key: "p1",
      icon: "/assets/icons/figma/filter-icon.svg",
      name: p1Filter.name,
      subtitle: validityMonths
        ? `Suggested to change out every ${validityMonths} months.`
        : "Suggested P1 filter.",
      price: p1Filter.price,
    });
  }

  return rows;
}

function findMainItem(items: SubscriptionItemSnapshot[]): SubscriptionItemSnapshot | null {
  return items.find((item) => item.product.key !== P1_FILTER_KEY) ?? null;
}

function findP1Item(items: SubscriptionItemSnapshot[]): SubscriptionItemSnapshot | null {
  return items.find((item) => item.product.key === P1_FILTER_KEY) ?? null;
}

function shouldShowP1({
  existingP1Item,
  mainItem,
  newZone,
  originalZone,
}: {
  existingP1Item: SubscriptionItemSnapshot | null;
  mainItem: SubscriptionItemSnapshot | null;
  newZone: number;
  originalZone: number;
}): boolean {
  if (newZone === 0) return false;
  if (existingP1Item) return true;
  return (
    originalZone === 0 &&
    mainItem !== null &&
    mainItem.product.key !== SHOWER_FILTER_KEY
  );
}

function ProductRow({ row }: { row: SummaryRow }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <ProductIcon src={row.icon} hint={row.iconHint} />
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-text-heading">{row.name}</span>
          <span className="text-[11px] text-text-muted">{row.subtitle}</span>
        </div>
      </div>
      <span className="text-[13px] font-bold text-text-heading shrink-0">
        {formatPrice(row.price)}
      </span>
    </div>
  );
}

function ProductIcon({ src, hint }: { src: string; hint?: string }) {
  if (!hint) {
    return (
      <span className="w-9 h-9 rounded-lg bg-[#eef6fc] flex items-center justify-center shrink-0">
        <img src={src} alt="" className="w-5 h-5" />
      </span>
    );
  }
  return <ProductIconWithHint src={src} hint={hint} />;
}

function ProductIconWithHint({ src, hint }: { src: string; hint: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover className="relative shrink-0">
      <PopoverButton
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-9 h-9 rounded-lg bg-[#eef6fc] flex items-center justify-center cursor-pointer focus:outline-none"
      >
        <img src={src} alt="" className="w-5 h-5" />
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

function InvalidZip({ zip }: { zip: string }) {
  return (
    <div className="rounded-2xl border border-status-error-text/40 bg-status-error/40 p-5">
      <p className="text-[12px] text-status-error-text">
        This zip code <strong>{zip}</strong> is not in our system yet. Please contact support
        for assistance.
      </p>
    </div>
  );
}
