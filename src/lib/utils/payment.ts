export type CardStatus = "GOOD" | "EXPIRED" | "EXPIRING_SOON" | "FAILED";

export function getCardStatus(card: {
  has_failed: boolean;
  exp_month: string;
  exp_year: string;
}): CardStatus {
  if (card.has_failed) return "FAILED";

  const month = Number(card.exp_month);
  const year = Number(card.exp_year);
  if (!month || !year) return "GOOD";

  const expPlusOneMonth = new Date(year, month, 1);
  const now = new Date();
  const nowPlusOneMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (now > expPlusOneMonth) return "EXPIRED";
  if (expPlusOneMonth <= nowPlusOneMonth) return "EXPIRING_SOON";
  return "GOOD";
}

export function getCardStatusText(status: CardStatus): string {
  const map: Record<CardStatus, string> = {
    GOOD: "in good standing",
    EXPIRED: "expired",
    FAILED: "failed",
    EXPIRING_SOON: "expiring soon",
  };
  return map[status];
}

export function getCardBrandImage(brand: string): string {
  return `/assets/images/cc-brand/${brand.toLowerCase().replace(/\s+/g, "-")}.png`;
}
