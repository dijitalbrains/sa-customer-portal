const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
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

export function formatShortDateTime(date: Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return `${SHORT_DATE.format(d)} \u2022 ${TIME.format(d)}`;
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
