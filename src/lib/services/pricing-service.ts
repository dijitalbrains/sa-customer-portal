import { round2 } from "@/lib/utils/currency";

export function formatLineLabel(name: string, quantity: number): string {
  return quantity > 1 ? `(${quantity}x) ${name}` : name;
}

export interface ItemSubtotalInput {
  quantity: number;
  linkedQuantity: number | null;
  productPrice: number;
  linkedPrice: number | null;
}

export function calculateItemSubtotal({
  quantity,
  linkedQuantity,
  productPrice,
  linkedPrice,
}: ItemSubtotalInput): number {
  const main = productPrice * quantity;
  const effectiveLinkedQty = (linkedQuantity ?? 1) * quantity;
  const linkedTotal = linkedPrice !== null ? linkedPrice * effectiveLinkedQty : 0;
  return round2(main + linkedTotal);
}

export interface LoyaltyInput {
  rawPrice: number | null;
  loyaltyDiscountUnit: "PERCENTAGE" | "AMOUNT" | null;
  loyaltyDiscountValue: number | null;
  isLoyaltyEnabled: boolean;
}

export interface LoyaltyPrice {
  price: number;
  actualPrice: number | null;
}

export function applyLoyaltyDiscount({
  rawPrice,
  loyaltyDiscountUnit,
  loyaltyDiscountValue,
  isLoyaltyEnabled,
}: LoyaltyInput): LoyaltyPrice {
  const price = rawPrice ?? 0;
  if (!isLoyaltyEnabled) return { price, actualPrice: null };

  const discountValue = Number(loyaltyDiscountValue ?? 0);
  const discountAmount =
    discountValue > 0
      ? loyaltyDiscountUnit === "PERCENTAGE"
        ? (price * discountValue) / 100
        : loyaltyDiscountUnit === "AMOUNT"
          ? discountValue
          : 0
      : 0;
  const discounted = Math.max(0, price - discountAmount);

  return { price: discounted, actualPrice: price };
}
