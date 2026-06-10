"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import QuantityStepper from "@/components/ui/quantity-stepper";
import AddedToCartDialog from "./added-to-cart-dialog";
import { runSubscription } from "@/lib/actions/order.actions";
import { addToCart } from "@/lib/actions/cart.actions";
import { getShippingPriceForItem } from "@/lib/actions/preferences.actions";
import { round2 } from "@/lib/utils/currency";
import { formatPrice } from "@/lib/utils/currency";
import type { CartItem } from "@/lib/types/cart";
import type { PriceLine, RenewalItem } from "@/lib/types/subscription";

interface NeedThisNowModalProps {
  open: boolean;
  onClose: () => void;
  item: RenewalItem;
}

type RunType = "run-subscription" | "add-to-cart";

const MAX_QUANTITY_BY_KEY: Record<string, number> = {
  "me-renewal-filter": 20,
};
const DEFAULT_MAX_QUANTITY = 4;

export default function NeedThisNowModal({ open, onClose, item }: NeedThisNowModalProps) {
  const [type, setType] = useState<RunType>("run-subscription");
  const [quantity, setQuantity] = useState(item.quantity);
  const [shipping, setShipping] = useState(item.shipping);
  const [refreshingShipping, startShippingTransition] = useTransition();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addedItem, setAddedItem] = useState<CartItem | null>(null);

  const maxQuantity = MAX_QUANTITY_BY_KEY[item.productKey] ?? DEFAULT_MAX_QUANTITY;
  const subtitle = buildSubtitle(item);

  const lines = useMemo(() => rescaleLines(item, quantity), [item, quantity]);
  const subtotal = useMemo(
    () => round2(lines.reduce((sum, l) => sum + l.amount, 0)),
    [lines],
  );
  const discountTotal = useMemo(
    () =>
      round2(
        lines.reduce(
          (sum, l) => sum + (l.originalAmount != null ? l.originalAmount - l.amount : 0),
          0,
        ),
      ),
    [lines],
  );
  const isFedex = item.taxSource === "FEDEX";
  const taxableTax = isFedex ? 0 : round2((subtotal * item.taxPercent) / 100);
  const taxExempted = item.taxExempted != null ? taxableTax : null;
  const tax = taxExempted != null ? 0 : taxableTax;
  const total = round2(subtotal + shipping + tax);

  const handleQuantityChange = (next: number) => {
    setQuantity(next);
    startShippingTransition(async () => {
      try {
        const res = await getShippingPriceForItem(item.id, next);
        setShipping(res.shippingPrice);
      } catch {
        // keep previous shipping on transient errors
      }
    });
  };

  const handlePrimary = () => {
    setError(null);
    if (type === "add-to-cart") {
      startSaving(async () => {
        try {
          const result = await addToCart({ subscriptionItemId: item.id, quantity });
          setAddedItem(result.addedItem);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to add to cart";
          toast.error(message);
          setError(message);
        }
      });
      return;
    }
    startSaving(async () => {
      try {
        await runSubscription({ subscriptionItemId: item.id, quantity });
        toast.success("Subscription order placed");
        onClose();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to place order";
        toast.error(message);
        setError(message);
      }
    });
  };

  const handleAddedDialogClose = () => {
    setAddedItem(null);
    onClose();
  };

  const ctaLabel = type === "run-subscription" ? "Purchase" : "Add to cart";

  if (addedItem) {
    return (
      <AddedToCartDialog open onClose={handleAddedDialogClose} item={addedItem} />
    );
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-[480px]" showClose={false}>
      <div className="flex items-start justify-between gap-3 px-7 pt-5 pb-4">
        <div className="flex flex-col leading-tight">
          <h3 className="font-bold text-[17px] text-text-heading">Need This Item Right Now?</h3>
          {subtitle && <span className="text-[11px] text-text-muted mt-1">{subtitle}</span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/5 cursor-pointer"
        >
          <img src="/assets/icons/close.svg" alt="" className="w-3.5 h-3.5" />
        </button>
      </div>

      <Divider />

      <div className="px-7 py-4 flex flex-col gap-3">
        <p className="text-[13px] font-bold text-text-heading">Please answer the following</p>
        <RadioRow
          label="Run subscription now"
          selected={type === "run-subscription"}
          onSelect={() => setType("run-subscription")}
        />
        <RadioRow
          label="Add this to your cart as an extra one-time order without updating subscription"
          selected={type === "add-to-cart"}
          onSelect={() => setType("add-to-cart")}
        />
      </div>

      {type === "add-to-cart" && (
        <>
          <Divider />
          <div className="px-7 py-4 flex items-center gap-5">
            <span className="text-[13px] font-bold text-text-heading">Quantity:</span>
            <QuantityStepper
              value={quantity}
              min={1}
              max={maxQuantity}
              disabled={saving || refreshingShipping}
              onChange={handleQuantityChange}
            />
          </div>

          <Divider />

          <div className="px-7 py-4">
            <h4 className="font-bold text-[14px] text-text-heading">Subscription breakdown</h4>
            {item.subscription.isLoyaltyEnabled && (
              <p className="text-[12px] text-text-muted mt-1.5 leading-snug">
                Thank you for participating in the customer loyalty program. We have added a{" "}
                <span className="text-[#08cb00] font-semibold">{formatPrice(discountTotal)}</span>{" "}
                discount below
              </p>
            )}

            <div className="mt-3 bg-[#eef6fc] rounded-2xl px-5 py-4 flex flex-col gap-3">
              {lines.map((line, i) => (
                <BreakdownRow
                  key={i}
                  label={line.label}
                  amount={line.amount}
                  originalAmount={line.originalAmount}
                />
              ))}
              {!isFedex && (
                <BreakdownRow
                  label={`Tax (${item.taxPercent.toFixed(1)}%)`}
                  amount={tax}
                  originalAmount={taxExempted}
                />
              )}
              <BreakdownRow label="Shipping & Handling" amount={shipping} />

              <div className="border-t border-border-subtle/60 mt-1 pt-3 flex items-center justify-between">
                <span className="font-bold text-[14px] text-text-heading">Total</span>
                <span className="font-bold text-[16px] text-brand-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="mx-7 mb-3 rounded-[8px] bg-[#FCEBEB] border border-[#791F1F40] px-3 py-2 text-[12px] text-[#791F1F]">
          {error}
        </div>
      )}

      <div className="px-7 pb-6 pt-2">
        <Button
          type="button"
          variant="primary"
          loading={saving}
          loadingText="Please wait…"
          onClick={handlePrimary}
          className="w-full rounded-pill"
        >
          {ctaLabel}
        </Button>
      </div>
    </Modal>
  );
}

function Divider() {
  return <div className="h-px bg-border-subtle/60 mx-7" />;
}

interface RadioRowProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RadioRow({ label, selected, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 text-left cursor-pointer w-full"
    >
      <span
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-brand-primary" : "border-border-subtle"
        }`}
        aria-hidden
      >
        {selected && <span className="w-2 h-2 rounded-full bg-brand-primary" />}
      </span>
      <span className="text-[13px] text-text-primary leading-snug">{label}</span>
    </button>
  );
}

interface BreakdownRowProps {
  label: string;
  amount: number;
  originalAmount?: number | null;
}

function BreakdownRow({ label, amount, originalAmount }: BreakdownRowProps) {
  const showOriginal =
    originalAmount != null && originalAmount > 0 && originalAmount !== amount;
  return (
    <div className="flex items-center justify-between text-[13px] text-text-primary">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        {showOriginal && (
          <span className="text-text-muted line-through">{formatPrice(originalAmount)}</span>
        )}
        <span>{formatPrice(amount)}</span>
      </span>
    </div>
  );
}

function buildSubtitle(item: RenewalItem): string {
  const tech = item.subscription.technology;
  const nickname = item.subscription.nickname;
  const left = `${item.productName} · ${tech}`;
  return nickname ? `${left} | ${nickname}` : left;
}

function rescaleLines(item: RenewalItem, newQuantity: number): PriceLine[] {
  if (item.quantity === 0) return item.pricingLines;
  const factor = newQuantity / item.quantity;
  return item.pricingLines.map((line, index) => {
    const lineQty = index === 0 ? newQuantity : (item.linkedProductQuantity ?? 1) * newQuantity;
    const stripped = line.label.replace(/^\(\d+x\)\s+/, "");
    return {
      label: lineQty > 1 ? `(${lineQty}x) ${stripped}` : stripped,
      amount: round2(line.amount * factor),
      originalAmount: line.originalAmount != null ? round2(line.originalAmount * factor) : null,
    };
  });
}
