"use client";

import PricingSummary, { type PricingSummaryProps } from "@/components/shared/pricing-summary";
import AdminEditablePricing from "./admin-editable-pricing";
import { useAdminPricing, type AdminPricing } from "../_hooks/use-admin-pricing";
import type { RenewalItem, LinkedProductOption } from "@/lib/types/subscription";

interface PricingBreakdownProps {
  item: RenewalItem;
  isAdmin: boolean;
  availableLinkedProducts: LinkedProductOption[];
}

export default function PricingBreakdown({
  item,
  isAdmin,
  availableLinkedProducts,
}: PricingBreakdownProps) {
  if (isAdmin) {
    return <AdminPricing item={item} availableLinkedProducts={availableLinkedProducts} />;
  }
  return <PricingSummary {...summaryFromItem(item)} />;
}

function AdminPricing({
  item,
  availableLinkedProducts,
}: {
  item: RenewalItem;
  availableLinkedProducts: LinkedProductOption[];
}) {
  const pricing = useAdminPricing(item, availableLinkedProducts);

  return (
    <div className="flex flex-wrap gap-[13px] w-full h-full">
      <AdminEditablePricing
        item={item}
        pricing={pricing}
        availableLinkedProducts={availableLinkedProducts}
      />
      <div className="flex-1 min-w-[280px]">
        <PricingSummary {...summaryFromAdminPricing(item, pricing)} />
      </div>
    </div>
  );
}

function summaryFromItem(item: RenewalItem): PricingSummaryProps {
  return {
    lines: item.pricingLines,
    taxSource: item.taxSource,
    taxPercent: item.taxPercent,
    tax: item.tax,
    estimatedTax: item.estimatedTax,
    taxExempted: item.taxExempted,
    shipping: item.shipping,
    total: item.total,
    fillParent: true,
  };
}

function summaryFromAdminPricing(item: RenewalItem, pricing: AdminPricing): PricingSummaryProps {
  const isFedex = item.taxSource === "FEDEX";
  return {
    lines: pricing.pricingLines,
    taxSource: item.taxSource,
    taxPercent: item.taxPercent,
    tax: isFedex ? 0 : pricing.tax,
    estimatedTax: isFedex ? pricing.tax : item.estimatedTax,
    taxExempted: item.taxExempted,
    shipping: pricing.shipping,
    total: pricing.total,
    fillParent: true,
  };
}
