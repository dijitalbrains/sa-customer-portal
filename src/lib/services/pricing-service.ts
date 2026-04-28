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
