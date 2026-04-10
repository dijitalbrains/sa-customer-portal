/**
 * Subscription-related calculation helpers
 *
 * Mirrors logic from sa-portal SubscriptionItem model and FilterRenewals.vue
 */

export type ValidityStatus = "PENDING" | "ACTIVE" | "EXPIRED";

export function getValidityStatus(
  endsAt: Date | null,
  startsAt: Date | null
): ValidityStatus {
  if (!startsAt) return "PENDING";
  if (!endsAt) return "ACTIVE";
  return new Date(endsAt) < new Date() ? "EXPIRED" : "ACTIVE";
}

export function getValidityTypeText(validityValue: number, validityType: string): string {
  const unit = validityType === "MONTHS" ? "month" : "week";
  return `Every ${validityValue} ${unit}${validityValue > 1 ? "s" : ""}`;
}

export function getProgressPercent(
  startsAt: Date | null,
  endsAt: Date | null
): number {
  if (!startsAt || !endsAt) return 0;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function getRemainingMonthsText(monthsRemaining: number | null): string | null {
  if (monthsRemaining == null) return null;
  return `${monthsRemaining} month${monthsRemaining !== 1 ? "s" : ""} remaining`;
}
