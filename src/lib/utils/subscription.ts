export type ValidityStatus = "PENDING" | "ACTIVE" | "EXPIRED";

export function getValidityStatus(endsAt: Date | null): ValidityStatus {
  if (!endsAt) return "PENDING";
  return new Date(endsAt) > new Date() ? "ACTIVE" : "EXPIRED";
}

export function getValidityTypeText(value: number, type: string): string {
  const unit = type.toLowerCase();
  return `Every ${value} ${value > 1 ? unit : unit.slice(0, -1)}`;
}

export function getProgressPercent(startsAt: Date | null, endsAt: Date | null): number {
  if (!startsAt || !endsAt) return 0;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function getRemainingMonthsText(months: number | null): string | null {
  if (months == null) return null;
  return `${months} month${months !== 1 ? "s" : ""} remaining`;
}
