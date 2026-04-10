/**
 * Date formatting helpers
 */

export function formatLongDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDateTime(date: Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} \u2022 ${timePart}`;
}

export function getMonthsRemaining(endsAt: Date | null): number | null {
  if (!endsAt) return null;
  const now = new Date();
  const end = new Date(endsAt);
  if (end < now) return 0;
  const months =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth());
  return Math.max(0, months);
}
