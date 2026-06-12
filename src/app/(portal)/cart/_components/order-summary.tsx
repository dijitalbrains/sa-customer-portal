"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import ChangeShippingDialog from "@/components/shared/addresses/change-shipping-address/change-shipping-dialog";
import ChangePaymentMethodDialog, {
  type PaymentSelection,
} from "@/components/shared/payments/change-payment-method/change-payment-method-dialog";
import { formatPrice } from "@/lib/utils/currency";
import { round2 } from "@/lib/utils/currency";
import {
  applyCredits,
  removeCredits,
  updateAllCartItemsAddress,
  updateCartPaymentMethod,
} from "@/lib/actions/cart.actions";
import { placeOrder } from "@/lib/actions/order.actions";
import type { Cart } from "@/lib/types/cart";

interface OrderSummaryProps {
  cart: Cart;
  creditBalance: number;
}

export default function OrderSummary({ cart, creditBalance }: OrderSummaryProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const loyaltyDiscount = useMemo(() => {
    return round2(
      cart.items.reduce((sum, item) => {
        return (
          sum +
          item.pricingLines.reduce(
            (acc, line) =>
              acc + (line.originalAmount != null ? line.originalAmount - line.amount : 0),
            0,
          )
        );
      }, 0),
    );
  }, [cart]);

  const taxPercent = cart.items[0]?.taxPercent ?? 0;
  const isFedex = cart.items[0]?.userAddress.country.shippingPriceSource === "FEDEX";
  const paymentLabel = buildPaymentLabel(cart);
  const shippingLabel = buildShippingLabel(cart);

  const creditsApplied = cart.creditsUsed > 0;
  const orderTotal = round2(cart.total - cart.creditsUsed);
  const showCreditBanner = creditBalance > 0 && !creditsApplied;

  const handleApplyCredits = () => {
    startTransition(async () => {
      try {
        await applyCredits();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to apply credits");
      }
    });
  };

  const handleRemoveCredits = () => {
    startTransition(async () => {
      try {
        await removeCredits();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove credits");
      }
    });
  };

  const handlePlaceOrder = () => {
    startTransition(async () => {
      try {
        await placeOrder();
        router.push("/thank-you");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to place order");
      }
    });
  };

  const handleAddressSave = async (userAddressId: number) => {
    await updateAllCartItemsAddress(userAddressId);
  };

  const handlePaymentSave = async (selection: PaymentSelection) => {
    await updateCartPaymentMethod(selection);
  };

  const firstAddressId = cart.items[0]?.userAddressId ?? 0;
  const currentCardId = cart.userStripeSource?.id ?? null;
  const currentBankId = cart.userBankAccount?.id ?? null;

  return (
    <aside className="bg-white shadow-card rounded-card flex flex-col gap-4 sticky top-3 py-3">
      <h2 className="font-bold text-[15px] text-text-heading px-5 py-0">Order Summary</h2>

      {showCreditBanner && (
        <div className="px-5 bg-[#F0FDF4] border-t border-b border-[#22BB62]/30 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[12px] text-[#22BB62]">
              You have Spring Aqua credits!
            </span>
            <span className="font-bold text-[13px] text-[#22BB62]">
              {formatPrice(creditBalance)}
            </span>
          </div>
          <p className="text-[10px] text-black leading-snug">
            You may apply these credits below by clicking apply credits
          </p>
          <button
            type="button"
            onClick={handleApplyCredits}
            disabled={pending}
            className="border border-[#22BB62] self-start mt-1 px-3 py-1 rounded-full bg-white/80 text-[10px] font-semibold text-[#22BB62] hover:bg-white cursor-pointer disabled:opacity-50"
          >
            Apply credits
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 text-[13px] px-5">
        <SummaryRow
          label={`Subtotal (${cart.items.length} items)`}
          value={formatPrice(cart.subtotal)}
        />
        {loyaltyDiscount > 0 && (
          <SummaryRow
            label="Loyalty discount"
            value={`-${formatPrice(loyaltyDiscount)}`}
            valueClass="text-[#08732B]"
          />
        )}
        {!isFedex && (
          <SummaryRow
            label={`Tax (${taxPercent.toFixed(2)}%)`}
            value={cart.tax > 0 ? formatPrice(cart.tax) : "$0"}
            strikeValue={
              cart.taxExempted != null && cart.taxExempted > 0
                ? formatPrice(cart.taxExempted)
                : null
            }
          />
        )}
        <SummaryRow label="Shipping & Handling" value={formatPrice(cart.shippingPrice)} />
        {cart.ccProcessingFee > 0 && (
          <SummaryRow label="CC processing fee (3%)" value={formatPrice(cart.ccProcessingFee)} />
        )}
        {creditsApplied && (
          <SummaryRow
            label="Credits applied"
            value={`-${formatPrice(cart.creditsUsed)}`}
            valueClass="text-[#22BB62]"
            extra={
              <button
                type="button"
                onClick={handleRemoveCredits}
                disabled={pending}
                className="text-[10px] font-semibold text-brand-primary underline cursor-pointer disabled:opacity-50"
              >
                Remove
              </button>
            }
          />
        )}
      </div>

      <div className="h-px bg-[#E0E3EB]" />
      
      <div className="flex items-center justify-between px-5">
        <span className="font-bold text-[15px] text-text-heading">Order Total</span>
        <span className="font-bold text-[18px] text-brand-primary">{formatPrice(orderTotal)}</span>
      </div>

      {isFedex && cart.estimatedTax > 0 && (
        <div className="text-[12px] text-[#08cb00] flex items-center justify-between px-5">
          <span>Estimated Tax and duties</span>
          <span>{formatPrice(cart.estimatedTax)}</span>
        </div>
      )}

      <div className="h-px bg-[#E0E3EB]" />

      <button
        type="button"
        onClick={() => setShippingDialogOpen(true)}
        className="flex items-start justify-between px-5 gap-3 text-left hover:bg-surface-overlay px-2 py-2 cursor-pointer transition-colors"
      >
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[11px] text-text-muted">Shipping to</span>
          <span className="text-[12px] font-semibold text-text-heading truncate">
            {shippingLabel}
          </span>
        </div>
        <img src="/assets/icons/chevron-right.svg" alt="" className="w-3 h-3 mt-1 shrink-0" />
      </button>

      <div className="h-px bg-[#E0E3EB]" />

      <button
        type="button"
        onClick={() => setPaymentDialogOpen(true)}
        className="flex items-start justify-between px-5 gap-3 text-left hover:bg-surface-overlay px-2 py-2 cursor-pointer transition-colors"
      >
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[11px] text-text-muted">Payment</span>
          <span className="text-[12px] font-semibold text-text-heading truncate">
            {paymentLabel}
          </span>
        </div>
        <img src="/assets/icons/chevron-right.svg" alt="" className="w-3 h-3 mt-1 shrink-0" />
      </button>

      <Button
        type="button"
        variant="primary"
        loading={pending}
        loadingText="Placing order…"
        onClick={handlePlaceOrder}
        className="rounded-pill mx-5 mb-3 mt-2"
      >
        Place Order
      </Button>

      {shippingDialogOpen && (
        <ChangeShippingDialog
          open={shippingDialogOpen}
          onClose={() => setShippingDialogOpen(false)}
          currentAddressId={firstAddressId}
          onSave={handleAddressSave}
          successMessage="Cart shipping address updated"
        />
      )}

      {paymentDialogOpen && (
        <ChangePaymentMethodDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          currentCardId={currentCardId}
          currentBankId={currentBankId}
          onSave={handlePaymentSave}
          successMessage="Cart payment method updated"
        />
      )}
    </aside>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  strikeValue?: string | null;
  valueClass?: string;
  extra?: React.ReactNode;
}

function SummaryRow({ label, value, strikeValue, valueClass, extra }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-text-primary">{label}</span>
        {extra}
      </div>
      <span className="flex items-center gap-2">
        {strikeValue && (
          <span className="text-text-muted line-through">{strikeValue}</span>
        )}
        <span className={`font-semibold ${valueClass ?? "text-text-heading"}`}>{value}</span>
      </span>
    </div>
  );
}

function buildShippingLabel(cart: Cart): string {
  const uniqueAddresses = new Set(cart.items.map((i) => i.userAddressId));
  if (uniqueAddresses.size > 1) return "Multiple addresses";
  return cart.items[0]?.userAddress.formatted ?? "—";
}

function buildPaymentLabel(cart: Cart): string {
  if (cart.userBankAccount) {
    return `STRIPEBANK ****${cart.userBankAccount.last4}`;
  }
  if (cart.userStripeSource) {
    return `${cart.userStripeSource.brand.toUpperCase()} ****${cart.userStripeSource.last4}`;
  }
  return "No payment method";
}
