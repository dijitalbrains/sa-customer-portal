import "server-only";
import { prisma } from "@/lib/prisma";
import { getRenewalDetail } from "@/lib/services/renewal-detail-service";
import { round2 } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import type { RenewalItem } from "@/lib/types/subscription";
import type {
  RenewalTimeline,
  RenewalTimelineDate,
  RenewalTimelineLine,
} from "@/lib/types/renewal-timeline";

const PROJECTION_YEARS = 5;
const MAX_OCCURRENCES = 600;

export async function getRenewalTimeline(
  userId: number,
): Promise<RenewalTimeline> {
  const subscriptionIds = await fetchUserSubscriptionIds(userId);
  const details = await Promise.all(
    subscriptionIds.map((id) => getRenewalDetail(id, userId, false)),
  );
  const items = details.flatMap((detail) => detail?.subscriptionItems ?? []);

  const now = new Date();
  return buildTimeline(items, now, addUtcYears(now, PROJECTION_YEARS));
}

function fetchUserSubscriptionIds(userId: number): Promise<number[]> {
  return prisma.subscriptions
    .findMany({
      where: { user_id: userId, deleted_at: null },
      select: { id: true },
    })
    .then((rows) => rows.map((row) => Number(row.id)));
}

function buildTimeline(
  items: RenewalItem[],
  now: Date,
  dateUntil: Date,
): RenewalTimeline {
  const linesByDate = new Map<string, RenewalTimelineLine[]>();
  const monthlyTotals: Record<string, number> = {};

  for (const item of items) {
    const step = item.validityValue * item.quantity;
    if (step <= 0) continue;

    let current = item.endsAt ? new Date(item.endsAt) : new Date(now);

    for (let occurrence = 0; occurrence < MAX_OCCURRENCES; occurrence++) {
      if (current.getTime() > dateUntil.getTime()) break;

      const dateKey = toDateKey(current);
      const lines = linesByDate.get(dateKey) ?? [];
      lines.push(toTimelineLine(item));
      linesByDate.set(dateKey, lines);

      const monthKey = dateKey.slice(0, 7);
      monthlyTotals[monthKey] = round2((monthlyTotals[monthKey] ?? 0) + item.total);

      current = advance(current, item.validityType, step);
    }
  }

  return {
    byDate: toSortedDates(linesByDate),
    years: buildYears(now),
    monthlyTotals,
  };
}

function toTimelineLine(item: RenewalItem): RenewalTimelineLine {
  return {
    name: item.productName,
    technology: item.subscription.technology,
    nickname: item.subscription.nickname,
    quantity: item.quantity,
    price: item.total,
  };
}

function toSortedDates(
  linesByDate: Map<string, RenewalTimelineLine[]>,
): RenewalTimelineDate[] {
  return [...linesByDate.keys()].sort().map((dateKey) => ({
    date: dateKey,
    display: toDisplay(dateKey),
    lines: linesByDate.get(dateKey) ?? [],
  }));
}

function buildYears(now: Date): number[] {
  const currentYear = now.getUTCFullYear();
  return Array.from({ length: PROJECTION_YEARS }, (_, index) => currentYear + index);
}

function advance(date: Date, type: "MONTHS" | "WEEKS", step: number): Date {
  const next = new Date(date);
  if (type === "WEEKS") {
    next.setUTCDate(next.getUTCDate() + step * 7);
  } else {
    next.setUTCMonth(next.getUTCMonth() + step);
  }
  return next;
}

function addUtcYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDisplay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return formatShortDate(new Date(Date.UTC(year, month - 1, day)));
}
