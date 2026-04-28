"use client";

import type { RenewalItem, LinkedProductOption } from "@/lib/types/subscription";
import type { AdminPricing } from "../_hooks/use-admin-pricing";
import { CurrencyRow, QuantityRow, SelectRow } from "./admin-fields";

interface AdminEditablePricingProps {
  item: RenewalItem;
  pricing: AdminPricing;
  availableLinkedProducts: LinkedProductOption[];
}

export default function AdminEditablePricing({
  item,
  pricing,
  availableLinkedProducts,
}: AdminEditablePricingProps) {
  const { selectedProduct, hasLinked, pending } = pricing;

  return (
    <div className="flex-1 min-w-[280px] bg-admin-bg border border-border-card rounded-card p-[19px] flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-sm text-admin-accent whitespace-pre">
          {`Admin Only  —  Editable Fields`}
        </h4>
        {pending && (
          <span className="text-[11px] font-medium text-admin-accent/70">Saving…</span>
        )}
      </div>

      <div className="mt-3.5 flex flex-col gap-[9px]">
        <CurrencyRow label="Sub Total" value={pricing.subTotal} onChange={pricing.changeSubTotal} />

        {!item.isP1Filter && (
          <SelectRow
            label="Zone Filter"
            value={pricing.linkedProductId}
            options={availableLinkedProducts}
            onChange={pricing.changeLinkedProduct}
          />
        )}

        {hasLinked && selectedProduct && (
          <>
            <CurrencyRow
              label={`${selectedProduct.name} — Price`}
              value={pricing.linkedPrice}
              onChange={pricing.setLinkedPrice}
            />
            <QuantityRow
              label={`Zone Filter Quantity (${selectedProduct.name})`}
              value={pricing.linkedQty}
              onChange={pricing.changeLinkedQty}
            />
          </>
        )}

        <CurrencyRow
          label="Shipping & Handling"
          value={pricing.shipping}
          onChange={pricing.setShipping}
        />
      </div>
    </div>
  );
}
