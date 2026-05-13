const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const NUMERIC_DATE = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

export function formatShortDate(date: Date | null): string {
  if (!date) return "—";
  return SHORT_DATE.format(new Date(date));
}

export function formatLongDate(date: Date | null): string {
  if (!date) return "—";
  return LONG_DATE.format(new Date(date));
}

export function formatNumericDate(date: Date | null): string {
  if (!date) return "—";
  return NUMERIC_DATE.format(new Date(date)).replace(/\//g, ".");
}

export function formatShortDateTime(date: Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return `${SHORT_DATE.format(d)} \u2022 ${TIME.format(d)}`;
}

export function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}

export function addInterval(date: Date, value: number, unit: "MONTHS" | "WEEKS"): Date {
  const out = new Date(date);
  if (value <= 0) return out;
  if (unit === "MONTHS") out.setMonth(out.getMonth() + value);
  else out.setDate(out.getDate() + value * 7);
  return out;
}

export function getMonthsRemaining(endsAt: Date | null): number | null {
  if (!endsAt) return null;
  const now = new Date();
  const end = new Date(endsAt);
  if (end < now) return 0;
  const months =
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  return Math.max(0, months);
}
