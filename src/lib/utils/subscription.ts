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

export function getSubscriptionTitle(subscription: {
  products: { technology: string | null; name: string };
  nickname: string | null;
}): string {
  const name = subscription.products.technology || subscription.products.name;
  return subscription.nickname ? `${name} | ${subscription.nickname}` : name;
}

export function hasPendingInstall(subscription: {
  subscription_items: { starts_at: Date | null; ends_at: Date | null }[];
}): boolean {
  return subscription.subscription_items.some(
    (item) => getValidityStatus(item.ends_at, item.starts_at) === "PENDING"
  );
}
