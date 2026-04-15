"use client";

import { useState, useTransition } from "react";
import PricingSummary from "@/components/shared/pricing-summary";
import type {
  RenewalItem,
  LinkedProductOption,
} from "@/lib/types/subscription";
import { updateItemAdmin } from "../actions";

interface AdminEditablePricingProps {
  item: RenewalItem;
  availableLinkedProducts: LinkedProductOption[];
}

const FIELD_CLASS =
  "bg-surface-base border border-admin-border rounded-[8px] px-3 py-1.5 flex items-center relative";
const FIELD_LABEL_CLASS =
  "text-[10px] font-semibold uppercase tracking-[1.1px] text-text-muted";
const FIELD_VALUE_CLASS = "text-[13px] font-medium text-text-primary";

export default function AdminEditablePricing({
  item,
  availableLinkedProducts,
}: AdminEditablePricingProps) {
  const initialLinkedId = findInitialLinkedId(item, availableLinkedProducts);
  const initialLinkedPrice = resolveLinkedPrice(initialLinkedId, availableLinkedProducts, item);
  const initialLinkedQty = item.linkedProductQuantity ?? 1;
  const initialProductPrice = deriveProductPrice(item, initialLinkedPrice, initialLinkedQty);

  const [productPrice, setProductPrice] = useState<number>(initialProductPrice);
  const [linkedProductId, setLinkedProductId] = useState<number | null>(initialLinkedId);
  const [linkedPrice, setLinkedPrice] = useState<number>(initialLinkedPrice);
  const [linkedQty, setLinkedQty] = useState<number>(initialLinkedQty);
  const [shipping, setShipping] = useState<number>(item.shipping);
  const [pending, startTransition] = useTransition();

  const selectedProduct =
    availableLinkedProducts.find((p) => p.id === linkedProductId) ?? null;
  const hasLinked = selectedProduct !== null && selectedProduct.id !== null;

  const subTotal = round2(
    productPrice * item.quantity + (hasLinked ? linkedPrice * linkedQty * item.quantity : 0),
  );
  const tax = round2((subTotal * item.taxPercent) / 100);
  const total = round2(subTotal + shipping + tax);

  const pricingLines = [
    { label: item.productName, amount: round2(productPrice * item.quantity) },
    ...(hasLinked && selectedProduct
      ? [
          {
            label: `Zone (${selectedProduct.name})`,
            amount: round2(linkedPrice * linkedQty * item.quantity),
          },
        ]
      : []),
  ];

  const handleSubTotalChange = (newSubTotal: number) => {
    const linkedTotal = hasLinked ? linkedPrice * linkedQty * item.quantity : 0;
    const newProductPrice = (newSubTotal - linkedTotal) / Math.max(1, item.quantity);
    setProductPrice(Math.max(0, newProductPrice));
  };

  const handleLinkedProductChange = (id: number | null) => {
    setLinkedProductId(id);
    setLinkedPrice(resolveLinkedPrice(id, availableLinkedProducts, item));
    if (id === null) setLinkedQty(1);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateItemAdmin({
        itemId: item.id,
        linkedProductId,
        linkedProductQuantity: linkedQty,
      });
    });
  };

  return (
    <>
      <div className="rounded-lg p-4 flex flex-col gap-3 bg-admin-bg border border-admin-border">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-admin-accent text-white text-[10px]">
            🔒
          </span>
          <span className="text-[12px] font-semibold text-admin-accent">
            Admin Only — Editable Fields
          </span>
        </div>

        <AdminInputCurrency label="Sub Total" value={subTotal} onChange={handleSubTotalChange} />

        {!item.isP1Filter && (
          <LinkedProductSelect
            value={linkedProductId}
            options={availableLinkedProducts}
            onChange={handleLinkedProductChange}
          />
        )}

        {hasLinked && selectedProduct && (
          <>
            <AdminInputCurrency
              label={`${selectedProduct.name} — Price`}
              value={linkedPrice}
              onChange={setLinkedPrice}
            />
            <AdminInputField
              label={`Zone Filter Quantity (${selectedProduct.name})`}
              value={linkedQty}
              onChange={setLinkedQty}
            />
          </>
        )}

        <AdminInputCurrency label="Shipping & Handling" value={shipping} onChange={setShipping} />

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="w-full py-2.5 rounded-[8px] text-[12px] font-semibold text-white bg-admin-accent hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="h-px bg-border-subtle/30 w-full" />

      <PricingSummary
        lines={pricingLines}
        taxPercent={item.taxPercent}
        tax={tax}
        shipping={shipping}
        total={total}
      />
    </>
  );
}

function findInitialLinkedId(
  item: RenewalItem,
  options: LinkedProductOption[],
): number | null {
  if (!item.linkedProductName) return null;
  return options.find((p) => p.name === item.linkedProductName)?.id ?? null;
}

function resolveLinkedPrice(
  id: number | null,
  options: LinkedProductOption[],
  item: RenewalItem,
): number {
  if (id === null) return 0;
  const option = options.find((p) => p.id === id);
  if (option) return option.price;
  return item.linkedProductPrice ?? 0;
}

function deriveProductPrice(
  item: RenewalItem,
  linkedPrice: number,
  linkedQty: number,
): number {
  const qty = Math.max(1, item.quantity);
  const linkedTotal = linkedPrice * linkedQty * qty;
  return Math.max(0, (item.subTotal - linkedTotal) / qty);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface LinkedProductSelectProps {
  value: number | null;
  options: LinkedProductOption[];
  onChange: (id: number | null) => void;
}

function LinkedProductSelect({ value, options, onChange }: LinkedProductSelectProps) {
  return (
    <div className={`${FIELD_CLASS} py-1 flex-col gap-0.5 items-stretch`}>
      <span className={FIELD_LABEL_CLASS}>Zone Filter (Linked Product)</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={`${FIELD_VALUE_CLASS} bg-transparent focus:outline-none appearance-none cursor-pointer pr-6`}
      >
        {options.map((opt) => (
          <option key={opt.id ?? "none"} value={opt.id ?? ""}>
            {opt.name}
          </option>
        ))}
      </select>
      <img
        src="/assets/icons/chevron-expanded.svg"
        alt=""
        className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
      />
    </div>
  );
}

interface AdminInputCurrencyProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function AdminInputCurrency({ label, value, onChange }: AdminInputCurrencyProps) {
  return (
    <div className={FIELD_CLASS}>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className={FIELD_LABEL_CLASS}>{label}</span>
        <div className={`${FIELD_VALUE_CLASS} flex items-center gap-1`}>
          <span>$</span>
          <input
            type="number"
            step="any"
            min={0}
            value={Number.isFinite(value) ? round2(value) : 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 bg-transparent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

interface AdminInputFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function AdminInputField({ label, value, onChange }: AdminInputFieldProps) {
  return (
    <div className={`${FIELD_CLASS} justify-between`}>
      <div className="flex flex-col gap-0.5">
        <span className={FIELD_LABEL_CLASS}>{label}</span>
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
          className={`${FIELD_VALUE_CLASS} bg-transparent focus:outline-none w-16`}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-6 h-6 rounded-md bg-surface-overlay border border-border-subtle text-text-primary text-[14px] flex items-center justify-center cursor-pointer"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded-md bg-brand-primary text-white text-[14px] flex items-center justify-center cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}
